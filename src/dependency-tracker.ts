/**
 * Circular dependency detection and depth limiting for markdown composition
 */

/**
 * Tracks file dependencies to detect circular references and enforce depth limits
 */
export class CircularDependencyTracker {
  private readonly pathStack: string[] = [];
  private readonly maxDepth: number;
  private readonly visitedPaths = new Set<string>();

  constructor(maxDepth: number = 10) {
    this.maxDepth = maxDepth;
  }

  /**
   * Check if adding a path would create a circular dependency or exceed depth limit
   * @param path The file path to check
   * @returns true if the path can be safely added, false if it would create issues
   */
  canAdd(path: string): boolean {
    // Check depth limit
    if (this.pathStack.length >= this.maxDepth) {
      return false;
    }

    // Check for circular dependency
    return !this.pathStack.includes(path);
  }

  /**
   * Add a path to the dependency stack after checking for issues
   * @param path The file path to add
   * @throws Error if adding would create circular dependency or exceed depth
   */
  checkAndAdd(path: string): void {
    // Check depth limit
    if (this.pathStack.length >= this.maxDepth) {
      throw new Error(
        `Maximum composition depth of ${this.maxDepth} exceeded. Current stack: ${
          this.pathStack.join(' -> ')
        } -> ${path}`,
      );
    }

    // Check for circular dependency
    if (this.pathStack.includes(path)) {
      const circularPath = this.pathStack.slice(this.pathStack.indexOf(path)).join(' -> ');
      throw new Error(
        `Circular dependency detected: ${circularPath} -> ${path}`,
      );
    }

    // Add to stack and visited set
    this.pathStack.push(path);
    this.visitedPaths.add(path);
  }

  /**
   * Remove the most recently added path from the stack
   * @returns The removed path, or undefined if stack was empty
   */
  pop(): string | undefined {
    return this.pathStack.pop();
  }

  /**
   * Get the current dependency stack
   */
  getStack(): readonly string[] {
    return [...this.pathStack];
  }

  /**
   * Get the current depth (number of files in the stack)
   */
  getCurrentDepth(): number {
    return this.pathStack.length;
  }

  /**
   * Get the maximum allowed depth
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }

  /**
   * Check if a path has been visited during this composition
   */
  hasVisited(path: string): boolean {
    return this.visitedPaths.has(path);
  }

  /**
   * Get all paths that have been visited
   */
  getVisitedPaths(): readonly string[] {
    return [...this.visitedPaths];
  }

  /**
   * Clear the tracker state (useful for reusing the same tracker)
   */
  clear(): void {
    this.pathStack.length = 0;
    this.visitedPaths.clear();
  }

  /**
   * Create a snapshot of the current state for debugging
   */
  getSnapshot(): {
    stack: string[];
    depth: number;
    maxDepth: number;
    visited: string[];
  } {
    return {
      stack: [...this.pathStack],
      depth: this.pathStack.length,
      maxDepth: this.maxDepth,
      visited: [...this.visitedPaths],
    };
  }

  /**
   * Check if we're at the maximum depth
   */
  isAtMaxDepth(): boolean {
    return this.pathStack.length >= this.maxDepth;
  }

  /**
   * Get the remaining depth before hitting the limit
   */
  getRemainingDepth(): number {
    return Math.max(0, this.maxDepth - this.pathStack.length);
  }
}
