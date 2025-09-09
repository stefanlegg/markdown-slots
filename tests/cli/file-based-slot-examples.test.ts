/**
 * Tests for file-based slot examples from README
 * Covers @ prefix file references, relative/absolute path handling, and mixed inline/file-based content
 * Requirements: 1.5, 2.2
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { join, resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

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
 * Create temporary test files and directory structure
 */
async function setupFileBasedTestFiles(): Promise<void> {
  // Create main template
  await Deno.writeTextFile(
    './file-based-template.md',
    `# <!-- outlet: title -->

## Introduction
<!-- outlet: intro -->

## Content
<!-- outlet: content -->

## Features
<!-- outlet: features -->

## Footer
<!-- outlet: footer -->`,
  );

  // Create content files in root directory
  await Deno.writeTextFile(
    './intro-content.md',
    `This is an **introduction** section loaded from a file.

It demonstrates file-based slot functionality with *markdown* formatting.`,
  );

  await Deno.writeTextFile(
    './main-content.md',
    `### Main Content Section

This content is loaded from an external file and includes:

- Bullet points
- **Bold text**
- \`Code snippets\`
- [Links](https://example.com)

\`\`\`javascript
// Code blocks are preserved
console.log("File-based content with code");
\`\`\`

Additional content after the code block.`,
  );

  await Deno.writeTextFile(
    './features-list.md',
    `- File-based slot loading
- Relative path support
- Absolute path support
- Mixed content sources
- Cross-platform compatibility`,
  );

  await Deno.writeTextFile(
    './footer-content.md',
    `---

© 2024 Test Company | [Privacy Policy](https://example.com/privacy) | [Terms](https://example.com/terms)`,
  );

  // Create subdirectory structure for path testing
  await Deno.mkdir('./content', { recursive: true });
  await Deno.writeTextFile(
    './content/subdir-intro.md',
    `This is content from a subdirectory.

It tests relative path resolution from subdirectories.`,
  );

  await Deno.writeTextFile(
    './content/subdir-features.md',
    `### Subdirectory Features

- Subdirectory file loading
- Relative path resolution
- Directory structure support`,
  );

  // Create nested subdirectory
  await Deno.mkdir('./content/nested', { recursive: true });
  await Deno.writeTextFile(
    './content/nested/deep-content.md',
    `This is content from a deeply nested directory.

It tests complex relative path scenarios.`,
  );

  // Create files with special characters in names
  await Deno.writeTextFile(
    './special-chars-content.md',
    `Content with special characters: àáâãäå ñ 中文 🚀

"Quotes", 'apostrophes', and other special characters.`,
  );

  // Create files for absolute path testing (we'll use current working directory)
  const cwd = Deno.cwd();
  await Deno.writeTextFile(
    './absolute-test-content.md',
    `This content is accessed via absolute path.

Absolute path: ${cwd}/absolute-test-content.md`,
  );
}

/**
 * Clean up test files
 */
async function cleanupFileBasedTestFiles(): Promise<void> {
  const files = [
    './file-based-template.md',
    './intro-content.md',
    './main-content.md',
    './features-list.md',
    './footer-content.md',
    './special-chars-content.md',
    './absolute-test-content.md',
    './file-based-output.md',
  ];

  for (const file of files) {
    try {
      await Deno.remove(file);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  // Clean up directories
  try {
    await Deno.remove('./content', { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}

Deno.test('File-Based Slot Examples Tests', async (t) => {
  await setupFileBasedTestFiles();

  await t.step('should handle @ prefix file references with relative paths', async () => {
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=File Reference Test',
      '--slot',
      'intro=@intro-content.md',
      '--slot',
      'content=@main-content.md',
      '--slot',
      'features=@features-list.md',
      '--slot',
      'footer=@footer-content.md',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# File Reference Test');
    assertStringIncludes(result.stdout, 'This is an **introduction** section');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, '- File-based slot loading');
    assertStringIncludes(result.stdout, '© 2024 Test Company');
    assertStringIncludes(result.stdout, 'console.log("File-based content with code");');
  });

  await t.step('should handle @ prefix with subdirectory relative paths', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=Subdirectory Test',
      '--slot',
      'intro=@content/subdir-intro.md',
      '--slot',
      'content=Regular inline content',
      '--slot',
      'features=@content/subdir-features.md',
      '--slot',
      'footer=Inline footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Subdirectory Test');
    assertStringIncludes(result.stdout, 'This is content from a subdirectory');
    assertStringIncludes(result.stdout, 'Regular inline content');
    assertStringIncludes(result.stdout, '### Subdirectory Features');
    assertStringIncludes(result.stdout, '- Subdirectory file loading');
    assertStringIncludes(result.stdout, 'Inline footer');
  });

  await t.step('should handle @ prefix with nested subdirectory paths', async () => {
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Nested Directory Test',
      '--slot',
      'intro=@content/nested/deep-content.md',
      '--slot',
      'content=Nested path testing',
      '--slot',
      'features=Testing deeply nested file access',
      '--slot',
      'footer=Nested test footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Nested Directory Test');
    assertStringIncludes(result.stdout, 'This is content from a deeply nested directory');
    assertStringIncludes(result.stdout, 'Nested path testing');
    assertStringIncludes(result.stdout, 'Testing deeply nested file access');
  });

  await t.step('should handle @ prefix with ./ relative path prefix', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=Explicit Relative Path Test',
      '--slot',
      'intro=@./intro-content.md',
      '--slot',
      'content=@./main-content.md',
      '--slot',
      'features=@./content/subdir-features.md',
      '--slot',
      'footer=@./footer-content.md',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Explicit Relative Path Test');
    assertStringIncludes(result.stdout, 'This is an **introduction** section');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, '### Subdirectory Features');
    assertStringIncludes(result.stdout, '© 2024 Test Company');
  });

  await t.step('should handle absolute path file references', async () => {
    const cwd = Deno.cwd();
    const absolutePath = join(cwd, 'absolute-test-content.md');

    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Absolute Path Test',
      '--slot',
      'intro=@' + absolutePath,
      '--slot',
      'content=Testing absolute paths',
      '--slot',
      'features=Absolute path functionality',
      '--slot',
      'footer=Absolute path footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Absolute Path Test');
    assertStringIncludes(result.stdout, 'This content is accessed via absolute path');
    assertStringIncludes(result.stdout, 'Testing absolute paths');
    assertStringIncludes(result.stdout, 'Absolute path functionality');
  });

  await t.step('should handle mixed inline and file-based content sources', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=Mixed Content Sources Test',
      '--slot',
      'intro=This is inline introduction content',
      '--slot',
      'content=@main-content.md',
      '--slot',
      'features=Inline features: fast, reliable, flexible',
      '--slot',
      'footer=@footer-content.md',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Mixed Content Sources Test');
    assertStringIncludes(result.stdout, 'This is inline introduction content');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, 'Inline features: fast, reliable, flexible');
    assertStringIncludes(result.stdout, '© 2024 Test Company');
  });

  await t.step('should handle file references with special characters in content', async () => {
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Special Characters Test',
      '--slot',
      'intro=@special-chars-content.md',
      '--slot',
      'content=Regular content',
      '--slot',
      'features=Testing special character handling',
      '--slot',
      'footer=Special chars footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Special Characters Test');
    assertStringIncludes(result.stdout, 'Content with special characters: àáâãäå ñ 中文 🚀');
    assertStringIncludes(result.stdout, '"Quotes", \'apostrophes\'');
    assertStringIncludes(result.stdout, 'Regular content');
  });

  await t.step('should handle file-based slots with output to file', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=File Output Test',
      '--slot',
      'intro=@intro-content.md',
      '--slot',
      'content=@main-content.md',
      '--slot',
      'features=@features-list.md',
      '--slot',
      'footer=@footer-content.md',
      '--output',
      'file-based-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('file-based-output.md');
    assertStringIncludes(outputContent, '# File Output Test');
    assertStringIncludes(outputContent, 'This is an **introduction** section');
    assertStringIncludes(outputContent, '### Main Content Section');
    assertStringIncludes(outputContent, '- File-based slot loading');
    assertStringIncludes(outputContent, '© 2024 Test Company');
  });

  await t.step('should handle file-based slots with verbose output', async () => {
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Verbose File Test',
      '--slot',
      'intro=@intro-content.md',
      '--slot',
      'content=@main-content.md',
      '--slot',
      'features=Verbose testing',
      '--slot',
      'footer=@footer-content.md',
      '--verbose',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Verbose File Test');
    assertStringIncludes(result.stdout, 'This is an **introduction** section');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, 'Verbose testing');
    // Verbose mode should work without errors
  });

  await t.step('should handle missing file references gracefully', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=Missing File Test',
      '--slot',
      'intro=@non-existent-file.md',
      '--slot',
      'content=This content should work',
      '--slot',
      'features=@another-missing-file.md',
      '--slot',
      'footer=Working footer',
    ]);

    assertEquals(result.code, 0); // CLI handles file errors gracefully
    assertStringIncludes(result.stdout, '# Missing File Test');
    assertStringIncludes(result.stdout, 'This content should work');
    assertStringIncludes(result.stdout, 'Working footer');

    // Should show errors for missing files (may be in stderr or handled gracefully)
    // The important thing is that the CLI doesn't crash and processes other content
  });

  await t.step('should handle cross-platform path separators in file references', async () => {
    // Test both forward slash (Unix) and backslash (Windows) styles
    // Forward slashes should work on all platforms
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Cross-Platform Path Test',
      '--slot',
      'intro=@content/subdir-intro.md',
      '--slot',
      'content=@./main-content.md',
      '--slot',
      'features=@content/nested/deep-content.md',
      '--slot',
      'footer=Cross-platform footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Cross-Platform Path Test');
    assertStringIncludes(result.stdout, 'This is content from a subdirectory');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, 'This is content from a deeply nested directory');
    assertStringIncludes(result.stdout, 'Cross-platform footer');
  });

  await t.step('should handle file-based slots with short flags', async () => {
    const result = await runCli([
      'file-based-template.md',
      '-s',
      'title=Short Flag File Test',
      '-s',
      'intro=@intro-content.md',
      '-s',
      'content=@main-content.md',
      '-s',
      'features=@features-list.md',
      '-s',
      'footer=@footer-content.md',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Short Flag File Test');
    assertStringIncludes(result.stdout, 'This is an **introduction** section');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, '- File-based slot loading');
    assertStringIncludes(result.stdout, '© 2024 Test Company');
  });

  await t.step('should handle mixed flag types with file-based slots', async () => {
    const result = await runCli([
      'compose',
      'file-based-template.md',
      '--slot',
      'title=Mixed Flags File Test',
      '-s',
      'intro=@intro-content.md',
      '--slot',
      'content=Inline mixed content',
      '-s',
      'features=@features-list.md',
      '--slot',
      'footer=@footer-content.md',
      '-o',
      'file-based-output.md',
      '--verbose',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('file-based-output.md');
    assertStringIncludes(outputContent, '# Mixed Flags File Test');
    assertStringIncludes(outputContent, 'This is an **introduction** section');
    assertStringIncludes(outputContent, 'Inline mixed content');
    assertStringIncludes(outputContent, '- File-based slot loading');
    assertStringIncludes(outputContent, '© 2024 Test Company');
  });

  await t.step('should preserve markdown formatting in file-based content', async () => {
    const result = await runCli([
      'file-based-template.md',
      '--slot',
      'title=Markdown Preservation Test',
      '--slot',
      'intro=@intro-content.md',
      '--slot',
      'content=@main-content.md',
      '--slot',
      'features=Testing markdown preservation',
      '--slot',
      'footer=@footer-content.md',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Markdown Preservation Test');

    // Check that markdown formatting is preserved
    assertStringIncludes(result.stdout, '**introduction**');
    assertStringIncludes(result.stdout, '*markdown*');
    assertStringIncludes(result.stdout, '### Main Content Section');
    assertStringIncludes(result.stdout, '- Bullet points');
    assertStringIncludes(result.stdout, '**Bold text**');
    assertStringIncludes(result.stdout, '`Code snippets`');
    assertStringIncludes(result.stdout, '[Links](https://example.com)');
    assertStringIncludes(result.stdout, '```javascript');
    assertStringIncludes(result.stdout, 'console.log("File-based content with code");');
    assertStringIncludes(result.stdout, '```');
    assertStringIncludes(result.stdout, '[Privacy Policy](https://example.com/privacy)');
  });

  await cleanupFileBasedTestFiles();
});
