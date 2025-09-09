/**
 * @fileoverview Markdown Slots - A TypeScript library for composing markdown content with slot-based templating
 *
 * This library provides a powerful and flexible way to compose markdown documents
 * from multiple sources using a slot/outlet pattern. It supports:
 *
 * - Content strings, file paths, and async functions as slot sources
 * - Nested compositions with circular dependency detection
 * - Configurable error handling strategies
 * - Performance optimizations like caching and parallel processing
 *
 * @example Basic Usage
 * ```typescript
 * import { composeMarkdown } from './mod.ts';
 *
 * const result = await composeMarkdown({
 *   content: 'Hello <!-- outlet: name -->!',
 *   slots: {
 *     name: { content: 'World' }
 *   }
 * });
 *
 * console.log(result.markdown); // "Hello World!"
 * ```
 *
 * @example File-based Composition
 * ```typescript
 * const result = await composeMarkdown({
 *   file: './template.md',
 *   slots: {
 *     header: { file: './header.md' },
 *     content: { content: 'Dynamic content' },
 *     footer: () => Promise.resolve('Generated footer')
 *   }
 * });
 * ```
 *
 * @author Markdown Slots Team
 * @version 1.0.0
 * @license MIT
 */

// Main module exports
export * from './types.ts';
export * from './compose.ts';
export * from './parser.ts';
export * from './filesystem.ts';
export * from './dependency-tracker.ts';
export * from './composition-engine.ts';

// CLI exports
export * from './cli/argument-parser.ts';
export * from './cli/configuration-loader.ts';
export * from './cli/output-handler.ts';
export * from './cli/cli-interface.ts';
