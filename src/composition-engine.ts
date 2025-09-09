/**
 * Core composition engine for resolving slots and composing markdown content
 */

import type { ComposeOptions, ComposeResult, MarkdownNode, MarkdownSlotSource } from './types.ts';
import { ContentParser } from './parser.ts';
import type { FileSystemAdapter } from './filesystem.ts';
import { CircularDependencyTracker } from './dependency-tracker.ts';

/**
 * Core engine for composing markdown content with slot resolution
 */
export class CompositionEngine {
  private readonly parser: ContentParser;
  private readonly fs: FileSystemAdapter;

  constructor(fs: FileSystemAdapter) {
    this.parser = new ContentParser();
    this.fs = fs;
  }

  /**
   * Main compose method that orchestrates the entire composition process
   */
  async compose(node: MarkdownNode, options: ComposeOptions = {}): Promise<ComposeResult> {
    const tracker = new CircularDependencyTracker(options.maxDepth ?? 10);
    const errors: ComposeResult['errors'] = [];

    try {
      const markdown = await this.composeNode(node, options, tracker, errors);
      return {
        markdown,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      // If error handling is set to throw, re-throw the error
      if (options.onFileError === 'throw' || options.onMissingSlot === 'error') {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        type: 'file-error',
        message,
      });
      return {
        markdown: '',
        errors,
      };
    }
  }

  /**
   * Compose a single markdown node, resolving all its slots
   */
  private async composeNode(
    node: MarkdownNode,
    options: ComposeOptions,
    tracker: CircularDependencyTracker,
    errors: NonNullable<ComposeResult['errors']>,
    currentPath?: string,
  ): Promise<string> {
    // Get the base content
    let content: string;
    let nodePath: string | undefined;

    if ('file' in node) {
      nodePath = this.fs.resolvePath(node.file, currentPath, options.resolveFrom);

      // Check for circular dependencies and depth limits
      try {
        tracker.checkAndAdd(nodePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Circular dependency')) {
          errors.push({
            type: 'circular-dependency',
            message,
            path: nodePath,
          });
          return `<!-- Error: ${message} -->`;
        } else if (message.includes('Maximum')) {
          errors.push({
            type: 'max-depth',
            message,
            path: nodePath,
          });
          return `<!-- Error: ${message} -->`;
        } else {
          throw error;
        }
      }

      try {
        // Check if file exists
        if (!(await this.fs.exists(nodePath))) {
          const error = `File not found: ${nodePath}`;
          errors.push({
            type: 'file-error',
            message: error,
            path: nodePath,
          });

          if (options.onFileError === 'throw') {
            throw new Error(error);
          }

          tracker.pop();
          return options.onFileError === 'warn-empty' ? '' : `<!-- Error: ${error} -->`;
        }

        // Read from cache or file system
        if (options.cache?.has(nodePath)) {
          content = options.cache.get(nodePath)!;
        } else {
          content = await this.fs.readFile(nodePath);
          options.cache?.set(nodePath, content);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          type: 'file-error',
          message,
          path: nodePath,
        });

        if (options.onFileError === 'throw') {
          throw error;
        }

        tracker.pop();
        return options.onFileError === 'warn-empty' ? '' : `<!-- Error: ${message} -->`;
      }
    } else {
      content = node.content;
    }

    // Process slots if they exist, or if content has outlets that need to be handled
    if (this.parser.hasOutlets(content)) {
      const slots = node.slots || {};
      content = await this.resolveSlots(content, slots, options, tracker, errors, nodePath);
    }

    // Pop the current path from tracker if we added it
    if (nodePath) {
      tracker.pop();
    }

    return content;
  }

  /**
   * Resolve all slots in content with their corresponding sources
   */
  private async resolveSlots(
    content: string,
    slots: Record<string, MarkdownSlotSource>,
    options: ComposeOptions,
    tracker: CircularDependencyTracker,
    errors: NonNullable<ComposeResult['errors']>,
    currentPath?: string,
  ): Promise<string> {
    const outletNames = this.parser.getOutletNames(content);
    const replacements: Record<string, string> = {};

    // Collect all slot resolution tasks
    const resolutionTasks = outletNames.map((outletName) => async () => {
      try {
        const slotSource = slots[outletName];

        if (!slotSource) {
          const error = `Missing slot: ${outletName}`;
          errors.push({
            type: 'missing-slot',
            message: error,
            path: currentPath,
          });

          if (options.onMissingSlot === 'error') {
            throw new Error(error);
          } else if (options.onMissingSlot === 'ignore') {
            replacements[outletName] = '';
          }
          // For 'keep' mode, we don't add a replacement, leaving the outlet marker
          return;
        }

        const resolvedContent = await this.resolveSlotSource(
          slotSource,
          options,
          tracker,
          errors,
          currentPath,
        );
        replacements[outletName] = resolvedContent;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Determine error type based on message content or custom error type
        let errorType:
          | 'file-error'
          | 'circular-dependency'
          | 'max-depth'
          | 'missing-slot'
          | 'function-error' = 'file-error';

        // Check if this is a custom error with errorType property
        if (error instanceof Error && 'errorType' in error) {
          errorType = (error as Error & { errorType: typeof errorType }).errorType;
        } else if (message.includes('Circular dependency')) {
          errorType = 'circular-dependency';
        } else if (message.includes('Maximum')) {
          errorType = 'max-depth';
        } else if (message.includes('Missing slot')) {
          errorType = 'missing-slot';
        } else if (message.includes('Function execution failed')) {
          errorType = 'function-error';
        }

        errors.push({
          type: errorType,
          message,
          path: currentPath,
        });

        // Re-throw errors based on options
        if (
          (options.onFileError === 'throw' && errorType === 'file-error') ||
          (options.onMissingSlot === 'error' && errorType === 'missing-slot')
        ) {
          throw error;
        }

        replacements[outletName] = options.onFileError === 'warn-empty'
          ? ''
          : `<!-- Error: ${message} -->`;
      }
    });

    // Execute slot resolutions
    if (options.parallel) {
      await Promise.all(resolutionTasks.map((task) => task()));
    } else {
      for (const task of resolutionTasks) {
        await task();
      }
    }

    // Replace outlets with resolved content
    return this.parser.replaceOutlets(content, replacements);
  }

  /**
   * Resolve a single slot source to its string content
   */
  private async resolveSlotSource(
    source: MarkdownSlotSource,
    options: ComposeOptions,
    tracker: CircularDependencyTracker,
    errors: NonNullable<ComposeResult['errors']>,
    currentPath?: string,
  ): Promise<string> {
    // Handle function sources
    if (typeof source === 'function') {
      try {
        const result = await source();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorMessage = `Function execution failed: ${message}`;
        // Create a custom error that includes the type information
        const functionError = new Error(errorMessage) as Error & { errorType: string };
        functionError.errorType = 'function-error';
        throw functionError;
      }
    }

    // Handle MarkdownNode sources (both simple content/file and complex with slots)
    if (typeof source === 'object' && ('content' in source || 'file' in source)) {
      // Check if it's a simple content source without slots
      if ('content' in source && !('slots' in source)) {
        return source.content;
      }

      // Check if it's a simple file source without slots
      if ('file' in source && !('slots' in source)) {
        const filePath = this.fs.resolvePath(source.file, currentPath, options.resolveFrom);

        // Check for circular dependencies and depth limits
        try {
          tracker.checkAndAdd(filePath);
        } catch (error) {
          const _message = error instanceof Error ? error.message : String(error);
          throw error; // Re-throw to be handled by the calling code
        }

        try {
          // Read from cache first if available
          if (options.cache?.has(filePath)) {
            const content = options.cache.get(filePath)!;
            tracker.pop();
            return content;
          }

          // Check if file exists
          if (!(await this.fs.exists(filePath))) {
            const error = `File not found: ${filePath}`;
            if (options.onFileError === 'throw') {
              throw new Error(error);
            }
            tracker.pop();
            return options.onFileError === 'warn-empty' ? '' : `<!-- Error: ${error} -->`;
          }

          // Read from file system
          const content = await this.fs.readFile(filePath);
          options.cache?.set(filePath, content);

          tracker.pop();
          return content;
        } catch (error) {
          tracker.pop();
          throw error;
        }
      }

      // Handle complex MarkdownNode with slots
      return await this.composeNode(source as MarkdownNode, options, tracker, errors, currentPath);
    }

    throw new Error(`Invalid slot source type: ${typeof source}`);
  }
}
