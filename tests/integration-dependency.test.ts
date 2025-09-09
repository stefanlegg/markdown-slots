import { assertEquals, assertThrows } from '@std/assert';
import { CircularDependencyTracker } from '../src/dependency-tracker.ts';

Deno.test('CircularDependencyTracker Integration', async (t) => {
  await t.step('should simulate realistic composition scenario', () => {
    const tracker = new CircularDependencyTracker(5);

    // Simulate composing a main document
    tracker.checkAndAdd('/project/main.md');
    assertEquals(tracker.getCurrentDepth(), 1);

    // Main document includes header
    tracker.checkAndAdd('/project/components/header.md');
    assertEquals(tracker.getCurrentDepth(), 2);

    // Header includes navigation
    tracker.checkAndAdd('/project/components/nav.md');
    assertEquals(tracker.getCurrentDepth(), 3);

    // Navigation includes logo
    tracker.checkAndAdd('/project/assets/logo.md');
    assertEquals(tracker.getCurrentDepth(), 4);

    // Finish with logo, pop back to nav
    tracker.pop();
    assertEquals(tracker.getCurrentDepth(), 3);

    // Navigation includes menu items
    tracker.checkAndAdd('/project/components/menu.md');
    assertEquals(tracker.getCurrentDepth(), 4);

    // Finish with menu, pop back to nav
    tracker.pop();
    assertEquals(tracker.getCurrentDepth(), 3);

    // Finish with nav, pop back to header
    tracker.pop();
    assertEquals(tracker.getCurrentDepth(), 2);

    // Finish with header, pop back to main
    tracker.pop();
    assertEquals(tracker.getCurrentDepth(), 1);

    // Main document includes content
    tracker.checkAndAdd('/project/content/intro.md');
    assertEquals(tracker.getCurrentDepth(), 2);

    // All files should be tracked as visited
    assertEquals(tracker.hasVisited('/project/main.md'), true);
    assertEquals(tracker.hasVisited('/project/components/header.md'), true);
    assertEquals(tracker.hasVisited('/project/components/nav.md'), true);
    assertEquals(tracker.hasVisited('/project/assets/logo.md'), true);
    assertEquals(tracker.hasVisited('/project/components/menu.md'), true);
    assertEquals(tracker.hasVisited('/project/content/intro.md'), true);
  });

  await t.step('should prevent realistic circular dependency', () => {
    const tracker = new CircularDependencyTracker();

    // Start with main document
    tracker.checkAndAdd('/project/main.md');

    // Main includes header
    tracker.checkAndAdd('/project/header.md');

    // Header includes sidebar
    tracker.checkAndAdd('/project/sidebar.md');

    // Sidebar tries to include main - should fail
    assertThrows(
      () => tracker.checkAndAdd('/project/main.md'),
      Error,
      'Circular dependency detected: /project/main.md -> /project/header.md -> /project/sidebar.md -> /project/main.md',
    );
  });

  await t.step('should handle deep nesting with depth limit', () => {
    const tracker = new CircularDependencyTracker(3);

    tracker.checkAndAdd('/level1.md');
    tracker.checkAndAdd('/level2.md');
    tracker.checkAndAdd('/level3.md');

    // Should be at max depth
    assertEquals(tracker.isAtMaxDepth(), true);

    // Try to go deeper - should fail
    assertThrows(
      () => tracker.checkAndAdd('/level4.md'),
      Error,
      'Maximum composition depth of 3 exceeded',
    );
  });

  await t.step('should allow reuse after clearing', () => {
    const tracker = new CircularDependencyTracker(2);

    // First composition
    tracker.checkAndAdd('/doc1.md');
    tracker.checkAndAdd('/doc2.md');
    assertEquals(tracker.isAtMaxDepth(), true);

    // Clear and start new composition
    tracker.clear();
    assertEquals(tracker.getCurrentDepth(), 0);
    assertEquals(tracker.hasVisited('/doc1.md'), false);

    // Should be able to compose again
    tracker.checkAndAdd('/other1.md');
    tracker.checkAndAdd('/other2.md');
    assertEquals(tracker.getCurrentDepth(), 2);
    assertEquals(tracker.hasVisited('/other1.md'), true);
  });

  await t.step('should provide useful debugging information', () => {
    const tracker = new CircularDependencyTracker(10);

    tracker.checkAndAdd('/main.md');
    tracker.checkAndAdd('/section1.md');
    tracker.checkAndAdd('/subsection.md');

    const snapshot = tracker.getSnapshot();

    // Should provide complete state information
    assertEquals(snapshot.stack, ['/main.md', '/section1.md', '/subsection.md']);
    assertEquals(snapshot.depth, 3);
    assertEquals(snapshot.maxDepth, 10);
    assertEquals(snapshot.visited.length, 3);

    // Should show remaining capacity
    assertEquals(tracker.getRemainingDepth(), 7);
  });
});
