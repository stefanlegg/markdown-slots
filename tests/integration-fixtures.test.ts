import { assertEquals } from '@std/assert';
import { composeMarkdown } from '../src/compose.ts';
import type { MarkdownNode } from '../src/types.ts';

Deno.test('Integration Tests with Fixtures', async (t) => {
  await t.step('should compose complex documentation with file-based slots', async () => {
    const node: MarkdownNode = {
      file: 'tests/fixtures/main.md',
      slots: {
        header: { file: 'tests/fixtures/header.md', slots: { date: { content: '2024-01-15' } } },
        content: {
          file: 'tests/fixtures/content.md',
          slots: {
            features: { file: 'tests/fixtures/features.md' },
            usage: { file: 'tests/fixtures/usage.md' },
          },
        },
        footer: { file: 'tests/fixtures/footer.md' },
      },
    };

    const result = await composeMarkdown(node);
    const expectedResult = await Deno.readTextFile('tests/fixtures/expected-result.md');

    assertEquals(result.markdown, expectedResult);
    assertEquals(result.errors, undefined);
  });

  await t.step('should compose blog post with nested slots and dynamic content', async () => {
    const node: MarkdownNode = {
      file: 'tests/fixtures/blog-post.md',
      slots: {
        title: { content: 'Building Better Documentation' },
        metadata: {
          file: 'tests/fixtures/metadata.md',
          slots: {
            date: { content: 'March 15, 2024' },
            author: { content: 'Jane Developer' },
            tags: { content: 'documentation, markdown, tools' },
          },
        },
        content: {
          file: 'tests/fixtures/blog-content.md',
          slots: {
            sections: { file: 'tests/fixtures/sections.md' },
          },
        },
        'author-bio': {
          file: 'tests/fixtures/author-bio.md',
          slots: {
            'author-name': { content: 'Jane Developer' },
            'github-url': { content: 'https://github.com/jane-dev' },
          },
        },
      },
    };

    const result = await composeMarkdown(node);
    const expectedResult = await Deno.readTextFile('tests/fixtures/expected-blog-result.md');

    assertEquals(result.markdown, expectedResult);
    assertEquals(result.errors, undefined);
  });

  await t.step('should compose with function-based dynamic content', async () => {
    const currentYear = new Date().getFullYear();

    const node: MarkdownNode = {
      content: `# Dynamic Report

Generated on: <!-- outlet: timestamp -->
Year: <!-- outlet: year -->

<!-- outlet: stats -->`,
      slots: {
        timestamp: () => Promise.resolve('2024-03-15 10:30:00'),
        year: () => currentYear.toString(),
        stats: {
          content: `## Statistics

- Total files processed: <!-- outlet: file-count -->
- Success rate: <!-- outlet: success-rate -->`,
          slots: {
            'file-count': () => Promise.resolve('1,234'),
            'success-rate': () => Promise.resolve('98.5%'),
          },
        },
      },
    };

    const result = await composeMarkdown(node);

    const expectedContent = `# Dynamic Report

Generated on: 2024-03-15 10:30:00
Year: ${currentYear}

## Statistics

- Total files processed: 1,234
- Success rate: 98.5%`;

    assertEquals(result.markdown, expectedContent);
    assertEquals(result.errors, undefined);
  });

  await t.step('should handle mixed content and file sources with relative paths', async () => {
    const node: MarkdownNode = {
      content: `# Mixed Content Example

<!-- outlet: intro -->

<!-- outlet: file-content -->

<!-- outlet: conclusion -->`,
      slots: {
        intro: { content: 'This example demonstrates mixing content and file sources.' },
        'file-content': { file: 'tests/fixtures/features.md' },
        conclusion: { content: 'End of mixed content example.' },
      },
    };

    const result = await composeMarkdown(node);

    const expectedContent = `# Mixed Content Example

This example demonstrates mixing content and file sources.

- ✅ Slot-based composition
- ✅ File and content sources
- ✅ Function-based dynamic content
- ✅ Circular dependency detection
- ✅ Configurable error handling

End of mixed content example.`;

    assertEquals(result.markdown, expectedContent);
    assertEquals(result.errors, undefined);
  });

  await t.step('should preserve code blocks in fixture files', async () => {
    // This test verifies that code blocks in the usage.md fixture are preserved
    const result = await composeMarkdown({
      file: 'tests/fixtures/usage.md',
    });

    // Should contain the TypeScript code block
    assertEquals(result.markdown.includes('```typescript'), true);
    assertEquals(result.markdown.includes('import { composeMarkdown }'), true);
    assertEquals(result.markdown.includes('```'), true);
    assertEquals(result.errors, undefined);
  });

  await t.step('should handle file resolution from different base paths', async () => {
    // Test resolving files relative to the current file location
    const node: MarkdownNode = {
      file: 'tests/fixtures/main.md',
      slots: {
        header: { content: 'Simple Header' },
        content: { file: './features.md' }, // Relative to tests/fixtures/
        footer: { content: 'Simple Footer' },
      },
    };

    const result = await composeMarkdown(node, { resolveFrom: 'file' });

    // Should successfully resolve and include the features content
    assertEquals(result.markdown.includes('✅ Slot-based composition'), true);
    assertEquals(result.markdown.includes('✅ Function-based dynamic content'), true);
    assertEquals(result.errors, undefined);
  });

  await t.step('should detect circular dependencies in fixture files', async () => {
    const node: MarkdownNode = {
      file: 'tests/fixtures/circular-a.md',
      slots: {
        content: {
          file: 'tests/fixtures/circular-b.md',
          slots: {
            content: { file: 'tests/fixtures/circular-a.md' }, // Creates circular dependency
          },
        },
      },
    };

    const result = await composeMarkdown(node);

    // Should detect the circular dependency
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'circular-dependency');
    assertEquals(result.markdown.includes('Circular dependency detected'), true);
  });

  await t.step('should handle missing slots in fixture files', async () => {
    const node: MarkdownNode = {
      file: 'tests/fixtures/missing-slots.md',
      slots: {
        existing: { content: 'This slot exists!' },
        // missing and another-missing slots are intentionally not provided
      },
    };

    const result = await composeMarkdown(node);

    // Should have errors for missing slots
    assertEquals(result.errors?.length, 2);
    assertEquals(result.errors?.[0].type, 'missing-slot');
    assertEquals(result.errors?.[1].type, 'missing-slot');

    // Should preserve missing slot markers by default
    assertEquals(result.markdown.includes('<!-- slot: missing -->'), true);
    assertEquals(result.markdown.includes('<!-- slot: another-missing -->'), true);

    // Should replace the existing slot
    assertEquals(result.markdown.includes('This slot exists!'), true);
  });

  await t.step('should handle missing files in fixture composition', async () => {
    const node: MarkdownNode = {
      file: 'tests/fixtures/main.md',
      slots: {
        header: { file: 'tests/fixtures/non-existent.md' },
        content: { content: 'Some content' },
        footer: { content: 'Footer' },
      },
    };

    const result = await composeMarkdown(node);

    // Should include error comment in output (default behavior)
    assertEquals(result.markdown.includes('<!-- Error: File not found'), true);
    assertEquals(result.markdown.includes('non-existent.md'), true);

    // Should still compose the rest of the content
    assertEquals(result.markdown.includes('Some content'), true);
    assertEquals(result.markdown.includes('Footer'), true);
  });

  await t.step(
    'should collect errors when using warn-empty mode with missing main file',
    async () => {
      const node: MarkdownNode = {
        file: 'tests/fixtures/non-existent-main.md',
      };

      const result = await composeMarkdown(node, { onFileError: 'warn-empty' });

      // Should have error for missing file
      assertEquals(result.errors?.length, 1);
      assertEquals(result.errors?.[0].type, 'file-error');
      assertEquals(result.errors?.[0].message.includes('File not found'), true);

      // Should use empty content for missing file
      assertEquals(result.markdown, '');
    },
  );

  await t.step('should handle missing slot files with different error modes', async () => {
    const node: MarkdownNode = {
      content: '# Test\n\n<!-- outlet: missing-file -->',
      slots: {
        'missing-file': { file: 'tests/fixtures/non-existent.md' },
      },
    };

    // Default mode - should include error comment
    const result1 = await composeMarkdown(node);
    assertEquals(result1.markdown.includes('<!-- Error: File not found'), true);

    // warn-empty mode - should use empty content and not show error comment
    const result2 = await composeMarkdown(node, { onFileError: 'warn-empty' });
    assertEquals(result2.markdown.includes('<!-- Error:'), false);
    assertEquals(result2.markdown, '# Test\n\n');
    // Note: Error collection for slot files might work differently than main files
  });
});
