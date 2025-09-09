/**
 * Tests for ConfigurationLoader
 */

import { assertEquals, assertRejects } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { join, resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { ConfigurationLoader } from '../../src/cli/configuration-loader.ts';
import type { CliOptions, JsonConfig } from '../../src/types.ts';

// Test fixtures directory
const FIXTURES_DIR = resolve('tests/fixtures');

Deno.test('ConfigurationLoader', async (t) => {
  const loader = new ConfigurationLoader();

  await t.step('should load basic CLI configuration without JSON', async () => {
    const options: CliOptions = {
      template: 'template.md',
      slots: {
        title: 'My Title',
        content: 'Some content',
      },
    };

    const result = await loader.load(options);

    assertEquals('file' in result && result.file, resolve('template.md'));
    assertEquals(result.slots?.title, { content: 'My Title' });
    assertEquals(result.slots?.content, { content: 'Some content' });
  });

  await t.step('should handle CLI slots with file references using @file.md syntax', async () => {
    const options: CliOptions = {
      template: 'template.md',
      slots: {
        header: '@header.md',
        footer: '@footer.md',
        title: 'Literal content',
      },
    };

    const result = await loader.load(options);

    assertEquals('file' in result && result.file, resolve('template.md'));
    assertEquals(result.slots?.header, { file: resolve('header.md') });
    assertEquals(result.slots?.footer, { file: resolve('footer.md') });
    assertEquals(result.slots?.title, { content: 'Literal content' });
  });

  await t.step('should load and parse valid JSON configuration', async () => {
    // Create a temporary JSON config file
    const configPath = join(FIXTURES_DIR, 'test-config.json');
    const config: JsonConfig = {
      slots: {
        title: { content: 'JSON Title' },
        content: { file: './content.md' },
        nested: {
          file: './nested.md',
          slots: {
            section: { content: 'Nested content' },
          },
        },
      },
      options: {
        resolveFrom: 'file',
        onMissingSlot: 'ignore',
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      const result = await loader.load(options);

      assertEquals('file' in result && result.file, resolve('template.md'));
      assertEquals(result.slots?.title, { content: 'JSON Title' });
      assertEquals(result.slots?.content, { file: resolve(FIXTURES_DIR, 'content.md') });

      // Check nested structure
      const nested = result.slots?.nested as { file?: string; slots?: Record<string, unknown> };
      assertEquals(nested.file, resolve(FIXTURES_DIR, 'nested.md'));
      assertEquals(nested.slots?.section, { content: 'Nested content' });
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should merge JSON and CLI configurations with CLI taking precedence', async () => {
    // Create a temporary JSON config file
    const configPath = join(FIXTURES_DIR, 'merge-config.json');
    const config: JsonConfig = {
      slots: {
        title: { content: 'JSON Title' },
        author: { content: 'JSON Author' },
        content: { file: './json-content.md' },
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {
          title: 'CLI Title', // Should override JSON
          footer: '@cli-footer.md', // Should be added to JSON slots
        },
        json: configPath,
      };

      const result = await loader.load(options);

      assertEquals('file' in result && result.file, resolve('template.md'));
      // CLI should override JSON
      assertEquals(result.slots?.title, { content: 'CLI Title' });
      // JSON values should be preserved when not overridden
      assertEquals(result.slots?.author, { content: 'JSON Author' });
      assertEquals(result.slots?.content, { file: resolve(FIXTURES_DIR, 'json-content.md') });
      // CLI-only slots should be added
      assertEquals(result.slots?.footer, { file: resolve(FIXTURES_DIR, 'cli-footer.md') });
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step(
    'should resolve CLI file paths relative to JSON config directory when JSON is provided',
    async () => {
      // Create a temporary JSON config file in a subdirectory
      const configDir = join(FIXTURES_DIR, 'config-subdir');
      await Deno.mkdir(configDir, { recursive: true });

      const configPath = join(configDir, 'config.json');
      const config: JsonConfig = {
        slots: {
          existing: { content: 'From JSON' },
        },
      };

      await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

      try {
        const options: CliOptions = {
          template: 'template.md',
          slots: {
            header: '@../header.md', // Relative to config directory
          },
          json: configPath,
        };

        const result = await loader.load(options);

        // CLI file should be resolved relative to config directory
        assertEquals(result.slots?.header, { file: resolve(FIXTURES_DIR, 'header.md') });
      } finally {
        await Deno.remove(configPath);
        await Deno.remove(configDir);
      }
    },
  );

  await t.step('should handle short flags in CLI options', async () => {
    // This test verifies that the configuration loader works with options
    // that were parsed using short flags (-s, -j, -o, -v, -h)
    const options: CliOptions = {
      template: 'template.md',
      slots: {
        title: 'Short Flag Title',
        content: '@short-content.md',
      },
      json: undefined, // No JSON config
      output: 'output.md',
      verbose: true,
    };

    const result = await loader.load(options);

    assertEquals('file' in result && result.file, resolve('template.md'));
    assertEquals(result.slots?.title, { content: 'Short Flag Title' });
    assertEquals(result.slots?.content, { file: resolve('short-content.md') });
  });

  await t.step('should throw error for non-existent JSON config file', async () => {
    const options: CliOptions = {
      template: 'template.md',
      slots: {},
      json: 'non-existent-config.json',
    };

    await assertRejects(
      () => loader.load(options),
      Error,
      'JSON configuration file not found: non-existent-config.json',
    );
  });

  await t.step('should throw error for invalid JSON syntax', async () => {
    const configPath = join(FIXTURES_DIR, 'invalid-config.json');
    await Deno.writeTextFile(configPath, '{ invalid json }');

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      await assertRejects(
        () => loader.load(options),
        Error,
        'Invalid JSON in configuration file',
      );
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should throw error for invalid JSON config structure', async () => {
    const configPath = join(FIXTURES_DIR, 'invalid-structure-config.json');
    await Deno.writeTextFile(configPath, '"not an object"');

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      await assertRejects(
        () => loader.load(options),
        Error,
        'JSON configuration must be an object',
      );
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should throw error for slot source with both file and content', async () => {
    const configPath = join(FIXTURES_DIR, 'invalid-slot-config.json');
    const config = {
      slots: {
        invalid: {
          file: 'file.md',
          content: 'content',
        },
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      await assertRejects(
        () => loader.load(options),
        Error,
        'Slot source cannot have both "file" and "content" properties at slots.invalid',
      );
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should throw error for slot source with neither file nor content', async () => {
    const configPath = join(FIXTURES_DIR, 'empty-slot-config.json');
    const config = {
      slots: {
        empty: {},
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      await assertRejects(
        () => loader.load(options),
        Error,
        'Slot source must have either "file" or "content" property at slots.empty',
      );
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should handle complex nested MarkdownNode structures from JSON', async () => {
    const configPath = join(FIXTURES_DIR, 'nested-config.json');
    const config: JsonConfig = {
      slots: {
        main: {
          file: './main-template.md',
          slots: {
            header: { content: 'Nested Header' },
            body: {
              file: './body-template.md',
              slots: {
                section1: { content: 'Section 1 Content' },
                section2: { file: './section2.md' },
              },
            },
            footer: { content: 'Nested Footer' },
          },
        },
        sidebar: {
          content: 'Sidebar content',
          slots: {
            widget: { content: 'Widget content' },
          },
        },
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      const result = await loader.load(options);

      // Check main nested structure
      const main = result.slots?.main as {
        file?: string;
        content?: string;
        slots?: Record<string, unknown>;
      };
      assertEquals(main.file, resolve(FIXTURES_DIR, 'main-template.md'));
      assertEquals(main.slots?.header, { content: 'Nested Header' });
      assertEquals(main.slots?.footer, { content: 'Nested Footer' });

      // Check deeply nested structure
      const body = main.slots?.body as {
        file?: string;
        content?: string;
        slots?: Record<string, unknown>;
      };
      assertEquals(body.file, resolve(FIXTURES_DIR, 'body-template.md'));
      assertEquals(body.slots?.section1, { content: 'Section 1 Content' });
      assertEquals(body.slots?.section2, { file: resolve(FIXTURES_DIR, 'section2.md') });

      // Check sidebar structure
      const sidebar = result.slots?.sidebar as {
        file?: string;
        content?: string;
        slots?: Record<string, unknown>;
      };
      assertEquals(sidebar.content, 'Sidebar content');
      assertEquals(sidebar.slots?.widget, { content: 'Widget content' });
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should validate nested slot structures in JSON config', async () => {
    const configPath = join(FIXTURES_DIR, 'invalid-nested-config.json');
    const config = {
      slots: {
        main: {
          file: 'main.md',
          slots: {
            invalid: {
              // Missing both file and content
              slots: {
                nested: { content: 'This should not be reached' },
              },
            },
          },
        },
      },
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      await assertRejects(
        () => loader.load(options),
        Error,
        'Slot source must have either "file" or "content" property at slots.main.slots.invalid',
      );
    } finally {
      await Deno.remove(configPath);
    }
  });

  await t.step('should handle empty slots in both CLI and JSON', async () => {
    const configPath = join(FIXTURES_DIR, 'empty-slots-config.json');
    const config: JsonConfig = {
      slots: {},
    };

    await Deno.writeTextFile(configPath, JSON.stringify(config));

    try {
      const options: CliOptions = {
        template: 'template.md',
        slots: {},
        json: configPath,
      };

      const result = await loader.load(options);

      assertEquals('file' in result && result.file, resolve('template.md'));
      assertEquals(result.slots, {});
    } finally {
      await Deno.remove(configPath);
    }
  });
});
