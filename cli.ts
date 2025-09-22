#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * CLI entry point for Markdown Slots.
 *
 * This module serves as the executable entry point for the markdown-slots command line tool.
 * It handles command line argument parsing and delegates to the CliInterface for processing.
 * Works in both Deno and Node.js environments with cross-platform compatibility.
 *
 * @example
 * ```bash
 * # Compose markdown with slots from command line
 * deno run -A cli.ts input.md --slot header=header.md --output output.md
 *
 * # Use configuration file
 * deno run -A cli.ts --config compose.json
 * ```
 *
 * @module cli
 */

import process from 'node:process';
import { CliInterface } from './src/cli/cli-interface.ts';

/**
 * Main CLI entry point that orchestrates the command line interface.
 * Handles command line arguments and delegates to CliInterface.
 * @returns Promise that resolves when CLI execution completes
 */
async function main(): Promise<void> {
  const cli = new CliInterface();

  // Get command line arguments - works in both Deno and Node.js after compilation
  const args = typeof Deno !== 'undefined' ? Deno.args : process.argv.slice(2);

  await cli.run(args);
}

/**
 * Cross-platform exit function that works in both Deno and Node.js environments.
 * @param code The exit code to use (0 for success, non-zero for errors)
 * @returns Never returns as it terminates the process
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
