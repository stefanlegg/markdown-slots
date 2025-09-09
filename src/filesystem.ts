/**
 * File system adapter interface and Deno implementation
 */

import { dirname, isAbsolute, join, resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

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
 * Deno implementation of the FileSystemAdapter
 */
export class DenoFileSystem implements FileSystemAdapter {
  /**
   * Read a file's content as text using Deno.readTextFile
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
   * Check if a file exists using Deno.stat
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
   * Resolve a path with support for both 'cwd' and 'file' resolution modes
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
   * Get the current working directory
   */
  getCwd(): string {
    return Deno.cwd();
  }

  /**
   * Join path segments
   */
  joinPath(...segments: string[]): string {
    return join(...segments);
  }
}
