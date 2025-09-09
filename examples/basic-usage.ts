#!/usr/bin/env -S deno run --allow-read

/**
 * Basic Usage Example
 *
 * This example demonstrates the fundamental usage of markdown-slots
 * for composing markdown content with slot replacement.
 */

import { composeMarkdown } from '../src/mod.ts';

// Example 1: Basic slot replacement with content
console.log('=== Example 1: Basic Slot Replacement ===');

const basicExample = {
  content: `# Welcome to My Blog

<!-- outlet: intro -->

## Latest Posts

<!-- outlet: posts -->

<!-- outlet: footer -->`,
  slots: {
    intro: {
      content: 'Welcome to my personal blog where I share thoughts on technology and life.',
    },
    posts: {
      content:
        '- [Understanding TypeScript](./posts/typescript.md)\n- [Deno vs Node.js](./posts/deno-vs-node.md)',
    },
    footer: {
      content: '---\n\n*Thanks for reading! Follow me on [Twitter](https://twitter.com/example)*',
    },
  },
};

try {
  const result = await composeMarkdown(basicExample);
  console.log('Composed markdown:');
  console.log(result.markdown);
  console.log('\nErrors:', result.errors || 'None');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Example 2: Function-based dynamic content
console.log('=== Example 2: Dynamic Content with Functions ===');

const dynamicExample = {
  content: `# Daily Report

**Generated:** <!-- outlet: timestamp -->

## System Status

<!-- outlet: status -->

## Random Quote

<!-- outlet: quote -->`,
  slots: {
    timestamp: () => Promise.resolve(new Date().toISOString()),
    status: async () => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 100));
      return '✅ All systems operational';
    },
    quote: () => {
      const quotes = [
        'The only way to do great work is to love what you do. - Steve Jobs',
        'Innovation distinguishes between a leader and a follower. - Steve Jobs',
        'Stay hungry, stay foolish. - Steve Jobs',
      ];
      return Promise.resolve(quotes[Math.floor(Math.random() * quotes.length)]);
    },
  },
};

try {
  const result = await composeMarkdown(dynamicExample);
  console.log('Dynamic composed markdown:');
  console.log(result.markdown);
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');

// Example 3: Error handling
console.log('=== Example 3: Error Handling ===');

const errorExample = {
  content: `# Document with Issues

<!-- outlet: existing -->

<!-- outlet: missing -->

<!-- outlet: file-content -->`,
  slots: {
    existing: { content: 'This slot exists and works fine.' },
    'file-content': { file: './non-existent-file.md' },
    // Note: 'missing' slot is intentionally not defined
  },
};

try {
  const result = await composeMarkdown(errorExample, {
    onMissingSlot: 'ignore', // Ignore missing slots
    onFileError: 'warn-empty', // Show empty content for missing files
  });
  console.log('Composed markdown with error handling:');
  console.log(result.markdown);
  console.log('\nErrors encountered:');
  result.errors?.forEach((error, index) => {
    console.log(`${index + 1}. ${error.type}: ${error.message}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');
console.log('✅ Basic usage examples completed!');
console.log('\nNext: Try running the file-based examples with:');
console.log('deno run --allow-read examples/file-based.ts');
