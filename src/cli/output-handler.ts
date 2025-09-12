/**
 * Output handler for the Markdown Slots CLI
 * Manages output formatting and destination (stdout vs file)
 */

import { resolve } from '@std/path';
import type { CliOptions, ComposeError, ComposeResult } from '../types.ts';

/**
 * Handles CLI output formatting and destination management
 */
export class OutputHandler {
  /**
   * Handle the output of a composition result
   * @param result The composition result to output
   * @param options CLI options containing output preferences
   * @throws Error if file writing fails
   */
  async handle(result: ComposeResult, options: CliOptions): Promise<void> {
    // Handle errors first if they exist
    if (result.errors && result.errors.length > 0) {
      this.formatErrors(result.errors, options.verbose || false);
    }

    // Write the composed markdown
    if (options.output) {
      await this.writeToFile(result.markdown, options.output, options.verbose || false);
    } else {
      this.writeToStdout(result.markdown);
    }
  }

  /**
   * Format and display errors to stderr
   * @param errors Array of composition errors
   * @param verbose Whether to show verbose error information
   */
  private formatErrors(errors: ComposeError[], verbose: boolean): void {
    console.error('Composition completed with errors:');

    for (const error of errors) {
      if (verbose) {
        console.error(`  [${error.type}] ${error.message}`);
        if (error.path) {
          console.error(`    Path: ${error.path}`);
        }
      } else {
        console.error(`  ${error.message}`);
      }
    }

    console.error(''); // Add blank line for readability
  }

  /**
   * Write content to a file
   * @param content The content to write
   * @param outputPath The file path to write to
   * @param verbose Whether to show verbose output
   * @throws Error if file writing fails
   */
  private async writeToFile(content: string, outputPath: string, verbose: boolean): Promise<void> {
    try {
      const resolvedPath = resolve(outputPath);
      await Deno.writeTextFile(resolvedPath, content);

      if (verbose) {
        console.error(`Output written to: ${resolvedPath}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to write output file: ${message}`);
    }
  }

  /**
   * Write content to stdout
   * @param content The content to write
   */
  private writeToStdout(content: string): void {
    console.log(content);
  }

  /**
   * Format a general CLI error for display
   * @param error The error to format
   * @param verbose Whether to show verbose error information
   */
  formatCliError(error: Error, verbose: boolean): void {
    if (verbose) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace:\n${error.stack}`);
      }
    } else {
      console.error(`Error: ${error.message}`);
    }
  }

  /**
   * Format validation errors with helpful suggestions
   * @param error The validation error
   */
  formatValidationError(error: Error): void {
    console.error(`Error: ${error.message}`);

    // Provide helpful suggestions based on common error patterns
    const message = error.message.toLowerCase();

    if (message.includes('template file is required')) {
      console.error('\nUsage: deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose <template> [options]');
      console.error('   or: deno run -R -W jsr:@stefanlegg/markdown-slots/cli <template> [options]');
    } else if (message.includes('not found') || message.includes('no such file')) {
      console.error('\nTip: Check that the file path is correct and the file exists.');
    } else if (message.includes('invalid json')) {
      console.error('\nTip: Validate your JSON configuration file syntax.');
    } else if (message.includes('unknown flag')) {
      console.error('\nUse --help or -h to see available options.');
    }
  }
}
