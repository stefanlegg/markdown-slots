#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * File-Based Composition Example
 *
 * This example demonstrates how to compose markdown content
 * from multiple files with nested slot resolution.
 */

import { composeMarkdown } from '../src/mod.ts';

// First, let's create some example files
console.log('Creating example files...');

// Create a main template
const mainTemplate = `# Project Documentation

<!-- outlet: overview -->

## Installation

<!-- outlet: installation -->

## Usage

<!-- outlet: usage -->

<!-- outlet: footer -->`;

const overviewContent = `## Overview

This is a powerful markdown composition tool that allows you to:

- Compose markdown from multiple sources
- Use dynamic content generation
- Handle errors gracefully
- Support nested compositions

<!-- outlet: features -->`;

const featuresContent = `### Key Features

- **Slot-based composition**: Use \`<!-- outlet: name -->\` markers
- **Multiple source types**: Content, files, and functions
- **Error handling**: Configurable error modes
- **Circular dependency detection**: Prevents infinite loops
- **Caching support**: Improve performance with caching
- **Parallel processing**: Process multiple slots concurrently`;

const installationContent = `\`\`\`bash
# Install Deno if you haven't already
curl -fsSL https://deno.land/install.sh | sh

# Clone the repository
git clone https://github.com/example/markdown-slots.git
cd markdown-slots

# Run tests
deno task test
\`\`\``;

const usageContent = `\`\`\`typescript
import { composeMarkdown } from './src/mod.ts';

const result = await composeMarkdown({
  content: 'Hello <!-- outlet: name -->!',
  slots: {
    name: { content: 'World' }
  }
});

console.log(result.markdown); // "Hello World!"
\`\`\``;

const footerContent = `---

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) for details.`;

// Create temp directory and write files
await Deno.mkdir('./examples/temp', { recursive: true });
await Deno.writeTextFile('./examples/temp/main.md', mainTemplate);
await Deno.writeTextFile('./examples/temp/overview.md', overviewContent);
await Deno.writeTextFile('./examples/temp/features.md', featuresContent);
await Deno.writeTextFile('./examples/temp/installation.md', installationContent);
await Deno.writeTextFile('./examples/temp/usage.md', usageContent);
await Deno.writeTextFile('./examples/temp/footer.md', footerContent);

console.log('✅ Example files created in ./examples/temp/');
console.log('\n' + '='.repeat(60) + '\n');

// Example 1: Basic file-based composition
console.log('=== Example 1: Basic File Composition ===');

const fileBasedExample = {
  file: './examples/temp/main.md',
  slots: {
    overview: { file: './examples/temp/overview.md' },
    installation: { file: './examples/temp/installation.md' },
    usage: { file: './examples/temp/usage.md' },
    footer: { file: './examples/temp/footer.md' },
  },
};

try {
  const result = await composeMarkdown(fileBasedExample);
  console.log('Composed documentation:');
  console.log(result.markdown.substring(0, 500) + '...\n[Content truncated for display]');
  console.log('\n✅ Successfully composed from files');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Example 2: Nested file composition
console.log('=== Example 2: Nested File Composition ===');

const nestedExample = {
  file: './examples/temp/main.md',
  slots: {
    overview: {
      file: './examples/temp/overview.md',
      slots: {
        features: { file: './examples/temp/features.md' },
      },
    },
    installation: { file: './examples/temp/installation.md' },
    usage: { file: './examples/temp/usage.md' },
    footer: { file: './examples/temp/footer.md' },
  },
};

try {
  const result = await composeMarkdown(nestedExample);
  console.log('Nested composition result:');
  console.log('Length:', result.markdown.length, 'characters');
  console.log('Contains features section:', result.markdown.includes('Key Features'));
  console.log('\n✅ Successfully composed with nested files');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Example 3: Mixed sources with caching
console.log('=== Example 3: Mixed Sources with Caching ===');

const cache = new Map<string, string>();

const mixedExample = {
  content: `# Mixed Content Example

<!-- outlet: file-content -->

<!-- outlet: dynamic-content -->

<!-- outlet: static-content -->`,
  slots: {
    'file-content': { file: './examples/temp/features.md' },
    'dynamic-content': () => Promise.resolve(`**Generated at:** ${new Date().toLocaleString()}`),
    'static-content': { content: 'This is static content added directly.' },
  },
};

try {
  console.log('First composition (populates cache):');
  const startTime = Date.now();
  const _result1 = await composeMarkdown(mixedExample, { cache });
  const firstTime = Date.now() - startTime;
  console.log(`Completed in ${firstTime}ms`);
  console.log('Cache size:', cache.size);

  console.log('\nSecond composition (uses cache):');
  const startTime2 = Date.now();
  const _result2 = await composeMarkdown(mixedExample, { cache });
  const secondTime = Date.now() - startTime2;
  console.log(`Completed in ${secondTime}ms`);
  console.log('Cache size:', cache.size);

  console.log('\n✅ Caching demonstration completed');
  console.log(
    `Performance improvement: ${firstTime > secondTime ? 'Yes' : 'Minimal (files are small)'}`,
  );
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Cleanup
console.log('Cleaning up example files...');
try {
  await Deno.remove('./examples/temp', { recursive: true });
  console.log('✅ Cleanup completed');
} catch (error) {
  console.log('⚠️  Cleanup failed (files may not exist):', error.message);
}

console.log('\n✅ File-based examples completed!');
console.log('\nNext: Try running the advanced examples with:');
console.log('deno run --allow-read --allow-write examples/advanced.ts');
