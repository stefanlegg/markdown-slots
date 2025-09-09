#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * CLI entry point for Markdown Slots
 * This file serves as the executable entry point for the CLI tool
 * Works in both Deno and Node.js environments
 */

import process from 'node:process';
import { CliInterface } from './src/cli/cli-interface.ts';

/**
 * Main CLI entry point
 * Handles command line arguments and delegates to CliInterface
 */
async function main(): Promise<void> {
  const cli = new CliInterface();

  // Get command line arguments - works in both Deno and Node.js after compilation
  const args = typeof Deno !== 'undefined' ? Deno.args : process.argv.slice(2);

  await cli.run(args);
}

/**
 * Exit function that works in both environments
 */
function exit(code: number): never {
  if (typeof Deno !== 'undefined') {
    Deno.exit(code);
  } else {
    process.exit(code);
  }
}

// Run the CLI if this file is executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    exit(1);
  });
}
