#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * CLI Example for Markdown Slots
 *
 * This example demonstrates how to create a simple CLI tool
 * for composing markdown files using markdown-slots.
 *
 * Usage:
 *   deno run --allow-read --allow-write examples/cli-example.ts input.md output.md
 */

import { composeMarkdown } from '../src/mod.ts';
import { parse } from 'https://deno.land/std@0.208.0/flags/mod.ts';

// Parse command line arguments
const args = parse(Deno.args, {
  boolean: ['help', 'parallel', 'verbose'],
  string: ['max-depth', 'on-missing-slot', 'on-file-error'],
  alias: {
    h: 'help',
    p: 'parallel',
    v: 'verbose',
    d: 'max-depth',
  },
  default: {
    'max-depth': '10',
    'on-missing-slot': 'keep',
    'on-file-error': 'warn-empty',
  },
});

// Show help
if (args.help || args._.length < 1) {
  console.log(`
🔧 Markdown Slots CLI

Usage:
  deno run --allow-read --allow-write cli-example.ts [options] <input> [output]

Arguments:
  input     Input markdown file or JSON config file
  output    Output file (optional, defaults to stdout)

Options:
  -h, --help                 Show this help message
  -p, --parallel             Enable parallel processing
  -v, --verbose              Verbose output
  -d, --max-depth <number>   Maximum composition depth (default: 10)
  --on-missing-slot <mode>   How to handle missing slots: error|ignore|keep (default: keep)
  --on-file-error <mode>     How to handle file errors: throw|warn-empty (default: warn-empty)

Examples:
  # Compose a simple markdown file
  deno run --allow-read --allow-write cli-example.ts README.template.md README.md
  
  # Use a JSON configuration file
  deno run --allow-read --allow-write cli-example.ts config.json
  
  # Output to stdout with verbose logging
  deno run --allow-read --allow-write cli-example.ts --verbose input.md
  
  # Enable parallel processing with custom error handling
  deno run --allow-read --allow-write cli-example.ts --parallel --on-missing-slot ignore input.md
`);
  Deno.exit(0);
}

const inputFile = args._[0] as string;
const outputFile = args._[1] as string;

if (args.verbose) {
  console.log('🚀 Markdown Slots CLI');
  console.log('Input:', inputFile);
  console.log('Output:', outputFile || 'stdout');
  console.log('Options:', {
    parallel: args.parallel,
    maxDepth: args['max-depth'],
    onMissingSlot: args['on-missing-slot'],
    onFileError: args['on-file-error'],
  });
  console.log('');
}

try {
  let node;

  // Determine if input is JSON config or markdown file
  if (inputFile.endsWith('.json')) {
    if (args.verbose) console.log('📄 Loading JSON configuration...');
    const configText = await Deno.readTextFile(inputFile);
    node = JSON.parse(configText);
  } else {
    if (args.verbose) console.log('📄 Loading markdown file...');
    node = { file: inputFile };
  }

  // Prepare options
  const options = {
    maxDepth: parseInt(args['max-depth']),
    onMissingSlot: args['on-missing-slot'] as 'error' | 'ignore' | 'keep',
    onFileError: args['on-file-error'] as 'throw' | 'warn-empty',
    parallel: args.parallel,
    cache: new Map<string, string>(),
  };

  if (args.verbose) console.log('⚙️  Composing markdown...');

  const startTime = Date.now();
  const result = await composeMarkdown(node, options);
  const duration = Date.now() - startTime;

  if (args.verbose) {
    console.log(`✅ Composition completed in ${duration}ms`);
    console.log(`📊 Generated ${result.markdown.length} characters`);

    if (result.errors && result.errors.length > 0) {
      console.log(`⚠️  ${result.errors.length} errors encountered:`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
      });
    }

    console.log('');
  }

  // Output result
  if (outputFile) {
    await Deno.writeTextFile(outputFile, result.markdown);
    if (args.verbose) {
      console.log(`💾 Output written to ${outputFile}`);
    } else {
      console.log(`✅ Composed markdown written to ${outputFile}`);
    }
  } else {
    console.log(result.markdown);
  }

  // Exit with error code if there were errors and strict mode
  if (result.errors && result.errors.length > 0 && args['on-file-error'] === 'throw') {
    Deno.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  if (args.verbose) {
    console.error('Stack trace:', error.stack);
  }
  Deno.exit(1);
}
