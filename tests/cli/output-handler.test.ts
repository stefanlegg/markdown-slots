/**
 * Tests for the OutputHandler class
 */

import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { OutputHandler } from '../../src/cli/output-handler.ts';
import type { CliOptions, ComposeError, ComposeResult } from '../../src/types.ts';

// Mock console methods for testing
let consoleLogOutput: string[] = [];
let consoleErrorOutput: string[] = [];

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function mockConsole() {
  consoleLogOutput = [];
  consoleErrorOutput = [];
  console.log = (...args: unknown[]) => {
    consoleLogOutput.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    consoleErrorOutput.push(args.join(' '));
  };
}

function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

// Helper to create temporary files for testing
async function _createTempFile(content: string): Promise<string> {
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

Deno.test('OutputHandler', async (t) => {
  const handler = new OutputHandler();

  await t.step('should write to stdout when no output file specified', async () => {
    mockConsole();

    const result: ComposeResult = {
      markdown: 'Hello World!',
    };

    const options: CliOptions = {
      template: 'test.md',
      slots: {},
    };

    await handler.handle(result, options);

    assertEquals(consoleLogOutput, ['Hello World!']);
    assertEquals(consoleErrorOutput, []);

    restoreConsole();
  });

  await t.step('should write to file when output specified', async () => {
    const tempFile = await Deno.makeTempFile({ suffix: '.md' });

    try {
      const result: ComposeResult = {
        markdown: 'Hello File!',
      };

      const options: CliOptions = {
        template: 'test.md',
        slots: {},
        output: tempFile,
      };

      await handler.handle(result, options);

      const fileContent = await Deno.readTextFile(tempFile);
      assertEquals(fileContent, 'Hello File!');
    } finally {
      await cleanupTempFile(tempFile);
    }
  });

  await t.step('should show verbose output when writing to file', async () => {
    mockConsole();
    const tempFile = await Deno.makeTempFile({ suffix: '.md' });

    try {
      const result: ComposeResult = {
        markdown: 'Hello Verbose!',
      };

      const options: CliOptions = {
        template: 'test.md',
        slots: {},
        output: tempFile,
        verbose: true,
      };

      await handler.handle(result, options);

      assertEquals(consoleErrorOutput.length, 1);
      assertEquals(consoleErrorOutput[0].startsWith('Output written to:'), true);
    } finally {
      await cleanupTempFile(tempFile);
      restoreConsole();
    }
  });

  await t.step('should format errors in non-verbose mode', async () => {
    mockConsole();

    const errors: ComposeError[] = [
      { type: 'missing-slot', message: 'Slot "title" not found' },
      { type: 'file-error', message: 'Could not read file.md', path: '/path/to/file.md' },
    ];

    const result: ComposeResult = {
      markdown: 'Content with errors',
      errors,
    };

    const options: CliOptions = {
      template: 'test.md',
      slots: {},
    };

    await handler.handle(result, options);

    assertEquals(consoleErrorOutput, [
      'Composition completed with errors:',
      '  Slot "title" not found',
      '  Could not read file.md',
      '',
    ]);
    assertEquals(consoleLogOutput, ['Content with errors']);

    restoreConsole();
  });

  await t.step('should format errors in verbose mode', async () => {
    mockConsole();

    const errors: ComposeError[] = [
      { type: 'missing-slot', message: 'Slot "title" not found' },
      { type: 'file-error', message: 'Could not read file.md', path: '/path/to/file.md' },
    ];

    const result: ComposeResult = {
      markdown: 'Content with errors',
      errors,
    };

    const options: CliOptions = {
      template: 'test.md',
      slots: {},
      verbose: true,
    };

    await handler.handle(result, options);

    assertEquals(consoleErrorOutput, [
      'Composition completed with errors:',
      '  [missing-slot] Slot "title" not found',
      '  [file-error] Could not read file.md',
      '    Path: /path/to/file.md',
      '',
    ]);
    assertEquals(consoleLogOutput, ['Content with errors']);

    restoreConsole();
  });

  await t.step('should throw error when file writing fails', async () => {
    const result: ComposeResult = {
      markdown: 'Hello World!',
    };

    const options: CliOptions = {
      template: 'test.md',
      slots: {},
      output: '/invalid/path/that/does/not/exist.md',
    };

    await assertRejects(
      () => handler.handle(result, options),
      Error,
      'Failed to write output file',
    );
  });

  await t.step('should format CLI errors in non-verbose mode', () => {
    mockConsole();

    const error = new Error('Something went wrong');
    handler.formatCliError(error, false);

    assertEquals(consoleErrorOutput, ['Error: Something went wrong']);

    restoreConsole();
  });

  await t.step('should format CLI errors in verbose mode', () => {
    mockConsole();

    const error = new Error('Something went wrong');
    error.stack = 'Error: Something went wrong\n    at test:1:1';
    handler.formatCliError(error, true);

    assertEquals(consoleErrorOutput, [
      'Error: Something went wrong',
      'Stack trace:\nError: Something went wrong\n    at test:1:1',
    ]);

    restoreConsole();
  });

  await t.step('should format validation errors with helpful suggestions', () => {
    mockConsole();

    // Test template file required error
    let error = new Error('Template file is required');
    handler.formatValidationError(error);

    assertEquals(consoleErrorOutput[0], 'Error: Template file is required');
    assertEquals(consoleErrorOutput[1], '\nUsage: deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose <template> [options]');

    // Reset and test file not found error
    mockConsole();
    error = new Error('File not found: template.md');
    handler.formatValidationError(error);

    assertEquals(consoleErrorOutput[0], 'Error: File not found: template.md');
    assertEquals(
      consoleErrorOutput[1],
      '\nTip: Check that the file path is correct and the file exists.',
    );

    // Reset and test invalid JSON error
    mockConsole();
    error = new Error('Invalid JSON in configuration file');
    handler.formatValidationError(error);

    assertEquals(consoleErrorOutput[0], 'Error: Invalid JSON in configuration file');
    assertEquals(consoleErrorOutput[1], '\nTip: Validate your JSON configuration file syntax.');

    // Reset and test unknown flag error
    mockConsole();
    error = new Error('Unknown flag: --invalid');
    handler.formatValidationError(error);

    assertEquals(consoleErrorOutput[0], 'Error: Unknown flag: --invalid');
    assertEquals(consoleErrorOutput[1], '\nUse --help or -h to see available options.');

    restoreConsole();
  });
});
