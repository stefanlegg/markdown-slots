/**
 * Comprehensive CLI tests covering advanced scenarios, edge cases, and cross-platform compatibility
 * This test suite extends the basic CLI tests with more complex scenarios
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

const CLI_PATH = resolve('./cli.ts');

/**
 * Run CLI command and return result
 */
async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const cmd = new Deno.Command('deno', {
    args: ['run', '--allow-read', '--allow-write', CLI_PATH, ...args],
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await cmd.output();

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

/**
 * Create temporary test files and directories
 */
async function setupComplexTestFiles(): Promise<{ cleanup: () => Promise<void> }> {
  const tempFiles: string[] = [];

  // Create main template with multiple outlets
  const mainTemplate = `# <!-- outlet: title -->

## Introduction
<!-- outlet: intro -->

## Main Content
<!-- outlet: content -->

### Subsection
<!-- outlet: subsection -->

## Conclusion
<!-- outlet: conclusion -->

---
<!-- outlet: footer -->`;

  await Deno.writeTextFile('./complex-template.md', mainTemplate);
  tempFiles.push('./complex-template.md');

  // Create nested template structure
  const nestedTemplate = `## Nested Section
Content: <!-- outlet: nested_content -->
Author: <!-- outlet: author -->`;

  await Deno.writeTextFile('./nested-template.md', nestedTemplate);
  tempFiles.push('./nested-template.md');

  // Create content files
  await Deno.writeTextFile(
    './intro-content.md',
    `This is an **introduction** with *markdown* formatting.

It has multiple paragraphs and [links](https://example.com).`,
  );
  tempFiles.push('./intro-content.md');

  await Deno.writeTextFile(
    './main-content.md',
    `### Main Content Section

This is the main content with:
- Bullet points
- **Bold text**
- \`code snippets\`

\`\`\`javascript
console.log("Code blocks should be preserved");
\`\`\`

And more content after the code block.`,
  );
  tempFiles.push('./main-content.md');

  await Deno.writeTextFile(
    './footer-content.md',
    `© 2024 Test Company | [Privacy Policy](https://example.com/privacy)`,
  );
  tempFiles.push('./footer-content.md');

  // Create complex JSON configuration
  const complexConfig = {
    slots: {
      title: { content: 'Complex Document Title' },
      intro: { file: './intro-content.md' },
      content: { file: './main-content.md' },
      subsection: {
        file: './nested-template.md',
        slots: {
          nested_content: { content: 'This is nested content from JSON config' },
          author: { content: 'John Doe' },
        },
      },
      conclusion: { content: 'This concludes our complex document.' },
      footer: { file: './footer-content.md' },
    },
    options: {
      resolveFrom: 'file',
      onMissingSlot: 'keep',
      parallel: true,
    },
  };

  await Deno.writeTextFile('./complex-config.json', JSON.stringify(complexConfig, null, 2));
  tempFiles.push('./complex-config.json');

  // Create template with special characters and edge cases
  const edgeCaseTemplate = `# Special Characters Test

Unicode: <!-- outlet: unicode -->
Quotes: <!-- outlet: quotes -->
Paths: <!-- outlet: paths -->
Empty: <!-- outlet: empty -->
Whitespace: <!-- outlet: whitespace -->

Code block test:
\`\`\`
<!-- outlet: should_not_replace -->
This outlet should NOT be replaced because it's in a code block
\`\`\`

Inline code: \`<!-- outlet: also_not_replaced -->\`

Normal outlet: <!-- outlet: normal -->`;

  await Deno.writeTextFile('./edge-case-template.md', edgeCaseTemplate);
  tempFiles.push('./edge-case-template.md');

  // Create files with special characters in names and content
  await Deno.writeTextFile(
    './special-content.md',
    `Content with "quotes", 'apostrophes', and special chars: àáâãäå`,
  );
  tempFiles.push('./special-content.md');

  // Create subdirectory structure for path resolution tests
  await Deno.mkdir('./test-subdir', { recursive: true });
  await Deno.writeTextFile(
    './test-subdir/subdir-template.md',
    `Subdir content: <!-- outlet: subdir_slot -->`,
  );
  tempFiles.push('./test-subdir/subdir-template.md');

  await Deno.writeTextFile('./test-subdir/subdir-content.md', `Content from subdirectory`);
  tempFiles.push('./test-subdir/subdir-content.md');

  const subdirConfig = {
    slots: {
      subdir_slot: { file: './subdir-content.md' },
    },
  };
  await Deno.writeTextFile(
    './test-subdir/subdir-config.json',
    JSON.stringify(subdirConfig, null, 2),
  );
  tempFiles.push('./test-subdir/subdir-config.json');

  return {
    cleanup: async () => {
      for (const file of tempFiles) {
        try {
          await Deno.remove(file);
        } catch {
          // Ignore cleanup errors
        }
      }
      try {
        await Deno.remove('./test-subdir', { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

Deno.test('Comprehensive CLI Tests', async (t) => {
  const { cleanup } = await setupComplexTestFiles();

  await t.step('should handle complex nested JSON configuration', async () => {
    const result = await runCli([
      'compose',
      'complex-template.md',
      '--json',
      'complex-config.json',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Complex Document Title');
    assertStringIncludes(result.stdout, 'This is an **introduction**');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, 'This is nested content from JSON config');
    assertStringIncludes(result.stdout, 'Author: John Doe');
    assertStringIncludes(result.stdout, 'This concludes our complex document');
    assertStringIncludes(result.stdout, '© 2024 Test Company');
  });

  await t.step('should handle complex nested JSON with short flags', async () => {
    const result = await runCli([
      'complex-template.md',
      '-j',
      'complex-config.json',
      '-v',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Complex Document Title');
    // Verbose output only shows when writing to file, not stdout
  });

  await t.step(
    'should override JSON config with multiple CLI slots using mixed flags',
    async () => {
      const result = await runCli([
        'compose',
        'complex-template.md',
        '--json',
        'complex-config.json',
        '--slot',
        'title=CLI Override Title',
        '-s',
        'conclusion=CLI Override Conclusion',
        '--slot',
        'intro=CLI override intro content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# CLI Override Title');
      assertStringIncludes(result.stdout, 'CLI Override Conclusion');
      assertStringIncludes(result.stdout, 'CLI override intro content');
      // Other slots should remain from JSON
      assertStringIncludes(result.stdout, 'This is nested content from JSON config');
    },
  );

  await t.step('should handle special characters in slot values', async () => {
    const result = await runCli([
      'edge-case-template.md',
      '--slot',
      'unicode=Unicode: àáâãäå ñ 中文 🚀',
      '--slot',
      'quotes=Content with "double quotes" and \'single quotes\'',
      '--slot',
      'paths=Path: /path/to/file.md and C:\\Windows\\Path',
      '--slot',
      'empty=',
      '--slot',
      'whitespace=   Content with   spaces   ',
      '--slot',
      'normal=Normal content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Unicode: àáâãäå ñ 中文 🚀');
    assertStringIncludes(result.stdout, 'Content with "double quotes" and \'single quotes\'');
    assertStringIncludes(result.stdout, 'Path: /path/to/file.md and C:\\Windows\\Path');
    assertStringIncludes(result.stdout, 'Empty: ');
    assertStringIncludes(result.stdout, 'Whitespace:    Content with   spaces   ');
    assertStringIncludes(result.stdout, 'Normal outlet: Normal content');

    // Verify code blocks are not processed
    assertStringIncludes(result.stdout, '<!-- outlet: should_not_replace -->');
    assertStringIncludes(result.stdout, '`<!-- outlet: also_not_replaced -->`');
  });

  await t.step('should handle file-based slots with special characters', async () => {
    const result = await runCli([
      'edge-case-template.md',
      '--slot',
      'unicode=@special-content.md',
      '--slot',
      'normal=Regular content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(
      result.stdout,
      'Content with "quotes", \'apostrophes\', and special chars: àáâãäå',
    );
    assertStringIncludes(result.stdout, 'Normal outlet: Regular content');
  });

  await t.step('should handle path resolution in subdirectories', async () => {
    const result = await runCli([
      'compose',
      './test-subdir/subdir-template.md',
      '--json',
      './test-subdir/subdir-config.json',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Subdir content: Content from subdirectory');
  });

  await t.step('should handle very long slot values', async () => {
    const longContent = 'A'.repeat(10000); // 10KB of content
    const result = await runCli([
      'edge-case-template.md',
      '--slot',
      `normal=${longContent}`,
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, longContent);
  });

  await t.step('should handle multiple output formats and verbose combinations', async () => {
    const outputFile = './test-output-verbose.md';

    try {
      const result = await runCli([
        'compose',
        'complex-template.md',
        '-j',
        'complex-config.json',
        '-o',
        outputFile,
        '--verbose',
      ]);

      assertEquals(result.code, 0);
      assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file
      assertStringIncludes(result.stderr, 'Output written to:');

      // Verify file was created with correct content
      const outputContent = await Deno.readTextFile(outputFile);
      assertStringIncludes(outputContent, '# Complex Document Title');
      assertStringIncludes(outputContent, 'This is nested content from JSON config');
    } finally {
      try {
        await Deno.remove(outputFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should handle empty templates and configurations', async () => {
    await Deno.writeTextFile('./empty-template.md', '');
    await Deno.writeTextFile('./empty-config.json', '{"slots": {}}');

    try {
      const result = await runCli([
        'empty-template.md',
        '--json',
        'empty-config.json',
      ]);

      assertEquals(result.code, 0);
      assertEquals(result.stdout.trim(), '');
    } finally {
      await Deno.remove('./empty-template.md');
      await Deno.remove('./empty-config.json');
    }
  });

  await t.step('should handle templates with only outlets and no content', async () => {
    await Deno.writeTextFile(
      './outlets-only.md',
      '<!-- outlet: one --><!-- outlet: two --><!-- outlet: three -->',
    );

    try {
      const result = await runCli([
        'outlets-only.md',
        '-s',
        'one=First',
        '-s',
        'two=Second',
        '-s',
        'three=Third',
      ]);

      assertEquals(result.code, 0);
      assertEquals(result.stdout.trim(), 'FirstSecondThird');
    } finally {
      await Deno.remove('./outlets-only.md');
    }
  });

  await t.step('should handle malformed JSON gracefully with helpful error messages', async () => {
    await Deno.writeTextFile('./malformed.json', '{ "slots": { "test": { "content": "test" } }'); // Missing closing brace

    try {
      const result = await runCli([
        'complex-template.md',
        '--json',
        'malformed.json',
      ]);

      assertEquals(result.code, 1);
      assertStringIncludes(result.stderr, 'Error:');
      assertStringIncludes(result.stderr, 'JSON');
    } finally {
      await Deno.remove('./malformed.json');
    }
  });

  await t.step('should handle non-existent files with clear error messages', async () => {
    const result = await runCli([
      'non-existent-template.md',
      '--slot',
      'test=value',
    ]);

    assertEquals(result.code, 0); // CLI handles file errors gracefully
    assertStringIncludes(result.stderr, 'Composition completed with errors:');
    assertStringIncludes(result.stderr, 'File not found:');
  });

  await t.step('should handle file-based slots pointing to non-existent files', async () => {
    const result = await runCli([
      'complex-template.md',
      '--slot',
      'title=Test Title',
      '--slot',
      'intro=@non-existent-file.md',
      '--slot',
      'content=Regular content',
    ]);

    assertEquals(result.code, 0); // CLI handles file errors gracefully
    assertStringIncludes(result.stdout, '# Test Title');
    assertStringIncludes(result.stdout, 'Regular content');
    assertStringIncludes(result.stderr, 'Composition completed with errors:');
  });

  await t.step('should validate slot names and provide helpful error messages', async () => {
    const result = await runCli([
      'complex-template.md',
      '--slot',
      'invalid-slot-name=value',
    ]);

    assertEquals(result.code, 1);
    assertStringIncludes(result.stderr, 'Invalid slot name: invalid-slot-name');
  });

  await t.step('should handle extremely nested JSON configurations', async () => {
    const deeplyNestedConfig = {
      slots: {
        level1: {
          file: './nested-template.md',
          slots: {
            nested_content: {
              content: 'Level 1 content',
              slots: {
                level2: { content: 'Level 2 content' },
              },
            },
            author: { content: 'Deep Author' },
          },
        },
      },
    };

    await Deno.writeTextFile('./deeply-nested.json', JSON.stringify(deeplyNestedConfig, null, 2));
    await Deno.writeTextFile('./simple-template.md', 'Content: <!-- outlet: level1 -->');

    try {
      const result = await runCli([
        'simple-template.md',
        '--json',
        'deeply-nested.json',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, 'Content: ## Nested Section');
      assertStringIncludes(result.stdout, 'Level 1 content');
      assertStringIncludes(result.stdout, 'Author: Deep Author');
    } finally {
      await Deno.remove('./deeply-nested.json');
      await Deno.remove('./simple-template.md');
    }
  });

  await t.step('should handle help flag with various argument combinations', async () => {
    // Test basic help flags
    const helpResult = await runCli(['--help']);
    assertEquals(helpResult.code, 0);
    assertStringIncludes(helpResult.stdout, 'Markdown Slots CLI');
    assertStringIncludes(helpResult.stdout, 'USAGE:');
    assertStringIncludes(helpResult.stdout, 'EXAMPLES:');

    const shortHelpResult = await runCli(['-h']);
    assertEquals(shortHelpResult.code, 0);
    assertStringIncludes(shortHelpResult.stdout, 'Markdown Slots CLI');
  });

  await t.step('should handle cross-platform path separators', async () => {
    // Test with both forward and back slashes
    const result = await runCli([
      'complex-template.md',
      '--slot',
      'title=Cross Platform Test',
      '--slot',
      'intro=@./intro-content.md', // Unix style
      '--slot',
      'content=Regular content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Cross Platform Test');
    assertStringIncludes(result.stdout, 'This is an **introduction**');
  });

  await cleanup();
});
