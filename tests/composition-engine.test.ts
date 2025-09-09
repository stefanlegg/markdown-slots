import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { CompositionEngine } from '../src/composition-engine.ts';
import type { FileSystemAdapter } from '../src/filesystem.ts';
import type { MarkdownNode } from '../src/types.ts';

// Mock FileSystemAdapter for testing
class MockFileSystem implements FileSystemAdapter {
  private files = new Map<string, string>();
  private existingFiles = new Set<string>();

  setFile(path: string, content: string): void {
    this.files.set(path, content);
    this.existingFiles.add(path);
  }

  readFile(path: string): Promise<string> {
    if (!this.files.has(path)) {
      return Promise.reject(new Error(`File not found: ${path}`));
    }
    return Promise.resolve(this.files.get(path)!);
  }

  exists(path: string): Promise<boolean> {
    return Promise.resolve(this.existingFiles.has(path));
  }

  resolvePath(path: string, basePath?: string, resolveFrom: 'cwd' | 'file' = 'cwd'): string {
    if (path.startsWith('/')) return path;
    if (resolveFrom === 'file' && basePath) {
      const parts = basePath.split('/');
      parts.pop(); // Remove filename
      return parts.join('/') + '/' + path;
    }
    return path;
  }
}

Deno.test('CompositionEngine', async (t) => {
  let mockFs: MockFileSystem;
  let engine: CompositionEngine;

  // Setup before each test
  const setup = () => {
    mockFs = new MockFileSystem();
    engine = new CompositionEngine(mockFs);
  };

  await t.step('should compose basic content without slots', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Hello World\n\nThis is basic content.',
    };

    const result = await engine.compose(node);
    assertEquals(result.markdown, '# Hello World\n\nThis is basic content.');
    assertEquals(result.errors, undefined);
  });

  await t.step('should compose content from file', async () => {
    setup();

    mockFs.setFile('/test.md', '# File Content\n\nFrom file system.');

    const node: MarkdownNode = {
      file: '/test.md',
    };

    const result = await engine.compose(node);
    assertEquals(result.markdown, '# File Content\n\nFrom file system.');
    assertEquals(result.errors, undefined);
  });

  await t.step('should resolve basic slots with content', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Title\n\n<!-- outlet: intro -->\n\n<!-- outlet: conclusion -->',
      slots: {
        intro: { content: 'This is the introduction.' },
        conclusion: { content: 'This is the conclusion.' },
      },
    };

    const result = await engine.compose(node);
    assertEquals(
      result.markdown,
      '# Title\n\nThis is the introduction.\n\nThis is the conclusion.',
    );
    assertEquals(result.errors, undefined);
  });

  await t.step('should resolve slots with file sources', async () => {
    setup();

    mockFs.setFile('/intro.md', 'Introduction from file.');
    mockFs.setFile('/outro.md', 'Conclusion from file.');

    const node: MarkdownNode = {
      content: '# Document\n\n<!-- outlet: intro -->\n\n<!-- outlet: outro -->',
      slots: {
        intro: { file: '/intro.md' },
        outro: { file: '/outro.md' },
      },
    };

    const result = await engine.compose(node);
    assertEquals(result.markdown, '# Document\n\nIntroduction from file.\n\nConclusion from file.');
    assertEquals(result.errors, undefined);
  });

  await t.step('should resolve slots with function sources', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Dynamic Content\n\n<!-- outlet: timestamp -->',
      slots: {
        timestamp: () => Promise.resolve('Generated at runtime'),
      },
    };

    const result = await engine.compose(node);
    assertEquals(result.markdown, '# Dynamic Content\n\nGenerated at runtime');
    assertEquals(result.errors, undefined);
  });

  await t.step('should handle function errors correctly', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Content\n\n<!-- outlet: failing -->',
      slots: {
        failing: () => {
          throw new Error('Function failed');
        },
      },
    };

    const result = await engine.compose(node);
    assertStringIncludes(
      result.markdown,
      '<!-- Error: Function execution failed: Function failed -->',
    );
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'function-error');
    assertEquals(result.errors?.[0].message, 'Function execution failed: Function failed');
  });

  await t.step('should handle async function errors correctly', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Content\n\n<!-- outlet: failing -->',
      slots: {
        failing: () => {
          throw new Error('Async function failed');
        },
      },
    };

    const result = await engine.compose(node);
    assertStringIncludes(
      result.markdown,
      '<!-- Error: Function execution failed: Async function failed -->',
    );
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'function-error');
    assertEquals(result.errors?.[0].message, 'Function execution failed: Async function failed');
  });

  await t.step('should resolve nested MarkdownNode slots', async () => {
    setup();

    mockFs.setFile('/nested.md', 'Content from nested file.');

    const node: MarkdownNode = {
      content: '# Main\n\n<!-- outlet: nested -->',
      slots: {
        nested: {
          file: '/nested.md',
        },
      },
    };

    const result = await engine.compose(node);
    assertEquals(result.markdown, '# Main\n\nContent from nested file.');
    assertEquals(result.errors, undefined);
  });

  await t.step('should handle missing files with different error modes', async () => {
    setup();

    const node: MarkdownNode = {
      file: '/missing.md',
    };

    // Default behavior (should include error comment)
    const result1 = await engine.compose(node);
    assertStringIncludes(result1.markdown, '<!-- Error: File not found');
    assertEquals(result1.errors?.length, 1);
    assertEquals(result1.errors?.[0].type, 'file-error');

    // warn-empty mode
    const result2 = await engine.compose(node, { onFileError: 'warn-empty' });
    assertEquals(result2.markdown, '');
    assertEquals(result2.errors?.length, 1);
  });

  await t.step('should handle missing slots with different modes', async () => {
    setup();

    const node: MarkdownNode = {
      content: '# Title\n\n<!-- outlet: missing -->',
      slots: {},
    };

    // Default behavior (keep outlet)
    const result1 = await engine.compose(node);
    assertEquals(result1.markdown, '# Title\n\n<!-- outlet: missing -->');
    assertEquals(result1.errors?.length, 1);
    assertEquals(result1.errors?.[0].type, 'missing-slot');

    // ignore mode
    const result2 = await engine.compose(node, { onMissingSlot: 'ignore' });
    assertEquals(result2.markdown, '# Title\n\n');
    assertEquals(result2.errors?.length, 1);
  });

  await t.step('should detect circular dependencies', async () => {
    setup();

    mockFs.setFile('/a.md', '# A\n\n<!-- outlet: content -->');
    mockFs.setFile('/b.md', '# B\n\n<!-- outlet: content -->');

    const node: MarkdownNode = {
      file: '/a.md',
      slots: {
        content: {
          file: '/b.md',
          slots: {
            content: { file: '/a.md' }, // This creates the circular dependency
          },
        },
      },
    };

    const result = await engine.compose(node);
    assertStringIncludes(result.markdown, 'Circular dependency detected');
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'circular-dependency');
  });

  await t.step('should enforce depth limits', async () => {
    setup();

    mockFs.setFile('/level1.md', '# Level 1\n\n<!-- outlet: next -->');
    mockFs.setFile('/level2.md', '# Level 2\n\n<!-- outlet: next -->');
    mockFs.setFile('/level3.md', '# Level 3\n\n<!-- outlet: next -->');
    mockFs.setFile('/level4.md', '# Level 4');

    const node: MarkdownNode = {
      file: '/level1.md',
      slots: {
        next: {
          file: '/level2.md',
          slots: {
            next: {
              file: '/level3.md',
              slots: {
                next: { file: '/level4.md' },
              },
            },
          },
        },
      },
    };

    const result = await engine.compose(node, { maxDepth: 2 });
    assertStringIncludes(result.markdown, 'Maximum composition depth');
    assertEquals(result.errors?.length, 1);
    assertEquals(result.errors?.[0].type, 'max-depth');
  });

  await t.step('should use caching when provided', async () => {
    setup();

    const cache = new Map<string, string>();
    cache.set('/cached.md', 'Cached content');

    const node: MarkdownNode = {
      content: '# Main\n\n<!-- outlet: cached -->',
      slots: {
        cached: { file: '/cached.md' },
      },
    };

    const result = await engine.compose(node, { cache });
    assertEquals(result.markdown, '# Main\n\nCached content');
    assertEquals(result.errors, undefined);

    // Verify cache was used (file doesn't exist in mock fs)
    assertEquals(cache.get('/cached.md'), 'Cached content');
  });

  await t.step('should support parallel slot resolution', async () => {
    setup();

    mockFs.setFile('/slow1.md', 'Content 1');
    mockFs.setFile('/slow2.md', 'Content 2');

    const node: MarkdownNode = {
      content: '<!-- outlet: slot1 --> and <!-- outlet: slot2 -->',
      slots: {
        slot1: { file: '/slow1.md' },
        slot2: { file: '/slow2.md' },
      },
    };

    const _startTime = Date.now();
    const result = await engine.compose(node, { parallel: true });
    const _endTime = Date.now();

    assertEquals(result.markdown, 'Content 1 and Content 2');
    assertEquals(result.errors, undefined);

    // Parallel execution should be faster (though hard to test reliably)
    // At least verify it works without errors
  });

  await t.step('should handle complex nested composition', async () => {
    setup();

    mockFs.setFile('/header.md', '# Header\n\n<!-- outlet: nav -->');
    mockFs.setFile('/nav.md', 'Navigation: <!-- outlet: links -->');
    mockFs.setFile('/links.md', '[Home] [About] [Contact]');
    mockFs.setFile('/content.md', 'Main content here.');

    const node: MarkdownNode = {
      content: '<!-- outlet: header -->\n\n<!-- outlet: content -->',
      slots: {
        header: {
          file: '/header.md',
          slots: {
            nav: {
              file: '/nav.md',
              slots: {
                links: { file: '/links.md' },
              },
            },
          },
        },
        content: { file: '/content.md' },
      },
    };

    const result = await engine.compose(node);
    assertEquals(
      result.markdown,
      '# Header\n\nNavigation: [Home] [About] [Contact]\n\nMain content here.',
    );
    assertEquals(result.errors, undefined);
  });

  await t.step('should preserve code blocks during slot resolution', async () => {
    setup();

    const node: MarkdownNode = {
      content: `# Code Example

\`\`\`markdown
<!-- outlet: example -->
\`\`\`

<!-- outlet: real -->
<!-- outlet: missing -->`,
      slots: {
        real: { content: 'This is real content.' },
      },
    };

    const result = await engine.compose(node);
    assertStringIncludes(result.markdown, '<!-- outlet: example -->'); // Should be preserved in code block
    assertStringIncludes(result.markdown, 'This is real content.'); // Should be replaced
    assertStringIncludes(result.markdown, '<!-- outlet: missing -->'); // Should be kept (missing slot)
    assertEquals(result.errors?.length, 1); // Missing slot error for 'missing'
    assertEquals(result.errors?.[0].type, 'missing-slot');
  });
});
