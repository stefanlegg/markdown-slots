/**
 * Tests for the CliInterface class
 */

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { CliInterface } from '../../src/cli/cli-interface.ts';

// Mock console methods for testing
let consoleLogOutput: string[] = [];
let consoleErrorOutput: string[] = [];

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalDenoExit = Deno.exit;

let exitCode: number | undefined;

function mockConsole() {
  consoleLogOutput = [];
  consoleErrorOutput = [];
  exitCode = undefined;

  console.log = (...args: unknown[]) => {
    consoleLogOutput.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    consoleErrorOutput.push(args.join(' '));
  };

  // Mock Deno.exit to capture exit codes
  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exit with code ${code}`);
  };
}

function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  Deno.exit = originalDenoExit;
}

// Helper to create temporary files for testing
async function createTempFile(content: string): Promise<string> {
  const tempFile = await Deno.makeTempFile({ suffix: '.md' });
  await Deno.writeTextFile(tempFile, content);
  return tempFile;
}

// Helper to clean up temp files
async function cleanupTempFile(path: string) {
  try {
    await Deno.remove(path);
  } catch {
    // Ignore cleanup errors
  }
}

Deno.test('CliInterface', async (t) => {
  const cli = new CliInterface();

  await t.step('should display help when --help flag is used', async () => {
    mockConsole();

    await cli.run(['--help']);

    assertEquals(consoleLogOutput.length > 0, true);
    assertEquals(consoleLogOutput[0].includes('Markdown Slots CLI'), true);
    assertEquals(consoleLogOutput[0].includes('USAGE:'), true);

    restoreConsole();
  });

  await t.step('should display help when -h flag is used', async () => {
    mockConsole();

    await cli.run(['-h']);

    assertEquals(consoleLogOutput.length > 0, true);
    assertEquals(consoleLogOutput[0].includes('Markdown Slots CLI'), true);

    restoreConsole();
  });

  await t.step('should compose simple template with inline slots', async () => {
    mockConsole();
    const tempFile = await createTempFile('Hello <!-- outlet: name -->!');

    try {
      await cli.run(['compose', tempFile, '--slot', 'name=World']);

      assertEquals(consoleLogOutput, ['Hello World!']);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(tempFile);
      restoreConsole();
    }
  });

  await t.step('should compose template with short flag syntax', async () => {
    mockConsole();
    const tempFile = await createTempFile('Hello <!-- outlet: name -->!');

    try {
      await cli.run([tempFile, '-s', 'name=World']);

      assertEquals(consoleLogOutput, ['Hello World!']);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(tempFile);
      restoreConsole();
    }
  });

  await t.step('should compose template with file-based slots', async () => {
    mockConsole();
    const templateFile = await createTempFile('Content: <!-- outlet: content -->');
    const contentFile = await createTempFile('File content here');

    try {
      await cli.run(['compose', templateFile, '--slot', `content=@${contentFile}`]);

      assertEquals(consoleLogOutput, ['Content: File content here']);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(contentFile);
      restoreConsole();
    }
  });

  await t.step('should write output to file when --output specified', async () => {
    mockConsole();
    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const outputFile = await Deno.makeTempFile({ suffix: '.md' });

    try {
      await cli.run(['compose', templateFile, '--slot', 'name=World', '--output', outputFile]);

      const outputContent = await Deno.readTextFile(outputFile);
      assertEquals(outputContent, 'Hello World!');
      assertEquals(consoleLogOutput, []); // No stdout output when writing to file
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(outputFile);
      restoreConsole();
    }
  });

  await t.step('should write output to file with short flag syntax', async () => {
    mockConsole();
    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const outputFile = await Deno.makeTempFile({ suffix: '.md' });

    try {
      await cli.run([templateFile, '-s', 'name=World', '-o', outputFile]);

      const outputContent = await Deno.readTextFile(outputFile);
      assertEquals(outputContent, 'Hello World!');
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(outputFile);
      restoreConsole();
    }
  });

  await t.step('should show verbose output when --verbose flag is used', async () => {
    mockConsole();
    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const outputFile = await Deno.makeTempFile({ suffix: '.md' });

    try {
      await cli.run([
        'compose',
        templateFile,
        '--slot',
        'name=World',
        '--output',
        outputFile,
        '--verbose',
      ]);

      assertEquals(consoleErrorOutput.some((line) => line.includes('Output written to:')), true);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(outputFile);
      restoreConsole();
    }
  });

  await t.step('should load JSON configuration', async () => {
    mockConsole();
    const templateFile = await createTempFile(
      'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->',
    );
    const configFile = await createTempFile(JSON.stringify({
      slots: {
        title: { content: 'My Title' },
        content: { content: 'My Content' },
      },
    }));

    try {
      await cli.run(['compose', templateFile, '--json', configFile]);

      assertEquals(consoleLogOutput, ['Title: My Title\nContent: My Content']);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      restoreConsole();
    }
  });

  await t.step('should merge JSON config with CLI slots (CLI takes precedence)', async () => {
    mockConsole();
    const templateFile = await createTempFile(
      'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->',
    );
    const configFile = await createTempFile(JSON.stringify({
      slots: {
        title: { content: 'JSON Title' },
        content: { content: 'JSON Content' },
      },
    }));

    try {
      await cli.run(['compose', templateFile, '--json', configFile, '--slot', 'title=CLI Title']);

      assertEquals(consoleLogOutput, ['Title: CLI Title\nContent: JSON Content']);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      restoreConsole();
    }
  });

  await t.step('should handle missing template file error', async () => {
    mockConsole();

    try {
      await cli.run(['compose', 'nonexistent.md']);
    } catch (_error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(exitCode, 1);
      assertEquals(consoleErrorOutput.some((line) => line.includes('Error:')), true);
    }

    restoreConsole();
  });

  await t.step('should handle invalid arguments error', async () => {
    mockConsole();

    try {
      await cli.run(['--invalid-flag']);
    } catch (_error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(exitCode, 1);
      assertEquals(consoleErrorOutput.some((line) => line.includes('Error:')), true);
    }

    restoreConsole();
  });

  await t.step('should handle missing template argument error', async () => {
    mockConsole();

    try {
      await cli.run(['compose']);
    } catch (_error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(exitCode, 1);
      assertEquals(
        consoleErrorOutput.some((line) => line.includes('Template file is required')),
        true,
      );
      assertEquals(consoleErrorOutput.some((line) => line.includes('Usage:')), true);
    }

    restoreConsole();
  });

  await t.step('should handle JSON parsing error', async () => {
    mockConsole();
    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const invalidJsonFile = await createTempFile('{ invalid json }');

    try {
      await cli.run(['compose', templateFile, '--json', invalidJsonFile]);
    } catch (_error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(exitCode, 1);
      assertEquals(consoleErrorOutput.some((line) => line.includes('Error:')), true);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(invalidJsonFile);
      restoreConsole();
    }
  });

  await t.step('should show verbose error information when --verbose flag is used', async () => {
    mockConsole();

    try {
      await cli.run(['compose', 'nonexistent.md', '--verbose']);
    } catch (_error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(exitCode, 1);
      assertEquals(consoleErrorOutput.some((line) => line.includes('Error:')), true);
      // In verbose mode, we might see stack traces or additional details
    }

    restoreConsole();
  });

  await t.step('should handle composition errors gracefully', async () => {
    mockConsole();
    const templateFile = await createTempFile('Hello <!-- outlet: missing -->!');

    try {
      await cli.run(['compose', templateFile]);

      // Should complete successfully but show the missing slot
      assertEquals(consoleLogOutput, ['Hello <!-- outlet: missing -->!']);
      // Should show error about missing slot
      assertEquals(consoleErrorOutput, [
        'Composition completed with errors:',
        '  Missing slot/outlet: missing',
        '',
      ]);
    } finally {
      await cleanupTempFile(templateFile);
      restoreConsole();
    }
  });

  await t.step('should handle multiple slots correctly', async () => {
    mockConsole();
    const templateFile = await createTempFile(
      '<!-- outlet: title -->\n\n<!-- outlet: content -->\n\n<!-- outlet: footer -->',
    );

    try {
      await cli.run([
        'compose',
        templateFile,
        '--slot',
        'title=My Title',
        '--slot',
        'content=My Content',
        '--slot',
        'footer=My Footer',
      ]);

      assertEquals(consoleLogOutput, ['My Title\n\nMy Content\n\nMy Footer']);
    } finally {
      await cleanupTempFile(templateFile);
      restoreConsole();
    }
  });
});
