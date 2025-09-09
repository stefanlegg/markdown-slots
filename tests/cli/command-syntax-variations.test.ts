/**
 * Tests for command syntax variations from README
 * Covers compose command with/without explicit "compose" keyword, flag combinations, and mixed flag usage
 * Requirements: 1.4, 1.5
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
async function setupSyntaxTestFiles(): Promise<void> {
  // Create test template for syntax variations
  await Deno.writeTextFile(
    './syntax-test-template.md',
    `# <!-- outlet: title -->

**Project:** <!-- outlet: project -->  
**Version:** <!-- outlet: version -->

## Description

<!-- outlet: description -->

## Features

<!-- outlet: features -->

---

*Author: <!-- outlet: author -->*`,
  );

  // Create content file for file-based slot testing
  await Deno.writeTextFile(
    './syntax-test-content.md',
    `This is content from a file.

It includes **markdown** formatting and multiple paragraphs.

- Feature 1
- Feature 2
- Feature 3`,
  );
}

/**
 * Clean up test files
 */
async function cleanupSyntaxTestFiles(): Promise<void> {
  const files = [
    './syntax-test-template.md',
    './syntax-test-content.md',
    './syntax-test-output.md',
  ];

  for (const file of files) {
    try {
      await Deno.remove(file);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

Deno.test('Command Syntax Variations Tests', async (t) => {
  await setupSyntaxTestFiles();

  await t.step('should work with explicit "compose" command using long flags', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=Explicit Compose Test',
      '--slot',
      'project=Test Project',
      '--slot',
      'version=1.0.0',
      '--slot',
      'description=Testing explicit compose command',
      '--slot',
      'features=Long flag features',
      '--slot',
      'author=Test Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Explicit Compose Test');
    assertStringIncludes(result.stdout, '**Project:** Test Project');
    assertStringIncludes(result.stdout, '**Version:** 1.0.0');
    assertStringIncludes(result.stdout, 'Testing explicit compose command');
    assertStringIncludes(result.stdout, 'Long flag features');
    assertStringIncludes(result.stdout, '*Author: Test Author*');
  });

  await t.step('should work without explicit "compose" command using long flags', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '--slot',
      'title=Implicit Compose Test',
      '--slot',
      'project=Test Project',
      '--slot',
      'version=2.0.0',
      '--slot',
      'description=Testing implicit compose command',
      '--slot',
      'features=Implicit features',
      '--slot',
      'author=Implicit Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Implicit Compose Test');
    assertStringIncludes(result.stdout, '**Project:** Test Project');
    assertStringIncludes(result.stdout, '**Version:** 2.0.0');
    assertStringIncludes(result.stdout, 'Testing implicit compose command');
    assertStringIncludes(result.stdout, 'Implicit features');
    assertStringIncludes(result.stdout, '*Author: Implicit Author*');
  });

  await t.step('should work with explicit "compose" command using short flags', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '-s',
      'title=Short Flag Compose Test',
      '-s',
      'project=Short Project',
      '-s',
      'version=3.0.0',
      '-s',
      'description=Testing short flags with compose',
      '-s',
      'features=Short flag features',
      '-s',
      'author=Short Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Short Flag Compose Test');
    assertStringIncludes(result.stdout, '**Project:** Short Project');
    assertStringIncludes(result.stdout, '**Version:** 3.0.0');
    assertStringIncludes(result.stdout, 'Testing short flags with compose');
    assertStringIncludes(result.stdout, 'Short flag features');
    assertStringIncludes(result.stdout, '*Author: Short Author*');
  });

  await t.step('should work without explicit "compose" command using short flags', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '-s',
      'title=Short Flag Implicit Test',
      '-s',
      'project=Implicit Short Project',
      '-s',
      'version=4.0.0',
      '-s',
      'description=Testing short flags without compose',
      '-s',
      'features=Implicit short features',
      '-s',
      'author=Implicit Short Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Short Flag Implicit Test');
    assertStringIncludes(result.stdout, '**Project:** Implicit Short Project');
    assertStringIncludes(result.stdout, '**Version:** 4.0.0');
    assertStringIncludes(result.stdout, 'Testing short flags without compose');
    assertStringIncludes(result.stdout, 'Implicit short features');
    assertStringIncludes(result.stdout, '*Author: Implicit Short Author*');
  });

  await t.step('should work with mixed long and short flags (explicit compose)', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=Mixed Flags Test',
      '-s',
      'project=Mixed Project',
      '--slot',
      'version=5.0.0',
      '-s',
      'description=Testing mixed flag usage',
      '--slot',
      'features=Mixed flag features',
      '-s',
      'author=Mixed Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Mixed Flags Test');
    assertStringIncludes(result.stdout, '**Project:** Mixed Project');
    assertStringIncludes(result.stdout, '**Version:** 5.0.0');
    assertStringIncludes(result.stdout, 'Testing mixed flag usage');
    assertStringIncludes(result.stdout, 'Mixed flag features');
    assertStringIncludes(result.stdout, '*Author: Mixed Author*');
  });

  await t.step('should work with mixed long and short flags (implicit compose)', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '--slot',
      'title=Mixed Implicit Test',
      '-s',
      'project=Mixed Implicit Project',
      '--slot',
      'version=6.0.0',
      '-s',
      'description=Testing mixed flags without compose',
      '--slot',
      'features=Mixed implicit features',
      '-s',
      'author=Mixed Implicit Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Mixed Implicit Test');
    assertStringIncludes(result.stdout, '**Project:** Mixed Implicit Project');
    assertStringIncludes(result.stdout, '**Version:** 6.0.0');
    assertStringIncludes(result.stdout, 'Testing mixed flags without compose');
    assertStringIncludes(result.stdout, 'Mixed implicit features');
    assertStringIncludes(result.stdout, '*Author: Mixed Implicit Author*');
  });

  await t.step('should work with output flag variations (long form)', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=Output Long Flag Test',
      '--slot',
      'project=Output Test',
      '--slot',
      'version=7.0.0',
      '--slot',
      'description=Testing long output flag',
      '--slot',
      'features=Output features',
      '--slot',
      'author=Output Author',
      '--output',
      'syntax-test-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('syntax-test-output.md');
    assertStringIncludes(outputContent, '# Output Long Flag Test');
    assertStringIncludes(outputContent, '**Project:** Output Test');
    assertStringIncludes(outputContent, '**Version:** 7.0.0');
  });

  await t.step('should work with output flag variations (short form)', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '-s',
      'title=Output Short Flag Test',
      '-s',
      'project=Short Output Test',
      '-s',
      'version=8.0.0',
      '-s',
      'description=Testing short output flag',
      '-s',
      'features=Short output features',
      '-s',
      'author=Short Output Author',
      '-o',
      'syntax-test-output.md',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('syntax-test-output.md');
    assertStringIncludes(outputContent, '# Output Short Flag Test');
    assertStringIncludes(outputContent, '**Project:** Short Output Test');
    assertStringIncludes(outputContent, '**Version:** 8.0.0');
  });

  await t.step('should work with verbose flag variations (long form)', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=Verbose Long Flag Test',
      '--slot',
      'project=Verbose Test',
      '--slot',
      'version=9.0.0',
      '--slot',
      'description=Testing long verbose flag',
      '--slot',
      'features=Verbose features',
      '--slot',
      'author=Verbose Author',
      '--verbose',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Verbose Long Flag Test');
    assertStringIncludes(result.stdout, '**Project:** Verbose Test');
    assertStringIncludes(result.stdout, '**Version:** 9.0.0');
    // Verbose mode should work without errors
  });

  await t.step('should work with verbose flag variations (short form)', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '-s',
      'title=Verbose Short Flag Test',
      '-s',
      'project=Short Verbose Test',
      '-s',
      'version=10.0.0',
      '-s',
      'description=Testing short verbose flag',
      '-s',
      'features=Short verbose features',
      '-s',
      'author=Short Verbose Author',
      '-v',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Verbose Short Flag Test');
    assertStringIncludes(result.stdout, '**Project:** Short Verbose Test');
    assertStringIncludes(result.stdout, '**Version:** 10.0.0');
    // Verbose mode should work without errors
  });

  await t.step('should work with all flag combinations together', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=All Flags Test',
      '-s',
      'project=Complete Test',
      '--slot',
      'version=11.0.0',
      '-s',
      'description=Testing all flag combinations',
      '--slot',
      'features=Complete features',
      '-s',
      'author=Complete Author',
      '--output',
      'syntax-test-output.md',
      '--verbose',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('syntax-test-output.md');
    assertStringIncludes(outputContent, '# All Flags Test');
    assertStringIncludes(outputContent, '**Project:** Complete Test');
    assertStringIncludes(outputContent, '**Version:** 11.0.0');
    assertStringIncludes(outputContent, 'Testing all flag combinations');
    assertStringIncludes(outputContent, 'Complete features');
    assertStringIncludes(outputContent, '*Author: Complete Author*');
  });

  await t.step('should work with all flag combinations without explicit compose', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '--slot',
      'title=All Flags Implicit Test',
      '-s',
      'project=Implicit Complete Test',
      '--slot',
      'version=12.0.0',
      '-s',
      'description=Testing all flags without compose',
      '--slot',
      'features=Implicit complete features',
      '-s',
      'author=Implicit Complete Author',
      '-o',
      'syntax-test-output.md',
      '-v',
    ]);

    assertEquals(result.code, 0);
    assertEquals(result.stdout.trim(), ''); // No stdout when outputting to file

    // Verify file was created with correct content
    const outputContent = await Deno.readTextFile('syntax-test-output.md');
    assertStringIncludes(outputContent, '# All Flags Implicit Test');
    assertStringIncludes(outputContent, '**Project:** Implicit Complete Test');
    assertStringIncludes(outputContent, '**Version:** 12.0.0');
    assertStringIncludes(outputContent, 'Testing all flags without compose');
    assertStringIncludes(outputContent, 'Implicit complete features');
    assertStringIncludes(outputContent, '*Author: Implicit Complete Author*');
  });

  await t.step('should handle flag order variations (flags before template)', async () => {
    const result = await runCli([
      '--slot',
      'title=Flag Order Test',
      '--slot',
      'project=Order Test',
      'compose',
      'syntax-test-template.md',
      '--slot',
      'version=13.0.0',
      '--slot',
      'description=Testing flag order variations',
      '--slot',
      'features=Order features',
      '--slot',
      'author=Order Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Flag Order Test');
    assertStringIncludes(result.stdout, '**Project:** Order Test');
    assertStringIncludes(result.stdout, '**Version:** 13.0.0');
    assertStringIncludes(result.stdout, 'Testing flag order variations');
  });

  await t.step('should handle multiple slots with same flag type', async () => {
    const result = await runCli([
      'syntax-test-template.md',
      '--slot',
      'title=Multiple Slots Test',
      '--slot',
      'project=Multiple Test',
      '--slot',
      'version=14.0.0',
      '--slot',
      'description=Testing multiple slots with same flag',
      '--slot',
      'features=Multiple features',
      '--slot',
      'author=Multiple Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Multiple Slots Test');
    assertStringIncludes(result.stdout, '**Project:** Multiple Test');
    assertStringIncludes(result.stdout, '**Version:** 14.0.0');
    assertStringIncludes(result.stdout, 'Testing multiple slots with same flag');
    assertStringIncludes(result.stdout, 'Multiple features');
    assertStringIncludes(result.stdout, '*Author: Multiple Author*');
  });

  await t.step('should handle file-based slots with different flag variations', async () => {
    const result = await runCli([
      'compose',
      'syntax-test-template.md',
      '--slot',
      'title=File Slot Test',
      '-s',
      'project=File Test Project',
      '--slot',
      'version=15.0.0',
      '-s',
      'description=@syntax-test-content.md',
      '--slot',
      'features=File-based features',
      '-s',
      'author=File Author',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# File Slot Test');
    assertStringIncludes(result.stdout, '**Project:** File Test Project');
    assertStringIncludes(result.stdout, '**Version:** 15.0.0');
    assertStringIncludes(result.stdout, 'This is content from a file');
    assertStringIncludes(result.stdout, '**markdown** formatting');
    assertStringIncludes(result.stdout, '- Feature 1');
    assertStringIncludes(result.stdout, 'File-based features');
    assertStringIncludes(result.stdout, '*Author: File Author*');
  });

  await cleanupSyntaxTestFiles();
});
