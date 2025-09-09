/**
 * Documentation generation tests for real-world scenarios
 * Tests README generation, API documentation, and multi-file documentation workflows
 * Requirements: 7.1, 5.1
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
 * Setup documentation generation test files
 */
async function setupDocumentationFiles(): Promise<{ cleanup: () => Promise<void> }> {
  const tempFiles: string[] = [];

  // Create README template
  const readmeTemplate = `# <!-- outlet: project_name -->

[![CI](https://img.shields.io/badge/CI-<!-- outlet: ci_status -->-brightgreen.svg)](#)
[![Version](https://img.shields.io/badge/Version-<!-- outlet: version -->-blue.svg)](#)
[![License](https://img.shields.io/badge/License-<!-- outlet: license -->-yellow.svg)](#)

<!-- outlet: description -->

## ✨ Features

<!-- outlet: features -->

## 📦 Installation

<!-- outlet: installation -->

## 🚀 Quick Start

<!-- outlet: quick_start -->

## 📖 API Reference

<!-- outlet: api_reference -->

## 🔧 Examples

<!-- outlet: examples -->

## 🤝 Contributing

<!-- outlet: contributing -->

## 📄 License

<!-- outlet: license_text -->

---

*Generated on <!-- outlet: build_date --> from commit <!-- outlet: commit_sha -->*`;

  await Deno.writeTextFile('./readme-template.md', readmeTemplate);
  tempFiles.push('./readme-template.md');

  // Create API documentation template
  const apiTemplate = `# API Documentation

**Version:** <!-- outlet: api_version -->  
**Last Updated:** <!-- outlet: last_updated -->

## Overview

<!-- outlet: api_overview -->

## Authentication

<!-- outlet: authentication -->

## Endpoints

<!-- outlet: endpoints -->

### Core Functions

<!-- outlet: core_functions -->

### Utility Functions

<!-- outlet: utility_functions -->

## Error Handling

<!-- outlet: error_handling -->

## Examples

<!-- outlet: api_examples -->

---

*API documentation generated automatically from source code*`;

  await Deno.writeTextFile('./api-template.md', apiTemplate);
  tempFiles.push('./api-template.md');

  // Create content files for README
  await Deno.writeTextFile(
    './content/description.md',
    `A powerful and flexible TypeScript library for composing markdown content with slot-based templating. Build modular, reusable markdown documents with dynamic content generation, file inclusion, and robust error handling.`,
  );
  tempFiles.push('./content/description.md');

  await Deno.writeTextFile(
    './content/features.md',
    `- **🔧 Slot-based composition**: Use \`<!-- outlet:  name -->\` markers to define content slots
- **📁 Multiple source types**: Content strings, file paths, and async functions
- **🔄 Nested compositions**: Unlimited nesting with circular dependency detection
- **⚡ Performance optimized**: Optional caching and parallel processing
- **🛡️ Error resilient**: Configurable error handling strategies
- **🎯 TypeScript first**: Full type safety and IntelliSense support`,
  );
  tempFiles.push('./content/features.md');

  await Deno.writeTextFile(
    './content/installation.md',
    `\`\`\`bash
# For Deno
import { composeMarkdown } from 'https://deno.land/x/markdown_slots/mod.ts';

# For Node.js
npm install markdown-slots
\`\`\``,
  );
  tempFiles.push('./content/installation.md');

  await Deno.writeTextFile(
    './content/quick-start.md',
    `\`\`\`typescript
import { composeMarkdown } from './src/mod.ts';

const result = await composeMarkdown({
  content: \`# Welcome

<!-- outlet:  greeting -->

<!-- outlet:  content -->\`,
  slots: {
    greeting: { content: 'Hello, World!' },
    content: { content: 'This is dynamically inserted content.' }
  }
});

console.log(result.markdown);
\`\`\``,
  );
  tempFiles.push('./content/quick-start.md');

  // Create API content files
  await Deno.writeTextFile(
    './api/overview.md',
    `The Markdown Slots API provides a simple yet powerful interface for composing markdown documents. The main entry point is the \`composeMarkdown\` function which takes a markdown node and optional configuration.`,
  );
  tempFiles.push('./api/overview.md');

  await Deno.writeTextFile(
    './api/authentication.md',
    `No authentication is required for the core library. When using the CLI, ensure you have appropriate file system permissions:

\`\`\`bash
# Deno permissions
deno run --allow-read --allow-write cli.ts
\`\`\``,
  );
  tempFiles.push('./api/authentication.md');

  await Deno.writeTextFile(
    './api/core-functions.md',
    `### \`composeMarkdown(node, options?)\`

Main function to compose markdown content.

**Parameters:**
- \`node: MarkdownNode\` - The root node to compose
- \`options?: ComposeOptions\` - Optional configuration

**Returns:** \`Promise<ComposeResult>\`

### \`parseOutlets(content)\`

Parse outlet markers from markdown content.

**Parameters:**
- \`content: string\` - Markdown content to parse

**Returns:** \`OutletInfo[]\``,
  );
  tempFiles.push('./api/core-functions.md');

  // Create README configuration
  const readmeConfig = {
    slots: {
      project_name: { content: 'Markdown Slots' },
      ci_status: { content: 'passing' },
      version: { content: '1.0.0' },
      license: { content: 'MIT' },
      description: { file: './content/description.md' },
      features: { file: './content/features.md' },
      installation: { file: './content/installation.md' },
      quick_start: { file: './content/quick-start.md' },
      api_reference: {
        content: 'See [API Documentation](docs/API.md) for detailed API reference.',
      },
      examples: {
        content: 'See the [examples directory](examples/) for comprehensive usage examples.',
      },
      contributing: {
        content:
          'Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.',
      },
      license_text: { content: 'MIT License - see [LICENSE](LICENSE) for details.' },
    },
    options: {
      resolveFrom: 'file',
      parallel: true,
    },
  };

  await Deno.writeTextFile('./readme-config.json', JSON.stringify(readmeConfig, null, 2));
  tempFiles.push('./readme-config.json');

  // Create API documentation configuration
  const apiConfig = {
    slots: {
      api_version: { content: '1.0.0' },
      last_updated: { content: '2024-01-15' },
      api_overview: { file: './api/overview.md' },
      authentication: { file: './api/authentication.md' },
      endpoints: {
        content:
          'The library provides programmatic APIs rather than HTTP endpoints. See function reference below.',
      },
      core_functions: { file: './api/core-functions.md' },
      utility_functions: {
        content:
          'Additional utility functions are available for advanced use cases. See source code for details.',
      },
      error_handling: {
        content:
          'The library provides comprehensive error handling with configurable strategies for missing slots and file errors.',
      },
      api_examples: {
        content: 'See the [examples directory](../examples/) for comprehensive API usage examples.',
      },
    },
    options: {
      resolveFrom: 'file',
      parallel: true,
    },
  };

  await Deno.writeTextFile('./api-config.json', JSON.stringify(apiConfig, null, 2));
  tempFiles.push('./api-config.json');

  // Create multi-file documentation structure
  await Deno.mkdir('./docs', { recursive: true });

  const userGuideTemplate = `# User Guide

## Table of Contents

<!-- outlet: toc -->

## Getting Started

<!-- outlet: getting_started -->

## Basic Usage

<!-- outlet: basic_usage -->

## Advanced Features

<!-- outlet: advanced_features -->

## Troubleshooting

<!-- outlet: troubleshooting -->`;

  await Deno.writeTextFile('./docs/user-guide-template.md', userGuideTemplate);
  tempFiles.push('./docs/user-guide-template.md');

  const userGuideConfig = {
    slots: {
      toc: {
        content:
          '- [Getting Started](#getting-started)\n- [Basic Usage](#basic-usage)\n- [Advanced Features](#advanced-features)\n- [Troubleshooting](#troubleshooting)',
      },
      getting_started: { file: './content/installation.md' },
      basic_usage: { file: './content/quick-start.md' },
      advanced_features: {
        content:
          'Advanced features include nested compositions, parallel processing, and custom error handling strategies.',
      },
      troubleshooting: {
        content:
          'Common issues and solutions can be found in the main README troubleshooting section.',
      },
    },
  };

  await Deno.writeTextFile(
    './docs/user-guide-config.json',
    JSON.stringify(userGuideConfig, null, 2),
  );
  tempFiles.push('./docs/user-guide-config.json');

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
        await Deno.remove('./docs', { recursive: true });
        await Deno.remove('./content', { recursive: true });
        await Deno.remove('./api', { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

Deno.test('Documentation Generation Tests', async (t) => {
  // Create directories first
  await Deno.mkdir('./content', { recursive: true });
  await Deno.mkdir('./api', { recursive: true });

  const { cleanup } = await setupDocumentationFiles();

  await t.step('should generate README from template with comprehensive content', async () => {
    const result = await runCli([
      'compose',
      'readme-template.md',
      '--json',
      'readme-config.json',
      '--slot',
      'build_date=2024-01-15T10:30:00Z',
      '--slot',
      'commit_sha=abc123def456',
    ]);

    assertEquals(result.code, 0);

    // Verify README structure
    assertStringIncludes(result.stdout, '# Markdown Slots');
    assertStringIncludes(
      result.stdout,
      '[![CI](https://img.shields.io/badge/CI-passing-brightgreen.svg)](#)',
    );
    assertStringIncludes(
      result.stdout,
      '[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)',
    );
    assertStringIncludes(
      result.stdout,
      '[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#)',
    );

    // Verify content sections
    assertStringIncludes(result.stdout, 'A powerful and flexible TypeScript library');
    assertStringIncludes(result.stdout, '## ✨ Features');
    assertStringIncludes(result.stdout, '🔧 Slot-based composition');
    assertStringIncludes(result.stdout, '## 📦 Installation');
    assertStringIncludes(result.stdout, 'import { composeMarkdown }');
    assertStringIncludes(result.stdout, '## 🚀 Quick Start');
    assertStringIncludes(result.stdout, 'const result = await composeMarkdown');

    // Verify generated metadata
    assertStringIncludes(
      result.stdout,
      '*Generated on 2024-01-15T10:30:00Z from commit abc123def456*',
    );
  });

  await t.step('should generate API documentation with structured content', async () => {
    const result = await runCli([
      'compose',
      'api-template.md',
      '--json',
      'api-config.json',
    ]);

    assertEquals(result.code, 0);

    // Verify API documentation structure
    assertStringIncludes(result.stdout, '# API Documentation');
    assertStringIncludes(result.stdout, '**Version:** 1.0.0');
    assertStringIncludes(result.stdout, '**Last Updated:** 2024-01-15');

    // Verify content sections
    assertStringIncludes(result.stdout, '## Overview');
    assertStringIncludes(
      result.stdout,
      'The Markdown Slots API provides a simple yet powerful interface',
    );
    assertStringIncludes(result.stdout, '## Authentication');
    assertStringIncludes(result.stdout, 'deno run --allow-read --allow-write');
    assertStringIncludes(result.stdout, '### Core Functions');
    assertStringIncludes(result.stdout, '`composeMarkdown(node, options?)`');
    assertStringIncludes(result.stdout, '`parseOutlets(content)`');

    // Verify generated footer
    assertStringIncludes(
      result.stdout,
      '*API documentation generated automatically from source code*',
    );
  });

  await t.step('should generate multi-file documentation workflow', async () => {
    // Generate README
    const readmeResult = await runCli([
      'compose',
      'readme-template.md',
      '--json',
      'readme-config.json',
      '--slot',
      'build_date=2024-01-15T10:30:00Z',
      '--slot',
      'commit_sha=abc123def456',
      '--output',
      'generated-README.md',
    ]);

    assertEquals(readmeResult.code, 0);

    // Generate API docs
    const apiResult = await runCli([
      'compose',
      'api-template.md',
      '--json',
      'api-config.json',
      '--output',
      'generated-API.md',
    ]);

    assertEquals(apiResult.code, 0);

    // Generate user guide
    const guideResult = await runCli([
      'compose',
      'docs/user-guide-template.md',
      '--json',
      'docs/user-guide-config.json',
      '--output',
      'generated-USER-GUIDE.md',
    ]);

    assertEquals(guideResult.code, 0);

    // Verify all files were created
    const readmeContent = await Deno.readTextFile('generated-README.md');
    const apiContent = await Deno.readTextFile('generated-API.md');
    const guideContent = await Deno.readTextFile('generated-USER-GUIDE.md');

    // Verify README content
    assertStringIncludes(readmeContent, '# Markdown Slots');
    assertStringIncludes(readmeContent, 'A powerful and flexible TypeScript library');

    // Verify API content
    assertStringIncludes(apiContent, '# API Documentation');
    assertStringIncludes(apiContent, '`composeMarkdown(node, options?)`');

    // Verify user guide content
    assertStringIncludes(guideContent, '# User Guide');
    assertStringIncludes(guideContent, '## Table of Contents');
    assertStringIncludes(guideContent, '- [Getting Started](#getting-started)');

    // Cleanup generated files
    await Deno.remove('generated-README.md');
    await Deno.remove('generated-API.md');
    await Deno.remove('generated-USER-GUIDE.md');
  });

  await t.step('should handle documentation generation with dynamic content', async () => {
    const currentDate = new Date().toISOString();
    const result = await runCli([
      'compose',
      'readme-template.md',
      '--json',
      'readme-config.json',
      '--slot',
      `build_date=${currentDate}`,
      '--slot',
      'commit_sha=dynamic-commit-hash',
      '--slot',
      'version=2.0.0-beta',
    ]);

    assertEquals(result.code, 0);

    // Verify dynamic content
    assertStringIncludes(
      result.stdout,
      '[![Version](https://img.shields.io/badge/Version-2.0.0-beta-blue.svg)](#)',
    );
    assertStringIncludes(
      result.stdout,
      `*Generated on ${currentDate} from commit dynamic-commit-hash*`,
    );
  });

  await t.step('should generate documentation with nested template structures', async () => {
    // Create nested documentation template
    const nestedTemplate = `# Project Documentation

## Main Section

<!-- outlet: main_section -->

## API Reference

<!-- outlet: api_section -->`;

    const mainSectionTemplate = `### <!-- outlet: section_title -->

<!-- outlet: section_content -->

#### Examples

<!-- outlet: section_examples -->`;

    const apiSectionTemplate = `### <!-- outlet: api_title -->

<!-- outlet: api_content -->

#### Examples

<!-- outlet: api_examples -->`;

    await Deno.writeTextFile('./nested-doc-template.md', nestedTemplate);
    await Deno.writeTextFile('./main-section-template.md', mainSectionTemplate);
    await Deno.writeTextFile('./api-section-template.md', apiSectionTemplate);

    const nestedConfig = {
      slots: {
        main_section: {
          file: './main-section-template.md',
          slots: {
            section_title: { content: 'Getting Started' },
            section_content: { file: './content/installation.md' },
            section_examples: { content: 'See examples directory for usage patterns.' },
          },
        },
        api_section: {
          file: './api-section-template.md',
          slots: {
            api_title: { content: 'Core API' },
            api_content: { file: './api/core-functions.md' },
            api_examples: { content: 'API examples are available in the test suite.' },
          },
        },
      },
    };

    await Deno.writeTextFile('./nested-config.json', JSON.stringify(nestedConfig, null, 2));

    const result = await runCli([
      'compose',
      'nested-doc-template.md',
      '--json',
      'nested-config.json',
    ]);

    assertEquals(result.code, 0);

    // Verify nested structure
    assertStringIncludes(result.stdout, '# Project Documentation');
    assertStringIncludes(result.stdout, '### Getting Started');
    assertStringIncludes(result.stdout, 'import { composeMarkdown }');
    assertStringIncludes(result.stdout, '### Core API');
    assertStringIncludes(result.stdout, '`composeMarkdown(node, options?)`');
    assertStringIncludes(result.stdout, 'See examples directory for usage patterns.');
    assertStringIncludes(result.stdout, 'API examples are available in the test suite.');

    // Cleanup
    await Deno.remove('./nested-doc-template.md');
    await Deno.remove('./main-section-template.md');
    await Deno.remove('./api-section-template.md');
    await Deno.remove('./nested-config.json');
  });

  await t.step(
    'should handle documentation generation with missing content gracefully',
    async () => {
      const result = await runCli([
        'compose',
        'readme-template.md',
        '--slot',
        'project_name=Test Project',
        '--slot',
        'ci_status=passing',
        '--slot',
        'version=1.0.0',
        '--slot',
        'license=MIT',
        '--slot',
        'description=@missing-description.md',
        '--slot',
        'features=Basic features list',
        '--slot',
        'installation=npm install test-project',
        '--slot',
        'quick_start=Quick start guide',
        '--slot',
        'api_reference=API reference',
        '--slot',
        'examples=Examples section',
        '--slot',
        'contributing=Contributing guide',
        '--slot',
        'license_text=MIT License',
        '--slot',
        'build_date=2024-01-15',
        '--slot',
        'commit_sha=abc123',
      ]);

      assertEquals(result.code, 0);

      // Should still generate valid output with available content even with missing files
      assertStringIncludes(result.stdout, '# Test Project');
      assertStringIncludes(result.stdout, 'Basic features list');
      assertStringIncludes(result.stdout, 'npm install test-project');
      assertStringIncludes(result.stdout, 'Quick start guide');

      // The CLI handles missing files gracefully by inserting empty content
      // This is the expected behavior based on the CLI's error handling strategy
    },
  );

  await t.step('should generate documentation with build system integration patterns', async () => {
    // Test NPM script pattern
    const result = await runCli([
      'compose',
      'readme-template.md',
      '--json',
      'readme-config.json',
      '--slot',
      'build_date=$(date -u +%Y-%m-%dT%H:%M:%SZ)',
      '--slot',
      'commit_sha=$GITHUB_SHA',
      '--slot',
      'version=$npm_package_version',
    ]);

    assertEquals(result.code, 0);

    // Verify build variables are included (as literal strings in this test)
    assertStringIncludes(
      result.stdout,
      '*Generated on $(date -u +%Y-%m-%dT%H:%M:%SZ) from commit $GITHUB_SHA*',
    );
  });

  await t.step(
    'should handle large documentation generation with parallel processing',
    async () => {
      // Create large content files
      const largeContent = 'Large content section. '.repeat(1000);
      await Deno.writeTextFile('./large-content-1.md', largeContent);
      await Deno.writeTextFile('./large-content-2.md', largeContent);
      await Deno.writeTextFile('./large-content-3.md', largeContent);

      const largeDocConfig = {
        slots: {
          project_name: { content: 'Large Documentation Project' },
          section1: { file: './large-content-1.md' },
          section2: { file: './large-content-2.md' },
          section3: { file: './large-content-3.md' },
          version: { content: '1.0.0' },
          license: { content: 'MIT' },
        },
        options: {
          parallel: true,
          resolveFrom: 'file',
        },
      };

      await Deno.writeTextFile('./large-doc-config.json', JSON.stringify(largeDocConfig, null, 2));

      const largeTemplate = `# <!-- outlet: project_name -->

## Section 1
<!-- outlet: section1 -->

## Section 2
<!-- outlet: section2 -->

## Section 3
<!-- outlet: section3 -->

Version: <!-- outlet: version -->
License: <!-- outlet: license -->`;

      await Deno.writeTextFile('./large-doc-template.md', largeTemplate);

      const result = await runCli([
        'compose',
        'large-doc-template.md',
        '--json',
        'large-doc-config.json',
        '--verbose',
      ]);

      assertEquals(result.code, 0);

      // Verify large content is processed
      assertStringIncludes(result.stdout, '# Large Documentation Project');
      assertStringIncludes(result.stdout, 'Large content section.');
      assertStringIncludes(result.stdout, 'Version: 1.0.0');

      // Cleanup large files
      await Deno.remove('./large-content-1.md');
      await Deno.remove('./large-content-2.md');
      await Deno.remove('./large-content-3.md');
      await Deno.remove('./large-doc-config.json');
      await Deno.remove('./large-doc-template.md');
    },
  );

  await cleanup();
});
