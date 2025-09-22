/**
 * Markdown content parser for slot and outlet detection.
 *
 * This module provides parsing utilities for detecting and replacing slot/outlet markers
 * in markdown content. It handles special cases like code blocks where markers should be
 * preserved and not replaced.
 *
 * The parser supports:
 * - Detection of outlet/slot markers in HTML comments
 * - Preservation of markers within code blocks
 * - Extraction of outlet names from content
 * - Replacement of outlets with resolved content
 *
 * @example
 * ```typescript
 * import { ContentParser } from './parser.ts';
 *
 * const parser = new ContentParser();
 * const content = 'Hello <!-- slot: name -->!';
 *
 * if (parser.hasOutlets(content)) {
 *   const names = parser.getOutletNames(content);
 *   const result = parser.replaceOutlets(content, { name: 'World' });
 *   console.log(result); // "Hello World!"
 * }
 * ```
 *
 * @module parser
 */

/**
 * Represents a code block in markdown content
 */
interface CodeBlock {
  start: number;
  end: number;
  type: 'fenced' | 'indented';
}

/**
 * Represents an outlet marker found in content
 */
export interface OutletMatch {
  /** The full match including the outlet syntax */
  match: string;
  /** The outlet name */
  name: string;
  /** Start position in the content */
  start: number;
  /** End position in the content */
  end: number;
}

/**
 * Parser for handling markdown content with outlet markers.
 * Provides methods for detecting, extracting, and replacing outlet markers in markdown.
 */
export class ContentParser {
  /** Regex pattern for matching outlet/slot markers */
  private static readonly OUTLET_PATTERN = /<!--\s*(outlet|slot):\s*([a-zA-Z0-9_-]+)\s*-->/g;

  /**
   * Split content into segments, identifying code blocks to preserve them.
   * @param content The markdown content to analyze
   * @returns Array of code block positions in the content
   */
  splitByCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    // Find fenced code blocks
    const fencedPattern = /^(```|~~~).*$/gm;
    let match: RegExpExecArray | null;
    let inFencedBlock = false;
    let fenceStart = -1;
    let fenceType = '';

    fencedPattern.lastIndex = 0;
    while ((match = fencedPattern.exec(content)) !== null) {
      const fence = match[1];

      if (!inFencedBlock) {
        // Start of fenced block
        inFencedBlock = true;
        fenceStart = match.index;
        fenceType = fence;
      } else if (fence === fenceType) {
        // End of fenced block
        codeBlocks.push({
          start: fenceStart,
          end: match.index + match[0].length,
          type: 'fenced',
        });
        inFencedBlock = false;
        fenceStart = -1;
        fenceType = '';
      }
    }

    // Handle unclosed fenced block
    if (inFencedBlock && fenceStart !== -1) {
      codeBlocks.push({
        start: fenceStart,
        end: content.length,
        type: 'fenced',
      });
    }

    // Find indented code blocks (simplified approach)
    const lines = content.split('\n');
    let lineStart = 0;
    let indentedStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isIndented = line.startsWith('    ') || line.startsWith('\t');
      const isEmpty = line.trim() === '';

      // Check if this line is inside a fenced block
      const isInFenced = codeBlocks.some((block) =>
        lineStart >= block.start && lineStart <= block.end
      );

      if (!isInFenced && isIndented && !isEmpty) {
        if (indentedStart === -1) {
          indentedStart = lineStart;
        }
      } else if (!isInFenced && indentedStart !== -1 && !isEmpty && !isIndented) {
        // End of indented block
        codeBlocks.push({
          start: indentedStart,
          end: lineStart,
          type: 'indented',
        });
        indentedStart = -1;
      }

      lineStart += line.length + 1; // +1 for newline
    }

    // Handle indented block at end of content
    if (indentedStart !== -1) {
      codeBlocks.push({
        start: indentedStart,
        end: content.length,
        type: 'indented',
      });
    }

    return codeBlocks.sort((a, b) => a.start - b.start);
  }

  /**
   * Find all outlet markers in content, excluding those inside code blocks.
   * @param content The markdown content to search
   * @returns Array of outlet matches found in the content
   */
  findOutlets(content: string): OutletMatch[] {
    const codeBlocks = this.splitByCodeBlocks(content);
    const outlets: OutletMatch[] = [];
    let match: RegExpExecArray | null;

    // Reset regex state
    ContentParser.OUTLET_PATTERN.lastIndex = 0;

    while ((match = ContentParser.OUTLET_PATTERN.exec(content)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check if this outlet is inside a code block
      const isInCodeBlock = codeBlocks.some((block) => start >= block.start && end <= block.end);

      if (!isInCodeBlock) {
        outlets.push({
          match: match[0],
          name: match[2],
          start,
          end,
        });
      }
    }

    return outlets;
  }

  /**
   * Replace outlet markers with provided content, preserving code blocks.
   * @param content The markdown content containing outlet markers
   * @param replacements Map of outlet names to replacement content
   * @returns Content with all specified outlets replaced
   */
  replaceOutlets(content: string, replacements: Record<string, string>): string {
    const outlets = this.findOutlets(content);
    let result = content;

    // Process outlets in reverse order to maintain correct positions
    for (let i = outlets.length - 1; i >= 0; i--) {
      const outlet = outlets[i];
      const replacement = replacements[outlet.name];

      if (replacement !== undefined) {
        const before = result.substring(0, outlet.start);
        const after = result.substring(outlet.end);
        result = before + replacement + after;
      }
    }

    return result;
  }

  /**
   * Get all outlet names found in content.
   * @param content The markdown content to search
   * @returns Array of unique outlet names found in the content
   */
  getOutletNames(content: string): string[] {
    const outlets = this.findOutlets(content);
    return outlets.map((outlet) => outlet.name);
  }

  /**
   * Check if content contains any outlet markers.
   * @param content The markdown content to check
   * @returns True if content contains at least one outlet marker
   */
  hasOutlets(content: string): boolean {
    return this.findOutlets(content).length > 0;
  }
}
