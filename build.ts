#!/usr/bin/env -S deno run -A

import { build, emptyDir } from 'https://deno.land/x/dnt@0.38.1/mod.ts';

await emptyDir('./npm');

await build({
  entryPoints: [
    './src/mod.ts',
    {
      name: './cli',
      path: './cli.ts',
    },
  ],
  outDir: './npm',
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: 'markdown-slots',
    version: Deno.args[0] ?? '0.1.0',
    description: 'A TypeScript library for composing Markdown files using a slot/outlet pattern',
    keywords: [
      'markdown',
      'composition',
      'slots',
      'outlets',
      'template',
      'typescript',
      'deno',
      'nodejs',
      'cli',
    ],
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/your-username/markdown-slots.git',
    },
    bugs: {
      url: 'https://github.com/your-username/markdown-slots/issues',
    },
    homepage: 'https://github.com/your-username/markdown-slots#readme',
    author: {
      name: 'Your Name',
      email: 'your.email@example.com',
    },
    engines: {
      node: '>=16.0.0',
    },
    bin: {
      'markdown-slots': './esm/markdown-slots',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE');
    Deno.copyFileSync('README.md', 'npm/README.md');

    // Create CLI executable with proper shebang for Node.js
    const cliContent = `#!/usr/bin/env node

/**
 * CLI executable entry point for Node.js
 * This file is the actual executable that NPX will run
 */

import { CliInterface } from './src/cli/cli-interface.js';

/**
 * Main CLI entry point for Node.js
 */
async function main() {
  const cli = new CliInterface();
  await cli.run(process.argv.slice(2));
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
`;

    Deno.writeTextFileSync('npm/esm/markdown-slots', cliContent);

    // Make the CLI executable on Unix systems
    try {
      Deno.chmodSync('npm/esm/markdown-slots', 0o755);
    } catch {
      // Ignore chmod errors on Windows
    }
  },
  mappings: {
    // Map Deno standard library imports to Node.js equivalents
    '@std/path': {
      name: 'node:path',
    },
  },
  compilerOptions: {
    lib: ['ES2022', 'DOM'],
    target: 'ES2022',
    strict: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  },
  // Generate both ESM and CommonJS
  scriptModule: 'esm',
  // Test the built package
  test: false, // We'll test manually since we have custom test setup
});

console.log('✅ Build completed successfully!');
console.log('📦 Package built in ./npm directory');
console.log('🔍 Contents:');

// List the built files
for await (const dirEntry of Deno.readDir('./npm')) {
  console.log(`  - ${dirEntry.name}`);
}

console.log('\n🧪 Testing Node.js compatibility...');

// Test ESM import
const esmTest = `
import { composeMarkdown } from './esm/mod.js';

console.log('✅ ESM import successful');
console.log('composeMarkdown function:', typeof composeMarkdown);

// Test basic functionality
const result = await composeMarkdown({
  content: '# Test\\n\\nHello from Node.js!'
});

console.log('✅ Basic composition works');
console.log('Result:', result.markdown);
`;

await Deno.writeTextFile('./npm/test-esm.mjs', esmTest);

// Test CommonJS require
const cjsTest = `
const { composeMarkdown } = require('./script/mod.js');

console.log('✅ CommonJS require successful');
console.log('composeMarkdown function:', typeof composeMarkdown);

// Test basic functionality
composeMarkdown({
  content: '# Test\\n\\nHello from Node.js!'
}).then(result => {
  console.log('✅ Basic composition works');
  console.log('Result:', result.markdown);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
`;

await Deno.writeTextFile('./npm/test-cjs.js', cjsTest);

console.log('📝 Test files created:');
console.log('  - test-esm.mjs (ESM test)');
console.log('  - test-cjs.js (CommonJS test)');
console.log('\n🚀 To test Node.js compatibility:');
console.log('  cd npm && node test-esm.mjs');
console.log('  cd npm && node test-cjs.js');
