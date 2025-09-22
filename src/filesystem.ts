/**
 * File system abstraction layer for cross-platform compatibility.
 *
 * This module provides a file system adapter interface and Deno implementation for all
 * file operations required by the markdown composition engine. The abstraction allows
 * for easy testing and potential support for other runtime environments.
 *
 * Features:
 * - Abstract FileSystemAdapter interface for testability
 * - Deno implementation with proper error handling
 * - Path resolution with support for relative and absolute paths
 * - File existence checking
 * - Text file reading with encoding support
 *
 * @example
 * ```typescript
 * import { DenoFileSystem } from './filesystem.ts';
 *
 * const fs = new DenoFileSystem();
 * const content = await fs.readFile('./template.md');
 * const exists = await fs.exists('./template.md');
 * const resolved = fs.resolvePath('../other.md', './current/file.md', 'file');
 * ```
 *
 * @module filesystem
 */

import { dirname, isAbsolute, join, resolve } from '@std/path';

/**
 * Abstract interface for file system operations
 */
export interface FileSystemAdapter {
  /**
   * Read a file's content as text
   */
  readFile(path: string): Promise<string>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Resolve a path relative to a base path or current working directory
   */
  resolvePath(path: string, basePath?: string, resolveFrom?: 'cwd' | 'file'): string;
}

/**
 * Deno implementation of the FileSystemAdapter.
 * Provides file system operations using Deno's built-in APIs.
 */
export class DenoFileSystem implements FileSystemAdapter {
  /**
   * Read a file's content as text using Deno.readTextFile.
   * @param path The file path to read
   * @returns Promise resolving to the file content as a string
   * @throws Error if file not found, permission denied, or read fails
   */
  async readFile(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`File not found: ${path}`);
      }
      if (error instanceof Deno.errors.PermissionDenied) {
        throw new Error(`Permission denied reading file: ${path}`);
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file ${path}: ${message}`);
    }
  }

  /**
   * Check if a file exists using Deno.stat.
   * @param path The file path to check
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async exists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isFile;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      // For permission errors or other issues, assume file doesn't exist
      return false;
    }
  }

  /**
   * Resolve a path with support for both 'cwd' and 'file' resolution modes.
   * @param path The path to resolve (can be relative or absolute)
   * @param basePath Optional base path for relative resolution
   * @param resolveFrom Resolution mode - 'cwd' for current directory, 'file' for relative to basePath
   * @returns The resolved absolute path
   */
  resolvePath(path: string, basePath?: string, resolveFrom: 'cwd' | 'file' = 'cwd'): string {
    // If path is already absolute, return as-is
    if (isAbsolute(path)) {
      return path;
    }

    if (resolveFrom === 'file' && basePath) {
      // Resolve relative to the parent directory of basePath
      const parentDir = dirname(basePath);
      return resolve(parentDir, path);
    } else {
      // Resolve relative to current working directory
      return resolve(path);
    }
  }

  /**
   * Get the current working directory.
   * @returns The absolute path to the current working directory
   */
  getCwd(): string {
    return Deno.cwd();
  }

  /**
   * Join path segments into a single path.
   * @param segments Path segments to join
   * @returns The joined path
   */
  joinPath(...segments: string[]): string {
    return join(...segments as [string, ...string[]]);
  }
}
