#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Advanced Features Example
 *
 * This example demonstrates advanced features like:
 * - Circular dependency detection
 * - Depth limiting
 * - Parallel processing
 * - Complex nested compositions
 * - Error recovery strategies
 */

import { composeMarkdown } from '../src/mod.ts';

console.log('🚀 Advanced Markdown Slots Examples');
console.log('='.repeat(60));

// Example 1: Circular Dependency Detection
console.log('\n=== Example 1: Circular Dependency Detection ===');

// Create temp directory and files that reference each other
await Deno.mkdir('./examples/temp', { recursive: true });

const circularFile1 = './examples/temp/circular1.md';
const circularFile2 = './examples/temp/circular2.md';

await Deno.writeTextFile(
  circularFile1,
  '# File 1\n\nContent from file 1.\n\n<!-- slot: next -->',
);
await Deno.writeTextFile(
  circularFile2,
  '# File 2\n\nContent from file 2.\n\n<!-- slot: back -->'
);

const circularExample = {
  file: circularFile1,
  slots: {
    next: {
      file: circularFile2,
      slots: {
        back: { file: circularFile1 }, // This creates a circular dependency
      },
    },
  },
};

try {
  const result = await composeMarkdown(circularExample);
  console.log('✅ Circular dependency detected and handled:');
  console.log('Result contains error message:', result.markdown.includes('Circular dependency'));
  console.log('Errors:', result.errors?.map((e) => e.type));
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Example 2: Depth Limiting
console.log('\n=== Example 2: Depth Limiting ===');

// Create a deep nesting scenario
const createDeepNesting = (depth: number) => {
  if (depth === 0) {
    return { content: `🎯 Reached maximum depth!` };
  }

  return {
    content: `## Level ${depth}\n\n<!-- slot: next -->`,
    slots: {
      next: createDeepNesting(depth - 1),
    },
  };
};

const deepExample = createDeepNesting(5); // Create 5 levels deep

try {
  const result = await composeMarkdown(deepExample, { maxDepth: 3 });
  console.log('✅ Depth limiting in action:');
  console.log(
    'Result contains depth error:',
    result.markdown.includes('Maximum composition depth'),
  );
  console.log('Errors:', result.errors?.map((e) => e.type));
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Example 3: Parallel Processing Performance
console.log('\n=== Example 3: Parallel vs Sequential Processing ===');

// Create multiple files for parallel processing test
const fileCount = 5;
const parallelFiles: string[] = [];

for (let i = 1; i <= fileCount; i++) {
  const filename = `./examples/temp/parallel${i}.md`;
  await Deno.writeTextFile(
    filename,
    `# Section ${i}\n\nContent for section ${i}.\n\nThis simulates a larger file with more content to process.`,
  );
  parallelFiles.push(filename);
}

const parallelExample = {
  content: Array.from({ length: fileCount }, (_, i) => `<!-- slot: section${i + 1} -->`).join(
    '\n\n',
  ),
  slots: Object.fromEntries(
    parallelFiles.map((file, i) => [`section${i + 1}`, { file }]),
  ),
};

// Test sequential processing
console.log('Testing sequential processing...');
const sequentialStart = Date.now();
try {
  const _sequentialResult = await composeMarkdown(parallelExample, { parallel: false });
  const sequentialTime = Date.now() - sequentialStart;
  console.log(`✅ Sequential: ${sequentialTime}ms`);

  // Test parallel processing
  console.log('Testing parallel processing...');
  const parallelStart = Date.now();
  const _parallelResult = await composeMarkdown(parallelExample, { parallel: true });
  const parallelTime = Date.now() - parallelStart;
  console.log(`✅ Parallel: ${parallelTime}ms`);

  console.log(
    `📊 Performance: ${
      sequentialTime >= parallelTime
        ? 'Parallel was faster or equal'
        : 'Sequential was faster (files too small)'
    }`,
  );
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Example 4: Error Recovery Strategies
console.log('\n=== Example 4: Error Recovery Strategies ===');

const errorRecoveryExample = {
  content: `# Resilient Document

<!-- slot: good-content -->

<!-- slot: missing-file -->

<!-- slot: missing-slot -->

<!-- slot: function-error -->`,
  slots: {
    'good-content': { content: '✅ This content loads successfully.' },
    'missing-file': { file: './examples/temp/does-not-exist.md' },
    'function-error': () => {
      throw new Error('Simulated function error');
    },
    // Note: 'missing-slot' is intentionally not defined
  },
};

const errorStrategies = [
  {
    name: 'Strict (throw on errors)',
    options: { onFileError: 'throw' as const, onMissingSlot: 'error' as const, parallel: false },
  },
  {
    name: 'Graceful (warn and continue)',
    options: {
      onFileError: 'warn-empty' as const,
      onMissingSlot: 'ignore' as const,
      parallel: false,
    },
  },
  {
    name: 'Preserve (keep markers)',
    options: {
      onFileError: 'warn-empty' as const,
      onMissingSlot: 'keep' as const,
      parallel: false,
    },
  },
];

for (const strategy of errorStrategies) {
  console.log(`\nTesting strategy: ${strategy.name}`);
  console.log('Options:', strategy.options);
  try {
    const result = await composeMarkdown(errorRecoveryExample, strategy.options);
    console.log(`✅ Success with ${result.errors?.length || 0} errors collected`);
    console.log(`📄 Generated ${result.markdown.length} characters`);
  } catch (error) {
    console.log(`❌ Failed as expected: ${error.message}`);
  }
}

// Cleanup
console.log('\n' + '='.repeat(60));
console.log('🧹 Cleaning up example files...');
try {
  await Deno.remove('./examples/temp', { recursive: true });
  console.log('✅ Cleanup completed');
} catch (error) {
  console.log('⚠️  Cleanup failed:', error.message);
}

console.log('\n🎉 Advanced examples completed!');
console.log('\n📚 Key takeaways:');
console.log('- Circular dependencies are automatically detected and prevented');
console.log('- Depth limiting prevents runaway compositions');
console.log('- Parallel processing can improve performance with multiple files');
console.log('- Error recovery strategies provide flexibility for different use cases');
console.log('- Complex nested compositions are fully supported');

console.log('\n🔗 Next: Check out the API documentation in the README!');
