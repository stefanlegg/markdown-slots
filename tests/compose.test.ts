import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { composeMarkdown } from '../src/compose.ts';
import type { MarkdownNode } from '../src/types.ts';

Deno.test('composeMarkdown', async (t) => {
  await t.step('should validate input parameters', async () => {
    // Test null/undefined node
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(null as any),
      Error,
      'MarkdownNode is required',
    );

    // Test non-object node
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown('invalid' as any),
      Error,
      'MarkdownNode must be an object',
    );

    // Test node without content or file
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown({} as any),
      Error,
      'MarkdownNode must have either content or file property',
    );

    // Test invalid content type
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown({ content: 123 } as any),
      Error,
      'MarkdownNode content must be a string',
    );

    // Test invalid file type
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown({ file: 123 } as any),
      Error,
      'MarkdownNode file must be a string',
    );
  });

  await t.step('should validate options parameters', async () => {
    const validNode: MarkdownNode = { content: 'test' };

    // Test invalid maxDepth
    await assertRejects(
      () => composeMarkdown(validNode, { maxDepth: -1 }),
      Error,
      'maxDepth must be a non-negative number',
    );

    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { maxDepth: 'invalid' as any }),
      Error,
      'maxDepth must be a non-negative number',
    );

    // Test invalid onMissingSlot
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { onMissingSlot: 'invalid' as any }),
      Error,
      'onMissingSlot must be one of: error, ignore, keep',
    );

    // Test invalid onFileError
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { onFileError: 'invalid' as any }),
      Error,
      'onFileError must be one of: throw, warn-empty',
    );

    // Test invalid resolveFrom
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { resolveFrom: 'invalid' as any }),
      Error,
      'resolveFrom must be one of: cwd, file',
    );

    // Test invalid parallel
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { parallel: 'invalid' as any }),
      Error,
      'parallel must be a boolean',
    );

    // Test invalid cache
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => composeMarkdown(validNode, { cache: 'invalid' as any }),
      Error,
      'cache must be a Map instance',
    );
  });

  await t.step('should compose basic content', async () => {
    const node: MarkdownNode = {
      content: '# Hello World\n\nThis is a test.',
    };

    const result = await composeMarkdown(node);
    assertEquals(result.markdown, '# Hello World\n\nThis is a test.');
    assertEquals(result.errors, undefined);
  });

  await t.step('should compose content with slots', async () => {
    const node: MarkdownNode = {
      content: '# Title\n\n<!-- outlet: intro -->\n\n<!-- outlet: conclusion -->',
      slots: {
        intro: { content: 'This is the introduction.' },
        conclusion: { content: 'This is the conclusion.' },
      },
    };

    const result = await composeMarkdown(node);
    assertEquals(
      result.markdown,
      '# Title\n\nThis is the introduction.\n\nThis is the conclusion.',
    );
    assertEquals(result.errors, undefined);
  });

  await t.step('should work with file-based content', async () => {
    // Create a temporary test file
    const testFile = './test_compose_file.md';
    const testContent = '# File Content\n\nFrom file system.';
    await Deno.writeTextFile(testFile, testContent);

    try {
      const node: MarkdownNode = {
        file: testFile,
      };

      const result = await composeMarkdown(node);
      assertEquals(result.markdown, testContent);
      assertEquals(result.errors, undefined);
    } finally {
      // Clean up
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should handle complex nested composition', async () => {
    // Create test files
    const headerFile = './test_header.md';
    const navFile = './test_nav.md';
    const contentFile = './test_content.md';

    await Deno.writeTextFile(headerFile, '# Header\n\n<!-- outlet: nav -->');
    await Deno.writeTextFile(navFile, 'Navigation: Home | About | Contact');
    await Deno.writeTextFile(contentFile, 'Main content here.');

    try {
      const node: MarkdownNode = {
        content: '<!-- outlet: header -->\n\n<!-- outlet: content -->',
        slots: {
          header: {
            file: headerFile,
            slots: {
              nav: { file: navFile },
            },
          },
          content: { file: contentFile },
        },
      };

      const result = await composeMarkdown(node);
      assertEquals(
        result.markdown,
        '# Header\n\nNavigation: Home | About | Contact\n\nMain content here.',
      );
      assertEquals(result.errors, undefined);
    } finally {
      // Clean up
      try {
        await Deno.remove(headerFile);
        await Deno.remove(navFile);
        await Deno.remove(contentFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should handle function-based slots', async () => {
    const node: MarkdownNode = {
      content: '# Dynamic Content\n\n<!-- outlet: timestamp -->',
      slots: {
        timestamp: () => Promise.resolve(`Generated at ${new Date().getFullYear()}`),
      },
    };

    const result = await composeMarkdown(node);
    assertStringIncludes(result.markdown, 'Generated at');
    assertEquals(result.errors, undefined);
  });

  await t.step('should handle function errors in main compose API', async () => {
    const node: MarkdownNode = {
      content: '# Content\n\n<!-- outlet: failing -->',
      slots: {
        failing: () => {
          throw new Error('Function failed');
        },
      },
    };

    const result = await composeMarkdown(node);
    assertStringIncludes(
      result.markdown,
      '<!-- Error: Function execution failed: Function failed -->',
    );
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'function-error');
    assertEquals(result.errors?.[0].message, 'Function execution failed: Function failed');
  });

  await t.step('should handle missing files with different error modes', async () => {
    const node: MarkdownNode = {
      file: './non_existent_file.md',
    };

    // Default behavior (should include error comment)
    const result1 = await composeMarkdown(node);
    assertStringIncludes(result1.markdown, '<!-- Error: File not found');
    assertEquals(result1.errors?.length, 1);
    assertEquals(result1.errors?.[0].type, 'file-error');

    // warn-empty mode
    const result2 = await composeMarkdown(node, { onFileError: 'warn-empty' });
    assertEquals(result2.markdown, '');
    assertEquals(result2.errors?.length, 1);

    // throw mode - should throw when file doesn't exist
    await assertRejects(
      () => composeMarkdown(node, { onFileError: 'throw' }),
      Error,
    );
  });

  await t.step('should handle missing slots with different modes', async () => {
    const node: MarkdownNode = {
      content: '# Title\n\n<!-- outlet: missing -->',
      slots: {},
    };

    // Default behavior (keep outlet)
    const result1 = await composeMarkdown(node);
    assertEquals(result1.markdown, '# Title\n\n<!-- outlet: missing -->');
    assertEquals(result1.errors?.length, 1);
    assertEquals(result1.errors?.[0].type, 'missing-slot');

    // ignore mode
    const result2 = await composeMarkdown(node, { onMissingSlot: 'ignore' });
    assertEquals(result2.markdown, '# Title\n\n');
    assertEquals(result2.errors?.length, 1);

    // error mode - should throw when slot is missing
    await assertRejects(
      () => composeMarkdown(node, { onMissingSlot: 'error' }),
      Error,
    );
  });

  await t.step('should support caching', async () => {
    const cache = new Map<string, string>();
    const testFile = './test_cache_file.md';
    const testContent = 'Cached content test';

    await Deno.writeTextFile(testFile, testContent);

    try {
      const node: MarkdownNode = {
        file: testFile,
      };

      // First call should populate cache
      const result1 = await composeMarkdown(node, { cache });
      assertEquals(result1.markdown, testContent);
      assertEquals(cache.size, 1);

      // Second call should use cache
      const result2 = await composeMarkdown(node, { cache });
      assertEquals(result2.markdown, testContent);
      assertEquals(cache.size, 1); // Should still be 1
    } finally {
      // Clean up
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should support parallel processing', async () => {
    // Create test files
    const file1 = './test_parallel_1.md';
    const file2 = './test_parallel_2.md';

    await Deno.writeTextFile(file1, 'Content 1');
    await Deno.writeTextFile(file2, 'Content 2');

    try {
      const node: MarkdownNode = {
        content: '<!-- outlet: slot1 --> and <!-- outlet: slot2 -->',
        slots: {
          slot1: { file: file1 },
          slot2: { file: file2 },
        },
      };

      const result = await composeMarkdown(node, { parallel: true });
      assertEquals(result.markdown, 'Content 1 and Content 2');
      assertEquals(result.errors, undefined);
    } finally {
      // Clean up
      try {
        await Deno.remove(file1);
        await Deno.remove(file2);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should handle circular dependencies', async () => {
    const file1 = './test_circular_1.md';
    const file2 = './test_circular_2.md';

    await Deno.writeTextFile(file1, '# File 1\n\n<!-- outlet: content -->');
    await Deno.writeTextFile(file2, '# File 2\n\n<!-- outlet: content -->');

    try {
      const node: MarkdownNode = {
        file: file1,
        slots: {
          content: {
            file: file2,
            slots: {
              content: { file: file1 }, // Circular dependency
            },
          },
        },
      };

      const result = await composeMarkdown(node);
      assertStringIncludes(result.markdown, 'Circular dependency detected');
      assertEquals(result.errors?.length, 1);
      assertEquals(result.errors?.[0].type, 'circular-dependency');
    } finally {
      // Clean up
      try {
        await Deno.remove(file1);
        await Deno.remove(file2);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should enforce depth limits', async () => {
    // Create test files for depth testing
    const level1File = './test_level1.md';
    const level2File = './test_level2.md';
    const level3File = './test_level3.md';
    const level4File = './test_level4.md';

    await Deno.writeTextFile(level1File, '# Level 1\n\n<!-- outlet: next -->');
    await Deno.writeTextFile(level2File, '# Level 2\n\n<!-- outlet: next -->');
    await Deno.writeTextFile(level3File, '# Level 3\n\n<!-- outlet: next -->');
    await Deno.writeTextFile(level4File, '# Level 4');

    try {
      const node: MarkdownNode = {
        file: level1File,
        slots: {
          next: {
            file: level2File,
            slots: {
              next: {
                file: level3File,
                slots: {
                  next: { file: level4File },
                },
              },
            },
          },
        },
      };

      const result = await composeMarkdown(node, { maxDepth: 2 });
      assertStringIncludes(result.markdown, 'Maximum composition depth');
      assertEquals(result.errors?.length, 1);
      assertEquals(result.errors?.[0].type, 'max-depth');
    } finally {
      // Clean up
      try {
        await Deno.remove(level1File);
        await Deno.remove(level2File);
        await Deno.remove(level3File);
        await Deno.remove(level4File);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should preserve code blocks during composition', async () => {
    const node: MarkdownNode = {
      content: `# Code Example

\`\`\`markdown
<!-- outlet: example -->
\`\`\`

<!-- outlet: real -->`,
      slots: {
        real: { content: 'This is real content.' },
      },
    };

    const result = await composeMarkdown(node);
    assertStringIncludes(result.markdown, '<!-- outlet: example -->'); // Should be preserved in code block
    assertStringIncludes(result.markdown, 'This is real content.'); // Should be replaced
    assertEquals(result.errors, undefined);
  });
});
