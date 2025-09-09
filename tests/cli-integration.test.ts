/**
 * Integration tests for CLI functionality
 * Tests the complete CLI workflow end-to-end
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

const CLI_PATH = resolve('./cli.ts');
const _TEST_DIR = resolve('./tests/fixtures');

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
 * Create temporary test files
 */
async function setupTestFiles(): Promise<void> {
  // Create test template
  await Deno.writeTextFile(
    './test-cli-template.md',
    `# <!-- outlet: title -->

Welcome to the test!

## Content

<!-- outlet: content -->

## Footer

<!-- outlet: footer -->`,
  );

  // Create test content file
  await Deno.writeTextFile(
    './test-cli-content.md',
    `This is test content from a file.

It has **markdown** formatting.`,
  );

  // Create test JSON config
  await Deno.writeTextFile(
    './test-cli-config.json',
    JSON.stringify(
      {
        slots: {
          title: { content: 'JSON Config Title' },
          content: { file: './test-cli-content.md' },
          footer: { content: '© 2024 JSON Config' },
        },
      },
      null,
      2,
    ),
  );
}

/**
 * Clean up test files
 */
async function cleanupTestFiles(): Promise<void> {
  const files = [
    './test-cli-template.md',
    './test-cli-content.md',
    './test-cli-config.json',
    './test-cli-output.md',
  ];

  for (const file of files) {
    try {
      await Deno.remove(file);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

Deno.test('CLI Integration Tests', async (t) => {
  await setupTestFiles();

  await t.step('should show help with --help flag', async () => {
    const result = await runCli(['--help']);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Markdown Slots CLI');
    assertStringIncludes(result.stdout, 'USAGE:');
    assertStringIncludes(result.stdout, 'OPTIONS:');
    assertStringIncludes(result.stdout, 'EXAMPLES:');
  });

  await t.step('should show help with -h flag', async () => {
    const result = await runCli(['-h']);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Markdown Slots CLI');
  });

  await t.step('should compose with inline slots using long flags', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--slot',
      'title=Long Flag Title',
      '--slot',
      'content=Long flag content',
      '--slot',
      'footer=Long flag footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Long Flag Title');
    assertStringIncludes(result.stdout, 'Long flag content');
    assertStringIncludes(result.stdout, 'Long flag footer');
  });

  await t.step('should compose with inline slots using short flags', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '-s',
      'title=Short Flag Title',
      '-s',
      'content=Short flag content',
      '-s',
      'footer=Short flag footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Short Flag Title');
    assertStringIncludes(result.stdout, 'Short flag content');
    assertStringIncludes(result.stdout, 'Short flag footer');
  });

  await t.step('should compose with file-based slots', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--slot',
      'title=File Test',
      '--slot',
      'content=@test-cli-content.md',
      '--slot',
      'footer=File footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# File Test');
    assertStringIncludes(result.stdout, 'This is test content from a file');
    assertStringIncludes(result.stdout, '**markdown** formatting');
    assertStringIncludes(result.stdout, 'File footer');
  });

  await t.step('should compose with JSON configuration using long flag', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--json',
      'test-cli-config.json',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# JSON Config Title');
    assertStringIncludes(result.stdout, 'This is test content from a file');
    assertStringIncludes(result.stdout, '© 2024 JSON Config');
  });

  await t.step('should compose with JSON configuration using short flag', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '-j',
      'test-cli-config.json',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# JSON Config Title');
  });

  await t.step('should output to file with long flag', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--slot',
      'title=Output Test',
      '--slot',
      'content=Output content',
      '--slot',
      'footer=Output footer',
      '--output',
      'test-cli-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Check that file was created with correct content
    const outputContent = await Deno.readTextFile('test-cli-output.md');
    assertStringIncludes(outputContent, '# Output Test');
    assertStringIncludes(outputContent, 'Output content');
    assertStringIncludes(outputContent, 'Output footer');
  });

  await t.step('should output to file with short flag', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '-s',
      'title=Short Output Test',
      '-s',
      'content=Short output content',
      '-s',
      'footer=Short output footer',
      '-o',
      'test-cli-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), '');

    const outputContent = await Deno.readTextFile('test-cli-output.md');
    assertStringIncludes(outputContent, '# Short Output Test');
  });

  await t.step('should handle CLI flags overriding JSON config', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--json',
      'test-cli-config.json',
      '--slot',
      'title=CLI Override Title',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# CLI Override Title'); // CLI should override JSON
    assertStringIncludes(result.stdout, '© 2024 JSON Config'); // Other slots from JSON should remain
  });

  await t.step('should handle missing template file error', async () => {
    const result = await runCli([
      'compose',
      'nonexistent-template.md',
      '--slot',
      'title=Test',
    ]);

    assertEquals(result.code, 0); // CLI handles file errors gracefully
    assertStringIncludes(result.stderr, 'Composition completed with errors:');
    assertStringIncludes(result.stderr, 'File not found:');
  });

  await t.step('should handle missing required arguments', async () => {
    const result = await runCli(['compose']);

    assertEquals(result.code, 1);
    assertStringIncludes(result.stderr, 'Template file is required');
  });

  await t.step('should handle invalid slot format', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--slot',
      'invalid-slot-format',
    ]);

    assertEquals(result.code, 1);
    assertStringIncludes(result.stderr, 'Invalid slot format');
  });

  await t.step('should handle template without compose command', async () => {
    const result = await runCli([
      'test-cli-template.md',
      '--slot',
      'title=Direct Template',
      '--slot',
      'content=Direct content',
      '--slot',
      'footer=Direct footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Direct Template');
    assertStringIncludes(result.stdout, 'Direct content');
  });

  await t.step('should handle mixed long and short flags', async () => {
    const result = await runCli([
      'compose',
      'test-cli-template.md',
      '--slot',
      'title=Mixed Flags',
      '-s',
      'content=Mixed content',
      '--slot',
      'footer=Mixed footer',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Mixed Flags');
    assertStringIncludes(result.stdout, 'Mixed content');
    assertStringIncludes(result.stdout, 'Mixed footer');
  });

  await cleanupTestFiles();
});
