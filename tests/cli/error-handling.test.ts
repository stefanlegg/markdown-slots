/**
 * Tests for error handling and edge cases in the CLI
 * Covers graceful error handling, JSON errors, and edge case scenarios
 */

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

import { CliInterface } from '../../src/cli/cli-interface.ts';

// Test fixtures directory

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
async function createTempFile(content: string, suffix = '.md'): Promise<string> {
  const tempFile = await Deno.makeTempFile({ suffix });
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

// Helper to run CLI and capture results
async function runCliWithCapture(args: string[]): Promise<{
  exitCode: number | undefined;
  stdout: string[];
  stderr: string[];
}> {
  mockConsole();
  const cli = new CliInterface();

  try {
    await cli.run(args);
    return {
      exitCode: 0,
      stdout: [...consoleLogOutput],
      stderr: [...consoleErrorOutput],
    };
  } catch (_error) {
    return {
      exitCode: exitCode || 1,
      stdout: [...consoleLogOutput],
      stderr: [...consoleErrorOutput],
    };
  } finally {
    restoreConsole();
  }
}

Deno.test('Error Handling and Edge Cases', async (t) => {
  await t.step('Graceful Error Handling Tests', async (t) => {
    await t.step('should handle missing template file with helpful error message', async () => {
      const result = await runCliWithCapture(['compose', 'completely-missing-template.md']);

      // CLI handles missing template files gracefully with exit code 0
      assertEquals(result.exitCode, 0);
      assertEquals(
        result.stderr.some((line) => line.includes('Composition completed with errors:')),
        true,
      );
      assertEquals(
        result.stderr.some((line) =>
          line.includes('File not found:') || line.includes('not found')
        ),
        true,
      );
    });

    await t.step('should handle missing template file in subdirectory', async () => {
      const result = await runCliWithCapture(['compose', 'nonexistent/missing-template.md']);

      // CLI handles missing template files gracefully with exit code 0
      assertEquals(result.exitCode, 0);
      assertEquals(
        result.stderr.some((line) => line.includes('Composition completed with errors:')),
        true,
      );
      assertEquals(
        result.stderr.some((line) =>
          line.includes('File not found:') || line.includes('not found')
        ),
        true,
      );
    });

    await t.step('should handle invalid slot format with clear error message', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--slot',
          'invalid-format-no-equals',
        ]);

        assertEquals(result.exitCode, 1);
        assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
        assertEquals(
          result.stderr.some((line) =>
            line.includes('Invalid slot format') || line.includes('Expected format')
          ),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
      }
    });

    await t.step(
      'should handle missing file reference in slot with graceful degradation',
      async () => {
        const templateFile = await createTempFile(
          'Content: <!-- outlet: content -->\nFooter: <!-- outlet: footer -->',
        );

        try {
          const result = await runCliWithCapture([
            'compose',
            templateFile,
            '--slot',
            'content=@missing-content-file.md',
            '--slot',
            'footer=Working footer',
          ]);

          // Should complete gracefully without crashing
          assertEquals(result.exitCode, 0);
          assertEquals(result.stdout.some((line) => line.includes('Working footer')), true);
          // CLI handles missing file references silently with warn-empty mode
          // The important thing is that it doesn't crash and processes other content correctly
        } finally {
          await cleanupTempFile(templateFile);
        }
      },
    );

    await t.step('should handle multiple missing file references', async () => {
      const templateFile = await createTempFile(
        'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->\nSidebar: <!-- outlet: sidebar -->',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--slot',
          'title=Working Title',
          '--slot',
          'content=@missing-content.md',
          '--slot',
          'sidebar=@missing-sidebar.md',
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout.some((line) => line.includes('Working Title')), true);
        // CLI handles missing file references silently with warn-empty mode
        // The important thing is that it doesn't crash and processes other content correctly
      } finally {
        await cleanupTempFile(templateFile);
      }
    });

    await t.step('should handle template file with invalid slot syntax', async () => {
      const templateFile = await createTempFile(
        'Hello <!-- outlet: name -->\nInvalid: <!-- @invalid-syntax -->\nGoodbye <!-- outlet: farewell -->!',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--slot',
          'name=World',
          '--slot',
          'farewell=Goodbye',
        ]);

        // Should process valid slots and leave invalid syntax as-is
        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout.some((line) => line.includes('Hello World')), true);
        assertEquals(result.stdout.some((line) => line.includes('Goodbye Goodbye!')), true);
        assertEquals(result.stdout.some((line) => line.includes('<!-- @invalid-syntax -->')), true);
      } finally {
        await cleanupTempFile(templateFile);
      }
    });
  });

  await t.step('JSON Error Handling Tests', async (t) => {
    await t.step('should handle malformed JSON configuration with syntax error', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const malformedJsonFile = await createTempFile(
        '{ "slots": { "name": { "content": "test" } }',
        '.json',
      ); // Missing closing brace

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--json',
          malformedJsonFile,
        ]);

        assertEquals(result.exitCode, 1);
        assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
        assertEquals(
          result.stderr.some((line) => line.includes('Invalid JSON') || line.includes('JSON')),
          true,
        );
        assertEquals(
          result.stderr.some((line) =>
            line.includes('Tip: Validate your JSON configuration file syntax')
          ),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(malformedJsonFile);
      }
    });

    await t.step('should handle JSON file with invalid structure (not an object)', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const invalidStructureFile = await createTempFile('"this is just a string"', '.json');

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--json',
          invalidStructureFile,
        ]);

        assertEquals(result.exitCode, 1);
        assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
        assertEquals(
          result.stderr.some((line) =>
            line.includes('Invalid JSON') || line.includes('configuration')
          ),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(invalidStructureFile);
      }
    });

    await t.step('should handle JSON file with array instead of object', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const arrayJsonFile = await createTempFile('["not", "an", "object"]', '.json');

      try {
        const result = await runCliWithCapture(['compose', templateFile, '--json', arrayJsonFile]);

        // Should fail with configuration error
        assertEquals(result.exitCode, 1);
        assertEquals(
          result.stderr.some((line) =>
            line.includes('Error:') && line.includes('must be an object')
          ),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(arrayJsonFile);
      }
    });

    await t.step('should handle missing JSON configuration file', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--json',
          'completely-missing-config.json',
        ]);

        assertEquals(result.exitCode, 1);
        assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
        assertEquals(
          result.stderr.some((line) => line.includes('not found') || line.includes('No such file')),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
      }
    });

    await t.step(
      'should handle JSON with invalid slot structure (missing content and file)',
      async () => {
        const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
        const invalidSlotJsonFile = await createTempFile(
          JSON.stringify({
            slots: {
              name: {
                // Missing both content and file properties
                someOtherProperty: 'invalid',
              },
            },
          }),
          '.json',
        );

        try {
          const result = await runCliWithCapture([
            'compose',
            templateFile,
            '--json',
            invalidSlotJsonFile,
          ]);

          assertEquals(result.exitCode, 1);
          assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
        } finally {
          await cleanupTempFile(templateFile);
          await cleanupTempFile(invalidSlotJsonFile);
        }
      },
    );

    await t.step('should handle JSON with both file and content in slot (invalid)', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const conflictingJsonFile = await createTempFile(
        JSON.stringify({
          slots: {
            name: {
              content: 'inline content',
              file: 'some-file.md', // Both content and file specified
            },
          },
        }),
        '.json',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--json',
          conflictingJsonFile,
        ]);

        assertEquals(result.exitCode, 1);
        assertEquals(result.stderr.some((line) => line.includes('Error:')), true);
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(conflictingJsonFile);
      }
    });
  });

  await t.step('Edge Case Scenario Tests', async (t) => {
    await t.step('should handle empty template file', async () => {
      const emptyTemplateFile = await createTempFile('');

      try {
        const result = await runCliWithCapture(['compose', emptyTemplateFile]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['']);
      } finally {
        await cleanupTempFile(emptyTemplateFile);
      }
    });

    await t.step('should handle template with only whitespace', async () => {
      const whitespaceTemplateFile = await createTempFile('   \n\t  \n   ');

      try {
        const result = await runCliWithCapture(['compose', whitespaceTemplateFile]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['   \n\t  \n   ']);
      } finally {
        await cleanupTempFile(whitespaceTemplateFile);
      }
    });

    await t.step('should handle template with only outlets and no content', async () => {
      const outletsOnlyFile = await createTempFile(
        '<!-- outlet: title --><!-- outlet: content --><!-- outlet: footer -->',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          outletsOnlyFile,
          '--slot',
          'title=My Title',
          '--slot',
          'content=My Content',
          '--slot',
          'footer=My Footer',
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['My TitleMy ContentMy Footer']);
      } finally {
        await cleanupTempFile(outletsOnlyFile);
      }
    });

    await t.step('should handle extremely long content values', async () => {
      const templateFile = await createTempFile('Content: <!-- outlet: content -->');
      const longContent = 'A'.repeat(10000); // 10KB of 'A' characters

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--slot',
          `content=${longContent}`,
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout[0].includes(longContent), true);
        assertEquals(result.stdout[0].length, 'Content: '.length + longContent.length);
      } finally {
        await cleanupTempFile(templateFile);
      }
    });

    await t.step('should handle template with many outlets', async () => {
      // Use fewer outlets to avoid command line length issues
      const manyOutlets = Array.from({ length: 20 }, (_, i) => `<!-- outlet: slot${i} -->`).join(
        '\n',
      );
      const templateFile = await createTempFile(manyOutlets);

      try {
        const slots: string[] = [];
        for (let i = 0; i < 20; i++) {
          slots.push('--slot', `slot${i}=Content${i}`);
        }
        const result = await runCliWithCapture(['compose', templateFile, ...slots]);

        assertEquals(result.exitCode, 0);
        // Should contain all the content
        for (let i = 0; i < 20; i++) {
          assertEquals(result.stdout[0].includes(`Content${i}`), true);
        }
      } finally {
        await cleanupTempFile(templateFile);
      }
    });

    await t.step('should handle empty JSON configuration', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const emptyJsonFile = await createTempFile('{}', '.json');

      try {
        const result = await runCliWithCapture(['compose', templateFile, '--json', emptyJsonFile]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['Hello <!-- outlet: name -->!']); // Slot remains unfilled
        assertEquals(
          result.stderr.some((line) => line.includes('Missing slot/outlet: name')),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(emptyJsonFile);
      }
    });

    await t.step('should handle JSON with empty slots object', async () => {
      const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
      const emptySlotsJsonFile = await createTempFile(JSON.stringify({ slots: {} }), '.json');

      try {
        const result = await runCliWithCapture([
          'compose',
          templateFile,
          '--json',
          emptySlotsJsonFile,
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['Hello <!-- outlet: name -->!']);
        assertEquals(
          result.stderr.some((line) => line.includes('Missing slot/outlet: name')),
          true,
        );
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(emptySlotsJsonFile);
      }
    });

    await t.step('should handle template with Unicode characters', async () => {
      const unicodeTemplate = await createTempFile(
        '🚀 <!-- outlet: emoji --> 中文 <!-- outlet: chinese --> العربية <!-- outlet: arabic -->',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          unicodeTemplate,
          '--slot',
          'emoji=✨',
          '--slot',
          'chinese=测试',
          '--slot',
          'arabic=اختبار',
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout, ['🚀 ✨ 中文 测试 العربية اختبار']);
      } finally {
        await cleanupTempFile(unicodeTemplate);
      }
    });

    await t.step('should handle template with special characters and escapes', async () => {
      const specialCharsTemplate = await createTempFile(
        'Special: <!-- outlet: special --> "Quotes" \'Single\' <tags> &amp;',
      );

      try {
        const result = await runCliWithCapture([
          'compose',
          specialCharsTemplate,
          '--slot',
          'special=<>&"\'`',
        ]);

        assertEquals(result.exitCode, 0);
        assertEquals(result.stdout[0].includes('<>&"\'`'), true);
      } finally {
        await cleanupTempFile(specialCharsTemplate);
      }
    });
  });
});
