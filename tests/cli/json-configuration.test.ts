/**
 * Tests for JSON Configuration functionality
 * Covers basic JSON config patterns, nested compositions, and CLI overrides
 */

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

import { CliInterface } from '../../src/cli/cli-interface.ts';
import type { JsonConfig } from '../../src/types.ts';

// Test fixtures directory

// Mock console methods for testing
let consoleLogOutput: string[] = [];
let consoleErrorOutput: string[] = [];

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalDenoExit = Deno.exit;

let _exitCode: number | undefined;

function mockConsole() {
  consoleLogOutput = [];
  consoleErrorOutput = [];
  _exitCode = undefined;

  console.log = (...args: unknown[]) => {
    consoleLogOutput.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    consoleErrorOutput.push(args.join(' '));
  };

  // Mock Deno.exit to capture exit codes
  Deno.exit = (code?: number) => {
    _exitCode = code;
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

// Helper to create temporary JSON config files
async function createTempJsonConfig(config: JsonConfig): Promise<string> {
  const tempFile = await Deno.makeTempFile({ suffix: '.json' });
  await Deno.writeTextFile(tempFile, JSON.stringify(config, null, 2));
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

Deno.test('JSON Configuration - Basic Tests', async (t) => {
  const cli = new CliInterface();

  await t.step('should load simple JSON configuration with long flag', async () => {
    mockConsole();

    const templateContent =
      'Title: <!-- outlet: title -->\nAuthor: <!-- outlet: author -->\nVersion: <!-- outlet: version -->';
    const templateFile = await createTempFile(templateContent);

    const config: JsonConfig = {
      slots: {
        title: { content: 'My Project Documentation' },
        author: { content: 'John Doe' },
        version: { content: '1.0.0' },
      },
    };
    const configFile = await createTempJsonConfig(config);

    try {
      await cli.run(['compose', templateFile, '--json', configFile]);

      assertEquals(consoleLogOutput, [
        'Title: My Project Documentation\nAuthor: John Doe\nVersion: 1.0.0',
      ]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      restoreConsole();
    }
  });

  await t.step('should load simple JSON configuration with short flag', async () => {
    mockConsole();

    const templateContent = 'Title: <!-- outlet: title -->\nAuthor: <!-- outlet: author -->';
    const templateFile = await createTempFile(templateContent);

    const config: JsonConfig = {
      slots: {
        title: { content: 'Short Flag Test' },
        author: { content: 'Test Author' },
      },
    };
    const configFile = await createTempJsonConfig(config);

    try {
      await cli.run(['compose', templateFile, '-j', configFile]);

      assertEquals(consoleLogOutput, ['Title: Short Flag Test\nAuthor: Test Author']);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      restoreConsole();
    }
  });

  await t.step('should load JSON configuration with file references', async () => {
    mockConsole();

    const templateContent =
      'Title: <!-- outlet: title -->\nDescription: <!-- outlet: description -->\nInstallation: <!-- outlet: installation -->';
    const templateFile = await createTempFile(templateContent);

    // Create content files
    const descriptionFile = await createTempFile('This is a description from a file.');
    const installationFile = await createTempFile('Run `npm install` to install.');

    const config: JsonConfig = {
      slots: {
        title: { content: 'File Reference Test' },
        description: { file: descriptionFile },
        installation: { file: installationFile },
      },
    };
    const configFile = await createTempJsonConfig(config);

    try {
      await cli.run(['compose', templateFile, '--json', configFile]);

      assertEquals(consoleLogOutput, [
        'Title: File Reference Test\nDescription: This is a description from a file.\nInstallation: Run `npm install` to install.',
      ]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      await cleanupTempFile(descriptionFile);
      await cleanupTempFile(installationFile);
      restoreConsole();
    }
  });

  await t.step('should load JSON configuration with options', async () => {
    mockConsole();

    const templateContent = 'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->';
    const templateFile = await createTempFile(templateContent);

    const config: JsonConfig = {
      slots: {
        title: { content: 'Options Test' },
        content: { content: 'Test content' },
      },
      options: {
        resolveFrom: 'file',
        onMissingSlot: 'ignore',
        parallel: true,
      },
    };
    const configFile = await createTempJsonConfig(config);

    try {
      await cli.run(['compose', templateFile, '--json', configFile]);

      assertEquals(consoleLogOutput, ['Title: Options Test\nContent: Test content']);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      restoreConsole();
    }
  });

  await t.step('should handle JSON validation errors gracefully', async () => {
    mockConsole();

    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const invalidJsonFile = await createTempFile('{ invalid json syntax }', '.json');

    try {
      await cli.run(['compose', templateFile, '--json', invalidJsonFile]);
    } catch (error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(typeof error, 'object');
    }

    // Should have error output
    assertEquals(consoleErrorOutput.length > 0, true);
    assertEquals(consoleErrorOutput.some((msg) => msg.includes('Invalid JSON')), true);

    await cleanupTempFile(templateFile);
    await cleanupTempFile(invalidJsonFile);
    restoreConsole();
  });

  await t.step('should handle missing JSON configuration file', async () => {
    mockConsole();

    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const nonExistentConfig = 'non-existent-config.json';

    try {
      await cli.run(['compose', templateFile, '--json', nonExistentConfig]);
    } catch (error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(typeof error, 'object');
    }

    // Should have error output
    assertEquals(consoleErrorOutput.length > 0, true);
    assertEquals(consoleErrorOutput.some((msg) => msg.includes('not found')), true);

    await cleanupTempFile(templateFile);
    restoreConsole();
  });

  await t.step('should handle invalid JSON configuration structure', async () => {
    mockConsole();

    const templateFile = await createTempFile('Hello <!-- outlet: name -->!');
    const invalidStructureFile = await createTempFile('"not an object"', '.json');

    try {
      await cli.run(['compose', templateFile, '--json', invalidStructureFile]);
    } catch (error) {
      // Expected to throw due to mocked Deno.exit
      assertEquals(typeof error, 'object');
    }

    // Should have error output
    assertEquals(consoleErrorOutput.length > 0, true);
    assertEquals(consoleErrorOutput.some((msg) => msg.includes('must be an object')), true);

    await cleanupTempFile(templateFile);
    await cleanupTempFile(invalidStructureFile);
    restoreConsole();
  });
});
Deno
  .test('JSON Configuration - Nested Composition Tests', async (t) => {
    const cli = new CliInterface();

    await t.step('should handle simple nested JSON composition', async () => {
      mockConsole();

      const templateContent =
        'Header: <!-- outlet: header -->\nMain: <!-- outlet: main_section -->\nFooter: <!-- outlet: footer -->';
      const templateFile = await createTempFile(templateContent);

      const sectionTemplateContent =
        'Section Title: <!-- outlet: section_title -->\nSection Content: <!-- outlet: section_content -->';
      const sectionTemplateFile = await createTempFile(sectionTemplateContent);

      const sectionContentFile = await createTempFile('This is the section content from a file.');

      const config: JsonConfig = {
        slots: {
          header: { content: '# Main Document' },
          main_section: {
            file: sectionTemplateFile,
            slots: {
              section_title: { content: 'Important Section' },
              section_content: { file: sectionContentFile },
            },
          },
          footer: { content: '© 2024 My Company' },
        },
      };
      const configFile = await createTempJsonConfig(config);

      try {
        await cli.run(['compose', templateFile, '--json', configFile]);

        const expectedOutput =
          'Header: # Main Document\nMain: Section Title: Important Section\nSection Content: This is the section content from a file.\nFooter: © 2024 My Company';
        assertEquals(consoleLogOutput, [expectedOutput]);
        assertEquals(consoleErrorOutput, []);
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(configFile);
        await cleanupTempFile(sectionTemplateFile);
        await cleanupTempFile(sectionContentFile);
        restoreConsole();
      }
    });

    await t.step('should handle deeply nested JSON composition', async () => {
      mockConsole();

      const documentTemplateContent =
        'Title: <!-- outlet: title -->\nChapters: <!-- outlet: chapters -->';
      const documentTemplateFile = await createTempFile(documentTemplateContent);

      const chaptersTemplateContent =
        'Chapter 1: <!-- outlet: chapter1 -->\nChapter 2: <!-- outlet: chapter2 -->';
      const chaptersTemplateFile = await createTempFile(chaptersTemplateContent);

      const chapterTemplateContent =
        'Chapter Title: <!-- outlet: chapter_title -->\nChapter Content: <!-- outlet: chapter_content -->\nSubsections: <!-- outlet: subsections -->';
      const chapterTemplateFile = await createTempFile(chapterTemplateContent);
      const chapterTemplateFile2 = await createTempFile(chapterTemplateContent);

      const subsectionsTemplateContent =
        'Subsection 1: <!-- outlet: subsection1 -->\nSubsection 2: <!-- outlet: subsection2 -->';
      const subsectionsTemplateFile = await createTempFile(subsectionsTemplateContent);

      const chapter1ContentFile = await createTempFile('Introduction chapter content.');
      const chapter2ContentFile = await createTempFile('Advanced topics content.');
      const subsection2ContentFile = await createTempFile('Second subsection from file.');

      const config: JsonConfig = {
        slots: {
          title: { content: 'Complex Document' },
          chapters: {
            file: chaptersTemplateFile,
            slots: {
              chapter1: {
                file: chapterTemplateFile,
                slots: {
                  chapter_title: { content: 'Chapter 1: Introduction' },
                  chapter_content: { file: chapter1ContentFile },
                  subsections: {
                    file: subsectionsTemplateFile,
                    slots: {
                      subsection1: { content: 'First subsection content' },
                      subsection2: { file: subsection2ContentFile },
                    },
                  },
                },
              },
              chapter2: {
                file: chapterTemplateFile2,
                slots: {
                  chapter_title: { content: 'Chapter 2: Advanced Topics' },
                  chapter_content: { file: chapter2ContentFile },
                  subsections: { content: 'No subsections for this chapter' },
                },
              },
            },
          },
        },
      };
      const configFile = await createTempJsonConfig(config);

      try {
        await cli.run(['compose', documentTemplateFile, '--json', configFile]);

        const expectedOutput =
          'Title: Complex Document\nChapters: Chapter 1: Chapter Title: Chapter 1: Introduction\nChapter Content: Introduction chapter content.\nSubsections: Subsection 1: First subsection content\nSubsection 2: Second subsection from file.\nChapter 2: Chapter Title: Chapter 2: Advanced Topics\nChapter Content: Advanced topics content.\nSubsections: No subsections for this chapter';
        assertEquals(consoleLogOutput, [expectedOutput]);
        assertEquals(consoleErrorOutput, []);
      } finally {
        await cleanupTempFile(documentTemplateFile);
        await cleanupTempFile(configFile);
        await cleanupTempFile(chaptersTemplateFile);
        await cleanupTempFile(chapterTemplateFile);
        await cleanupTempFile(chapterTemplateFile2);
        await cleanupTempFile(subsectionsTemplateFile);
        await cleanupTempFile(chapter1ContentFile);
        await cleanupTempFile(chapter2ContentFile);
        await cleanupTempFile(subsection2ContentFile);
        restoreConsole();
      }
    });

    await t.step(
      'should handle nested composition with mixed content and file references',
      async () => {
        mockConsole();

        const mainTemplateContent = 'Document: <!-- outlet: document -->';
        const mainTemplateFile = await createTempFile(mainTemplateContent);

        const documentTemplateContent =
          'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->\nSidebar: <!-- outlet: sidebar -->';
        const documentTemplateFile = await createTempFile(documentTemplateContent);

        const contentFile = await createTempFile('Main document content from file.');

        const config: JsonConfig = {
          slots: {
            document: {
              file: documentTemplateFile,
              slots: {
                title: { content: 'Mixed Content Document' },
                content: { file: contentFile },
                sidebar: {
                  content: 'Sidebar with nested content',
                  slots: {
                    widget: { content: 'Widget content' },
                  },
                },
              },
            },
          },
        };
        const configFile = await createTempJsonConfig(config);

        try {
          await cli.run(['compose', mainTemplateFile, '--json', configFile]);

          const expectedOutput =
            'Document: Title: Mixed Content Document\nContent: Main document content from file.\nSidebar: Sidebar with nested content';
          assertEquals(consoleLogOutput, [expectedOutput]);
          assertEquals(consoleErrorOutput, []);
        } finally {
          await cleanupTempFile(mainTemplateFile);
          await cleanupTempFile(configFile);
          await cleanupTempFile(documentTemplateFile);
          await cleanupTempFile(contentFile);
          restoreConsole();
        }
      },
    );
  });

Deno.test('JSON Configuration - CLI Override Tests', async (t) => {
  const cli = new CliInterface();

  await t.step(
    'should allow CLI flags to override JSON configuration values with long flags',
    async () => {
      mockConsole();

      const templateContent =
        'Title: <!-- outlet: title -->\nAuthor: <!-- outlet: author -->\nVersion: <!-- outlet: version -->\nDescription: <!-- outlet: description -->';
      const templateFile = await createTempFile(templateContent);

      const descriptionFile = await createTempFile('Default description from file.');

      const config: JsonConfig = {
        slots: {
          title: { content: 'Default Title' },
          author: { content: 'Default Author' },
          version: { content: '1.0.0' },
          description: { file: descriptionFile },
        },
      };
      const configFile = await createTempJsonConfig(config);

      try {
        await cli.run([
          'compose',
          templateFile,
          '--json',
          configFile,
          '--slot',
          'title=Custom Title',
          '--slot',
          'author=Jane Smith',
        ]);

        const expectedOutput =
          'Title: Custom Title\nAuthor: Jane Smith\nVersion: 1.0.0\nDescription: Default description from file.';
        assertEquals(consoleLogOutput, [expectedOutput]);
        assertEquals(consoleErrorOutput, []);
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(configFile);
        await cleanupTempFile(descriptionFile);
        restoreConsole();
      }
    },
  );

  await t.step(
    'should allow CLI flags to override JSON configuration values with short flags',
    async () => {
      mockConsole();

      const templateContent =
        'Title: <!-- outlet: title -->\nAuthor: <!-- outlet: author -->\nVersion: <!-- outlet: version -->';
      const templateFile = await createTempFile(templateContent);

      const config: JsonConfig = {
        slots: {
          title: { content: 'JSON Title' },
          author: { content: 'JSON Author' },
          version: { content: '1.0.0' },
        },
      };
      const configFile = await createTempJsonConfig(config);

      try {
        await cli.run([
          'compose',
          templateFile,
          '-j',
          configFile,
          '-s',
          'title=CLI Title',
          '-s',
          'version=2.0.0',
        ]);

        const expectedOutput = 'Title: CLI Title\nAuthor: JSON Author\nVersion: 2.0.0';
        assertEquals(consoleLogOutput, [expectedOutput]);
        assertEquals(consoleErrorOutput, []);
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(configFile);
        restoreConsole();
      }
    },
  );

  await t.step(
    'should allow CLI flags to override JSON with mixed long and short flags',
    async () => {
      mockConsole();

      const templateContent =
        'Title: <!-- outlet: title -->\nAuthor: <!-- outlet: author -->\nVersion: <!-- outlet: version -->\nFooter: <!-- outlet: footer -->';
      const templateFile = await createTempFile(templateContent);

      const config: JsonConfig = {
        slots: {
          title: { content: 'JSON Title' },
          author: { content: 'JSON Author' },
          version: { content: '1.0.0' },
        },
      };
      const configFile = await createTempJsonConfig(config);

      try {
        await cli.run([
          'compose',
          templateFile,
          '--json',
          configFile,
          '-s',
          'title=Mixed Flags Title',
          '--slot',
          'version=2.0.0',
          '-s',
          'footer=Added by CLI',
        ]);

        const expectedOutput =
          'Title: Mixed Flags Title\nAuthor: JSON Author\nVersion: 2.0.0\nFooter: Added by CLI';
        assertEquals(consoleLogOutput, [expectedOutput]);
        assertEquals(consoleErrorOutput, []);
      } finally {
        await cleanupTempFile(templateFile);
        await cleanupTempFile(configFile);
        restoreConsole();
      }
    },
  );

  await t.step('should handle multiple JSON files with precedence rules', async () => {
    mockConsole();

    const templateContent =
      'Environment: <!-- outlet: environment -->\nAPI URL: <!-- outlet: api_url -->\nDebug: <!-- outlet: debug_info -->\nFooter: <!-- outlet: footer -->';
    const templateFile = await createTempFile(templateContent);

    const debugInfoFile = await createTempFile('Debug information from file.');

    // Base configuration
    const baseConfig: JsonConfig = {
      slots: {
        environment: { content: 'Base Environment' },
        api_url: { content: 'http://base.example.com' },
        footer: { content: 'Base Footer' },
      },
    };
    const baseConfigFile = await createTempJsonConfig(baseConfig);

    // Environment-specific configuration (should override base)
    const envConfig: JsonConfig = {
      slots: {
        environment: { content: 'Development' },
        api_url: { content: 'http://localhost:3000' },
        debug_info: { file: debugInfoFile },
        footer: { content: 'DEV BUILD - Not for production' },
      },
    };
    const envConfigFile = await createTempJsonConfig(envConfig);

    try {
      // Note: This tests the behavior when multiple JSON configs are provided
      // The last one should take precedence for conflicting keys
      await cli.run([
        'compose',
        templateFile,
        '--json',
        baseConfigFile,
        '--json',
        envConfigFile,
      ]);

      const expectedOutput =
        'Environment: Development\nAPI URL: http://localhost:3000\nDebug: Debug information from file.\nFooter: DEV BUILD - Not for production';
      assertEquals(consoleLogOutput, [expectedOutput]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(baseConfigFile);
      await cleanupTempFile(envConfigFile);
      await cleanupTempFile(debugInfoFile);
      restoreConsole();
    }
  });

  await t.step('should handle environment-specific configuration patterns', async () => {
    mockConsole();

    const templateContent =
      'Environment: <!-- outlet: environment -->\nAPI URL: <!-- outlet: api_url -->\nDebug Panel: <!-- outlet: debug_panel -->';
    const templateFile = await createTempFile(templateContent);

    const debugPanelFile = await createTempFile('<div>Debug Panel Content</div>');

    // Development configuration
    const devConfig: JsonConfig = {
      slots: {
        environment: { content: 'development' },
        api_url: { content: 'http://localhost:3000' },
        debug_panel: { file: debugPanelFile },
      },
    };
    const devConfigFile = await createTempJsonConfig(devConfig);

    try {
      await cli.run(['compose', templateFile, '--json', devConfigFile]);

      const expectedOutput =
        'Environment: development\nAPI URL: http://localhost:3000\nDebug Panel: <div>Debug Panel Content</div>';
      assertEquals(consoleLogOutput, [expectedOutput]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(devConfigFile);
      await cleanupTempFile(debugPanelFile);
      restoreConsole();
    }
  });

  await t.step('should handle production configuration without debug info', async () => {
    mockConsole();

    const templateContent =
      'Environment: <!-- outlet: environment -->\nAPI URL: <!-- outlet: api_url -->\nDebug Panel: <!-- outlet: debug_panel -->\nFooter: <!-- outlet: footer -->';
    const templateFile = await createTempFile(templateContent);

    // Production configuration
    const prodConfig: JsonConfig = {
      slots: {
        environment: { content: 'production' },
        api_url: { content: 'https://api.example.com' },
        debug_panel: { content: '' }, // Empty debug panel for production
        footer: { content: '© 2024 Production System' },
      },
    };
    const prodConfigFile = await createTempJsonConfig(prodConfig);

    try {
      await cli.run(['compose', templateFile, '--json', prodConfigFile]);

      const expectedOutput =
        'Environment: production\nAPI URL: https://api.example.com\nDebug Panel: \nFooter: © 2024 Production System';
      assertEquals(consoleLogOutput, [expectedOutput]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(prodConfigFile);
      restoreConsole();
    }
  });

  await t.step('should handle CLI overrides with file references using @ syntax', async () => {
    mockConsole();

    const templateContent =
      'Title: <!-- outlet: title -->\nContent: <!-- outlet: content -->\nFooter: <!-- outlet: footer -->';
    const templateFile = await createTempFile(templateContent);

    const jsonContentFile = await createTempFile('Content from JSON config file.');
    const cliContentFile = await createTempFile('Content overridden by CLI file.');

    const config: JsonConfig = {
      slots: {
        title: { content: 'JSON Title' },
        content: { file: jsonContentFile },
        footer: { content: 'JSON Footer' },
      },
    };
    const configFile = await createTempJsonConfig(config);

    try {
      await cli.run([
        'compose',
        templateFile,
        '--json',
        configFile,
        '--slot',
        `content=@${cliContentFile}`,
        '--slot',
        'title=CLI Override Title',
      ]);

      const expectedOutput =
        'Title: CLI Override Title\nContent: Content overridden by CLI file.\nFooter: JSON Footer';
      assertEquals(consoleLogOutput, [expectedOutput]);
      assertEquals(consoleErrorOutput, []);
    } finally {
      await cleanupTempFile(templateFile);
      await cleanupTempFile(configFile);
      await cleanupTempFile(jsonContentFile);
      await cleanupTempFile(cliContentFile);
      restoreConsole();
    }
  });
});
