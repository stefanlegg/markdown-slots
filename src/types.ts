/**
 * Represents different sources that can fill a slot
 */
export type MarkdownSlotSource =
  | { file: string }
  | { content: string }
  | (() => string | Promise<string>)
  | MarkdownNode;

/**
 * Represents a markdown document with optional slots
 */
export type MarkdownNode =
  | { file: string; slots?: Record<string, MarkdownSlotSource> }
  | { content: string; slots?: Record<string, MarkdownSlotSource> };

/**
 * Configuration options for composition
 */
export interface ComposeOptions {
  /** Base path for resolving relative file paths */
  basePath?: string;
  /** How to resolve relative paths: from current working directory or from parent file */
  resolveFrom?: 'cwd' | 'file';
  /** Maximum recursion depth to prevent infinite loops */
  maxDepth?: number;
  /** How to handle missing slots */
  onMissingSlot?: 'error' | 'ignore' | 'keep';
  /** How to handle file read errors */
  onFileError?: 'throw' | 'warn-empty';
  /** Optional cache for file contents */
  cache?: Map<string, string>;
  /** Whether to read files in parallel */
  parallel?: boolean;
}

/**
 * Error information for composition issues
 */
export interface ComposeError {
  /** Type of error that occurred */
  type: 'missing-slot' | 'file-error' | 'max-depth' | 'circular-dependency' | 'function-error';
  /** Human-readable error message */
  message: string;
  /** Optional path where the error occurred */
  path?: string;
}

/**
 * Result of markdown composition
 */
export interface ComposeResult {
  /** The composed markdown content */
  markdown: string;
  /** Any errors that occurred during composition */
  errors?: ComposeError[];
}

/**
 * CLI options parsed from command line arguments
 */
export interface CliOptions {
  /** The template file to compose */
  template: string;
  /** Slot definitions from CLI arguments */
  slots: Record<string, string>;
  /** Path to JSON configuration file */
  json?: string;
  /** Output file path (if not provided, outputs to stdout) */
  output?: string;
  /** Enable verbose output */
  verbose?: boolean;
  /** Show help information */
  help?: boolean;
}

/**
 * JSON configuration structure
 */
export interface JsonConfig {
  /** Slot definitions */
  slots?: Record<string, MarkdownSlotSource>;
  /** Composition options */
  options?: Partial<ComposeOptions>;
}
