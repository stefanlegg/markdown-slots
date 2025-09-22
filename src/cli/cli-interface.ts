/**
 * Command line interface orchestration for markdown-slots.
 *
 * This module provides the main CLI interface that coordinates all CLI operations
 * including argument parsing, configuration loading, markdown composition, and output handling.
 * It serves as the primary entry point for the command-line tool.
 *
 * The CLI interface supports:
 * - Command-line argument parsing and validation
 * - JSON configuration file loading and merging
 * - Template and slot-based composition
 * - Multiple output formats (stdout, file)
 * - Comprehensive error handling and reporting
 * - Help and usage information
 *
 * @example
 * ```typescript
 * import { CliInterface } from './cli-interface.ts';
 *
 * const cli = new CliInterface();
 * await cli.run(Deno.args);
 * ```
 *
 * @module cli-interface
 */

import type { CliOptions, ComposeOptions, MarkdownNode } from '../types.ts';
import { ArgumentParser } from './argument-parser.ts';
import { ConfigurationLoader } from './configuration-loader.ts';
import { OutputHandler } from './output-handler.ts';
import { composeMarkdown } from '../compose.ts';

/**
 * Main CLI interface that orchestrates the entire CLI workflow.
 * Coordinates argument parsing, configuration loading, composition, and output.
 */
export class CliInterface {
  private argumentParser: ArgumentParser;
  private configurationLoader: ConfigurationLoader;
  private outputHandler: OutputHandler;

  constructor() {
    this.argumentParser = new ArgumentParser();
    this.configurationLoader = new ConfigurationLoader();
    this.outputHandler = new OutputHandler();
  }

  /**
   * Run the CLI with the provided arguments
   * @param args Command line arguments (typically from Deno.args)
   * @returns Promise that resolves when CLI execution is complete
   */
  async run(args: string[]): Promise<void> {
    try {
      // Parse command line arguments
      const options = this.parseArguments(args);

      // Handle help request
      if (options.help) {
        await this.showHelp();
        return;
      }

      // Load and merge configuration
      const markdownNode = await this.loadConfiguration(options);

      // Compose the markdown
      const result = await this.compose(markdownNode, options);

      // Handle output
      await this.handleOutput(result, options);
    } catch (error) {
      this.handleError(error, args);
      this.exit(1);
    }
  }

  /**
   * Parse command line arguments
   * @param args Raw command line arguments
   * @returns Parsed CLI options
   * @throws Error if arguments are invalid
   */
  private parseArguments(args: string[]): CliOptions {
    try {
      return this.argumentParser.parse(args);
    } catch (error) {
      // Re-throw with context for better error handling
      throw new Error(
        `Argument parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Load configuration from CLI options and JSON file
   * @param options Parsed CLI options
   * @returns MarkdownNode ready for composition
   * @throws Error if configuration loading fails
   */
  private async loadConfiguration(options: CliOptions): Promise<MarkdownNode> {
    try {
      return await this.configurationLoader.load(options);
    } catch (error) {
      // Re-throw with context for better error handling
      throw new Error(
        `Configuration loading failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Compose the markdown using the loaded configuration
   * @param markdownNode The markdown node to compose
   * @param options CLI options for composition settings
   * @returns Composition result
   * @throws Error if composition fails
   */
  private async compose(
    markdownNode: MarkdownNode,
    _options: CliOptions,
  ): Promise<import('../types.ts').ComposeResult> {
    try {
      // Build compose options from CLI options
      const composeOptions: ComposeOptions = {
        // Use file-based resolution by default for CLI to make relative paths work intuitively
        resolveFrom: 'file',
        // Use warn-empty for file errors in CLI to be more forgiving
        onFileError: 'warn-empty',
        // Keep missing slots by default in CLI to show what's missing
        onMissingSlot: 'keep',
        // Enable parallel processing for better performance
        parallel: true,
      };

      return await composeMarkdown(markdownNode, composeOptions);
    } catch (error) {
      // Re-throw with context for better error handling
      throw new Error(
        `Composition failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle the output of the composition result
   * @param result The composition result
   * @param options CLI options
   * @throws Error if output handling fails
   */
  private async handleOutput(
    result: import('../types.ts').ComposeResult,
    options: CliOptions,
  ): Promise<void> {
    try {
      await this.outputHandler.handle(result, options);
    } catch (error) {
      // Re-throw with context for better error handling
      throw new Error(
        `Output handling failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Handle errors that occur during CLI execution
   * @param error The error that occurred
   * @param args Original command line arguments for context
   */
  private handleError(error: unknown, args: string[]): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const verbose = args.includes('--verbose') || args.includes('-v');

    // Determine error type and format appropriately
    if (this.isValidationError(errorObj)) {
      this.outputHandler.formatValidationError(errorObj);
    } else {
      this.outputHandler.formatCliError(errorObj, verbose);
    }
  }

  /**
   * Check if an error is a validation error that should get special formatting
   * @param error The error to check
   * @returns True if this is a validation error
   */
  private isValidationError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('template file is required') ||
      message.includes('not found') ||
      message.includes('no such file') ||
      message.includes('invalid json') ||
      message.includes('unknown flag') ||
      message.includes('argument parsing failed');
  }

  /**
   * Display help information
   */
  private async showHelp(): Promise<void> {
    const helpText = await this.argumentParser.getHelpText();
    console.log(helpText);
  }

  /**
   * Exit function that works in both Deno and Node.js environments
   * @param code Exit code
   */
  private exit(code: number): never {
    if (typeof Deno !== 'undefined') {
      Deno.exit(code);
    } else {
      // For Node.js environment (when compiled)
      (globalThis as { process?: { exit: (code: number) => void } }).process?.exit(code);
    }
    // This should never be reached, but TypeScript needs it
    throw new Error(`Process exit with code ${code}`);
  }
}
