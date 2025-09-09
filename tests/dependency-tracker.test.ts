import { assertEquals, assertThrows } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { CircularDependencyTracker } from '../src/dependency-tracker.ts';

Deno.test('CircularDependencyTracker', async (t) => {
  await t.step('should initialize with default max depth', () => {
    const tracker = new CircularDependencyTracker();
    assertEquals(tracker.getMaxDepth(), 10);
    assertEquals(tracker.getCurrentDepth(), 0);
    assertEquals(tracker.getStack().length, 0);
  });

  await t.step('should initialize with custom max depth', () => {
    const tracker = new CircularDependencyTracker(5);
    assertEquals(tracker.getMaxDepth(), 5);
    assertEquals(tracker.getCurrentDepth(), 0);
  });

  await t.step('should add paths successfully when within limits', () => {
    const tracker = new CircularDependencyTracker(3);

    assertEquals(tracker.canAdd('file1.md'), true);
    tracker.checkAndAdd('file1.md');
    assertEquals(tracker.getCurrentDepth(), 1);
    assertEquals(tracker.getStack(), ['file1.md']);

    assertEquals(tracker.canAdd('file2.md'), true);
    tracker.checkAndAdd('file2.md');
    assertEquals(tracker.getCurrentDepth(), 2);
    assertEquals(tracker.getStack(), ['file1.md', 'file2.md']);
  });

  await t.step('should detect circular dependencies', () => {
    const tracker = new CircularDependencyTracker();

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');
    tracker.checkAndAdd('file3.md');

    // Try to add file1.md again - should detect circular dependency
    assertEquals(tracker.canAdd('file1.md'), false);

    assertThrows(
      () => tracker.checkAndAdd('file1.md'),
      Error,
      'Circular dependency detected: file1.md -> file2.md -> file3.md -> file1.md',
    );
  });

  await t.step('should detect circular dependencies at any point in stack', () => {
    const tracker = new CircularDependencyTracker();

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');
    tracker.checkAndAdd('file3.md');

    // Try to add file2.md again - should detect circular dependency
    assertEquals(tracker.canAdd('file2.md'), false);

    assertThrows(
      () => tracker.checkAndAdd('file2.md'),
      Error,
      'Circular dependency detected: file2.md -> file3.md -> file2.md',
    );
  });

  await t.step('should enforce depth limits', () => {
    const tracker = new CircularDependencyTracker(2);

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');

    // Should be at max depth now
    assertEquals(tracker.isAtMaxDepth(), true);
    assertEquals(tracker.getRemainingDepth(), 0);
    assertEquals(tracker.canAdd('file3.md'), false);

    assertThrows(
      () => tracker.checkAndAdd('file3.md'),
      Error,
      'Maximum composition depth of 2 exceeded',
    );
  });

  await t.step('should pop paths correctly', () => {
    const tracker = new CircularDependencyTracker();

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');
    tracker.checkAndAdd('file3.md');

    assertEquals(tracker.getCurrentDepth(), 3);

    const popped = tracker.pop();
    assertEquals(popped, 'file3.md');
    assertEquals(tracker.getCurrentDepth(), 2);
    assertEquals(tracker.getStack(), ['file1.md', 'file2.md']);

    // Should be able to add file3.md again after popping
    assertEquals(tracker.canAdd('file3.md'), true);
  });

  await t.step('should track visited paths', () => {
    const tracker = new CircularDependencyTracker();

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');

    assertEquals(tracker.hasVisited('file1.md'), true);
    assertEquals(tracker.hasVisited('file2.md'), true);
    assertEquals(tracker.hasVisited('file3.md'), false);

    const visited = tracker.getVisitedPaths();
    assertEquals(visited.includes('file1.md'), true);
    assertEquals(visited.includes('file2.md'), true);
    assertEquals(visited.length, 2);

    // Pop a file - should still be in visited
    tracker.pop();
    assertEquals(tracker.hasVisited('file2.md'), true);
  });

  await t.step('should clear state correctly', () => {
    const tracker = new CircularDependencyTracker();

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');

    assertEquals(tracker.getCurrentDepth(), 2);
    assertEquals(tracker.hasVisited('file1.md'), true);

    tracker.clear();

    assertEquals(tracker.getCurrentDepth(), 0);
    assertEquals(tracker.getStack().length, 0);
    assertEquals(tracker.hasVisited('file1.md'), false);
    assertEquals(tracker.getVisitedPaths().length, 0);
  });

  await t.step('should provide accurate snapshots', () => {
    const tracker = new CircularDependencyTracker(5);

    tracker.checkAndAdd('file1.md');
    tracker.checkAndAdd('file2.md');

    const snapshot = tracker.getSnapshot();

    assertEquals(snapshot.stack, ['file1.md', 'file2.md']);
    assertEquals(snapshot.depth, 2);
    assertEquals(snapshot.maxDepth, 5);
    assertEquals(snapshot.visited, ['file1.md', 'file2.md']);
  });

  await t.step('should calculate remaining depth correctly', () => {
    const tracker = new CircularDependencyTracker(3);

    assertEquals(tracker.getRemainingDepth(), 3);

    tracker.checkAndAdd('file1.md');
    assertEquals(tracker.getRemainingDepth(), 2);

    tracker.checkAndAdd('file2.md');
    assertEquals(tracker.getRemainingDepth(), 1);

    tracker.checkAndAdd('file3.md');
    assertEquals(tracker.getRemainingDepth(), 0);
  });

  await t.step('should handle empty stack operations', () => {
    const tracker = new CircularDependencyTracker();

    assertEquals(tracker.pop(), undefined);
    assertEquals(tracker.getCurrentDepth(), 0);
    assertEquals(tracker.getStack().length, 0);
  });

  await t.step('should handle complex circular dependency scenarios', () => {
    const tracker = new CircularDependencyTracker();

    // Build a longer chain
    tracker.checkAndAdd('a.md');
    tracker.checkAndAdd('b.md');
    tracker.checkAndAdd('c.md');
    tracker.checkAndAdd('d.md');

    // Try to create circular dependency back to 'b.md'
    assertThrows(
      () => tracker.checkAndAdd('b.md'),
      Error,
      'Circular dependency detected: b.md -> c.md -> d.md -> b.md',
    );

    // Pop some files and try again
    tracker.pop(); // Remove d.md
    tracker.pop(); // Remove c.md

    // Now we should be able to add c.md again (different path)
    assertEquals(tracker.canAdd('c.md'), true);
    tracker.checkAndAdd('c.md');

    // But still can't add b.md (would be circular)
    assertEquals(tracker.canAdd('b.md'), false);
  });

  await t.step('should handle edge case with depth limit of 1', () => {
    const tracker = new CircularDependencyTracker(1);

    tracker.checkAndAdd('file1.md');
    assertEquals(tracker.isAtMaxDepth(), true);

    assertThrows(
      () => tracker.checkAndAdd('file2.md'),
      Error,
      'Maximum composition depth of 1 exceeded',
    );
  });

  await t.step('should handle edge case with depth limit of 0', () => {
    const tracker = new CircularDependencyTracker(0);

    assertEquals(tracker.isAtMaxDepth(), true);
    assertEquals(tracker.getRemainingDepth(), 0);

    assertThrows(
      () => tracker.checkAndAdd('file1.md'),
      Error,
      'Maximum composition depth of 0 exceeded',
    );
  });
});
