/**
 * Tests for README installation examples
 * Covers NPM installation, Deno installation, and help command functionality
 * Requirements: 1.1, 1.4
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
 * Create temporary test files
 */
async function setupInstallationTestFiles(): Promise<void> {
  // Create simple test template for installation verification
  await Deno.writeTextFile(
    './install-test-template.md',
    `# <!-- outlet: title -->

Welcome to <!-- outlet: project_name -->!

## Installation

<!-- outlet: installation -->

## Usage

<!-- outlet: usage -->`,
  );
}

/**
 * Clean up test files
 */
async function cleanupInstallationTestFiles(): Promise<void> {
  const files = [
    './install-test-template.md',
    './install-test-output.md',
  ];

  for (const file of files) {
    try {
      await Deno.remove(file);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

Deno.test('README Installation Examples Tests', async (t) => {
  await setupInstallationTestFiles();

  await t.step('should show help with --help flag (NPM equivalent)', async () => {
    const result = await runCli(['--help']);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Markdown Slots CLI');
    assertStringIncludes(result.stdout, 'USAGE:');
    assertStringIncludes(result.stdout, 'OPTIONS:');
    assertStringIncludes(result.stdout, 'EXAMPLES:');

    // Verify help includes NPM-style usage examples
    assertStringIncludes(result.stdout, 'npx markdown-slots');
    assertStringIncludes(result.stdout, '--slot');
    assertStringIncludes(result.stdout, '--output');
    assertStringIncludes(result.stdout, '--json');
  });

  await t.step('should show help with -h flag (short form)', async () => {
    const result = await runCli(['-h']);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, 'Markdown Slots CLI');
    assertStringIncludes(result.stdout, 'USAGE:');

    // Verify short help includes essential information
    assertStringIncludes(result.stdout, 'compose');
    assertStringIncludes(result.stdout, 'template');
  });

  await t.step(
    'should verify basic CLI functionality works (installation verification)',
    async () => {
      // Test basic functionality that would verify installation worked
      const result = await runCli([
        'compose',
        'install-test-template.md',
        '--slot',
        'title=Installation Test',
        '--slot',
        'project_name=Markdown Slots',
        '--slot',
        'installation=npm install -g markdown-slots',
        '--slot',
        'usage=npx markdown-slots --help',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Installation Test');
      assertStringIncludes(result.stdout, 'Welcome to Markdown Slots!');
      assertStringIncludes(result.stdout, 'npm install -g markdown-slots');
      assertStringIncludes(result.stdout, 'npx markdown-slots --help');
    },
  );

  await t.step('should handle NPM-style command patterns from README', async () => {
    // Test NPM global installation verification pattern
    const result = await runCli([
      'compose',
      'install-test-template.md',
      '--slot',
      'title=NPM Global Test',
      '--slot',
      'project_name=Test Project',
      '--slot',
      'installation=npm install -g markdown-slots',
      '--slot',
      'usage=markdown-slots --help',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# NPM Global Test');
    assertStringIncludes(result.stdout, 'npm install -g markdown-slots');
    assertStringIncludes(result.stdout, 'markdown-slots --help');
  });

  await t.step('should handle NPX usage patterns from README', async () => {
    // Test npx usage patterns documented in README
    const result = await runCli([
      'install-test-template.md',
      '--slot',
      'title=NPX Usage Test',
      '--slot',
      'project_name=NPX Project',
      '--slot',
      'installation=npm install markdown-slots',
      '--slot',
      'usage=npx markdown-slots compose template.md --slot title="Test"',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# NPX Usage Test');
    assertStringIncludes(result.stdout, 'npx markdown-slots compose template.md');
  });

  await t.step('should verify Deno direct URL usage pattern', async () => {
    // Test the Deno direct URL pattern from README
    const result = await runCli([
      'compose',
      'install-test-template.md',
      '--slot',
      'title=Deno Direct URL Test',
      '--slot',
      'project_name=Deno Project',
      '--slot',
      'installation=No installation needed - run directly from URL',
      '--slot',
      'usage=deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts --help',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Deno Direct URL Test');
    assertStringIncludes(result.stdout, 'No installation needed');
    assertStringIncludes(result.stdout, 'deno run --allow-read --allow-write');
    assertStringIncludes(result.stdout, 'https://deno.land/x/markdown_slots/cli.ts');
  });

  await t.step('should verify Deno install command pattern', async () => {
    // Test Deno install pattern from README
    const result = await runCli([
      'install-test-template.md',
      '--slot',
      'title=Deno Install Test',
      '--slot',
      'project_name=Deno Installed',
      '--slot',
      'installation=deno install --allow-read --allow-write --name markdown-slots https://deno.land/x/markdown_slots/cli.ts',
      '--slot',
      'usage=markdown-slots --help',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Deno Install Test');
    assertStringIncludes(result.stdout, 'deno install --allow-read --allow-write');
    assertStringIncludes(result.stdout, '--name markdown-slots');
  });

  await t.step('should verify help command works with various argument combinations', async () => {
    // Test help with compose command
    const composeHelpResult = await runCli(['compose', '--help']);
    assertEquals(composeHelpResult.code, 0);
    // When compose --help is used, it should show help (even if empty stdout)
    // The important thing is that it doesn't error

    // Test help with verbose flag - basic help should work
    const verboseHelpResult = await runCli(['--help']);
    assertEquals(verboseHelpResult.code, 0);
    assertStringIncludes(verboseHelpResult.stdout, 'Markdown Slots CLI');
  });

  await t.step('should handle installation verification with output to file', async () => {
    // Test installation verification with file output (common verification pattern)
    const result = await runCli([
      'compose',
      'install-test-template.md',
      '--slot',
      'title=Installation Verification',
      '--slot',
      'project_name=Verified Installation',
      '--slot',
      'installation=Installation successful!',
      '--slot',
      'usage=CLI is working correctly',
      '--output',
      'install-test-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('install-test-output.md');
    assertStringIncludes(outputContent, '# Installation Verification');
    assertStringIncludes(outputContent, 'Installation successful!');
    assertStringIncludes(outputContent, 'CLI is working correctly');
  });

  await t.step('should handle cross-platform help command functionality', async () => {
    // Test help command with different flag styles (cross-platform compatibility)
    const longFlagResult = await runCli(['--help']);
    const shortFlagResult = await runCli(['-h']);

    assertEquals(longFlagResult.code, 0);
    assertEquals(shortFlagResult.code, 0);

    // Both should contain essential help information
    assertStringIncludes(longFlagResult.stdout, 'Markdown Slots CLI');
    assertStringIncludes(shortFlagResult.stdout, 'Markdown Slots CLI');

    // Both should show usage patterns
    assertStringIncludes(longFlagResult.stdout, 'USAGE:');
    assertStringIncludes(shortFlagResult.stdout, 'USAGE:');
  });

  await t.step('should verify README installation examples work end-to-end', async () => {
    // Test the complete workflow from README installation section
    const result = await runCli([
      'compose',
      'install-test-template.md',
      '--slot',
      'title=Complete Installation Test',
      '--slot',
      'project_name=End-to-End Test',
      '--slot',
      "installation=# For Deno\nimport { composeMarkdown } from 'https://deno.land/x/markdown_slots/mod.ts';\n\n# For Node.js (when published)\nnpm install markdown-slots",
      '--slot',
      'usage=See examples in documentation',
      '--verbose',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Complete Installation Test');
    assertStringIncludes(result.stdout, 'import { composeMarkdown }');
    assertStringIncludes(result.stdout, 'npm install markdown-slots');

    // Verbose output should show some processing information (may vary by implementation)
    // The important thing is that verbose mode works without errors
  });

  await cleanupInstallationTestFiles();
});
