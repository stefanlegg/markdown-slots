/**
 * Core markdown composition API.
 *
 * This module provides the main public API for composing markdown documents with slot-based
 * content replacement. It handles content loading from multiple sources (strings, files, async functions),
 * recursive slot replacement, and circular dependency detection.
 *
 * @example
 * ```typescript
 * import { composeMarkdown } from '@stefanlegg/markdown-slots';
 *
 * // Simple composition with inline content
 * const result = await composeMarkdown({
 *   content: 'Hello <!-- slot: name -->!',
 *   slots: { name: 'World' }
 * });
 * console.log(result.content); // "Hello World!"
 *
 * // Composition from files
 * const result = await composeMarkdown({
 *   file: './template.md',
 *   slots: {
 *     header: { file: './header.md' },
 *     footer: { file: './footer.md' }
 *   }
 * });
 * ```
 *
 * @module compose
 */

import type { ComposeOptions, ComposeResult, MarkdownNode } from './types.ts';
import { CompositionEngine } from './composition-engine.ts';
import { DenoFileSystem } from './filesystem.ts';

/**
 * Main function to compose markdown with slots
 *
 * @param node - The markdown node to compose (can contain content, file path, or slots)
 * @param options - Composition options including error handling, caching, and performance settings
 * @returns Promise resolving to the composed markdown content and any errors
 */
export async function composeMarkdown(
  node: MarkdownNode,
  options: ComposeOptions = {},
): Promise<ComposeResult> {
  // Input validation
  if (!node) {
    throw new Error('MarkdownNode is required');
  }

  if (typeof node !== 'object') {
    throw new Error('MarkdownNode must be an object');
  }

  if (!('content' in node) && !('file' in node)) {
    throw new Error('MarkdownNode must have either content or file property');
  }

  if ('content' in node && typeof node.content !== 'string') {
    throw new Error('MarkdownNode content must be a string');
  }

  if ('file' in node && typeof node.file !== 'string') {
    throw new Error('MarkdownNode file must be a string');
  }

  // Validate options
  if (
    options.maxDepth !== undefined && (typeof options.maxDepth !== 'number' || options.maxDepth < 0)
  ) {
    throw new Error('maxDepth must be a non-negative number');
  }

  if (options.onMissingSlot && !['error', 'ignore', 'keep'].includes(options.onMissingSlot)) {
    throw new Error('onMissingSlot must be one of: error, ignore, keep');
  }

  if (options.onFileError && !['throw', 'warn-empty'].includes(options.onFileError)) {
    throw new Error('onFileError must be one of: throw, warn-empty');
  }

  if (options.resolveFrom && !['cwd', 'file'].includes(options.resolveFrom)) {
    throw new Error('resolveFrom must be one of: cwd, file');
  }

  if (options.parallel !== undefined && typeof options.parallel !== 'boolean') {
    throw new Error('parallel must be a boolean');
  }

  if (options.cache && !(options.cache instanceof Map)) {
    throw new Error('cache must be a Map instance');
  }

  // Create filesystem adapter and composition engine
  const fs = new DenoFileSystem();
  const engine = new CompositionEngine(fs);

  // Compose the markdown
  return await engine.compose(node, options);
}
