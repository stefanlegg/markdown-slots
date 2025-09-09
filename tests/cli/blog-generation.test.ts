/**
 * Blog post generation tests for real-world scenarios
 * Tests blog post template and configuration patterns, metadata composition, and batch generation
 * Requirements: 7.2, 5.1
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

const CLI_PATH = resolve('./cli.ts');

/**
 * Run CLI command and return result
 */
async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const cmd = new Deno.Command('deno', {
    args: ['run', '--allow-read', '--allow-write', CLI_PATH, ...args],
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await cmd.output();

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

/**
 * Setup blog generation test files
 */
async function setupBlogFiles(): Promise<{ cleanup: () => Promise<void> }> {
  const tempFiles: string[] = [];

  // Create blog post template
  const blogTemplate = `---
title: <!-- outlet: title -->
author: <!-- outlet: author -->
date: <!-- outlet: date -->
tags: <!-- outlet: tags -->
excerpt: <!-- outlet: excerpt -->
category: <!-- outlet: category -->
featured: <!-- outlet: featured -->
---

# <!-- outlet: title -->

*By <!-- outlet: author --> on <!-- outlet: date -->*

<!-- outlet: excerpt -->

---

<!-- outlet: content -->

---

## About the Author

<!-- outlet: author_bio -->

## Related Posts

<!-- outlet: related_posts -->

## Tags

*Tags: <!-- outlet: tags -->*

---

*Published in <!-- outlet: category --> | Featured: <!-- outlet: featured -->*`;

  await Deno.writeTextFile('./blog-template.md', blogTemplate);
  tempFiles.push('./blog-template.md');

  // Create blog content files
  await Deno.mkdir('./blog-content', { recursive: true });

  await Deno.writeTextFile(
    './blog-content/getting-started.md',
    `Getting started with Markdown Slots is straightforward and powerful. This comprehensive guide will walk you through the basics and help you understand the core concepts.

## What is Markdown Slots?

Markdown Slots is a flexible templating system that allows you to compose markdown documents dynamically. Think of it as a way to build reusable, modular documentation.

## Key Benefits

- **Modularity**: Break your content into reusable pieces
- **Consistency**: Maintain consistent formatting across documents
- **Automation**: Generate documentation automatically from templates
- **Flexibility**: Support for multiple content sources

## Getting Started

The easiest way to get started is with the CLI:

\`\`\`bash
npx markdown-slots template.md --slot title="My Document" --slot content="Hello World"
\`\`\`

This simple command demonstrates the power of slot-based composition.`,
  );
  tempFiles.push('./blog-content/getting-started.md');

  await Deno.writeTextFile(
    './blog-content/advanced-features.md',
    `Advanced features in Markdown Slots unlock powerful workflows for complex documentation scenarios.

## Nested Compositions

One of the most powerful features is the ability to nest templates within templates:

\`\`\`json
{
  "slots": {
    "main_content": {
      "file": "./section-template.md",
      "slots": {
        "section_title": { "content": "Advanced Usage" },
        "section_content": { "file": "./advanced-content.md" }
      }
    }
  }
}
\`\`\`

## Parallel Processing

For large documentation projects, parallel processing can significantly improve performance:

\`\`\`json
{
  "options": {
    "parallel": true,
    "maxDepth": 15
  }
}
\`\`\`

## Error Handling Strategies

Configure how the system handles missing content:

- \`onMissingSlot: 'ignore'\` - Skip missing slots
- \`onFileError: 'warn-empty'\` - Insert empty content with warnings
- \`resolveFrom: 'file'\` - Resolve paths relative to template files`,
  );
  tempFiles.push('./blog-content/advanced-features.md');

  await Deno.writeTextFile(
    './blog-content/cli-usage.md',
    `The Markdown Slots CLI provides a convenient interface for both simple and complex documentation workflows.

## Basic Usage

The simplest usage involves inline content:

\`\`\`bash
npx markdown-slots template.md --slot title="My Title" --slot content="My content"
\`\`\`

## File-Based Content

Reference external files with the @ prefix:

\`\`\`bash
npx markdown-slots template.md --slot content=@./content/main.md
\`\`\`

## JSON Configuration

For complex scenarios, use JSON configuration files:

\`\`\`bash
npx markdown-slots template.md --json config.json
\`\`\`

## Integration Examples

### NPM Scripts

\`\`\`json
{
  "scripts": {
    "docs": "npx markdown-slots template.md --json config.json --output README.md"
  }
}
\`\`\`

### GitHub Actions

\`\`\`yaml
- name: Generate Documentation
  run: npx markdown-slots template.md --json config.json --output README.md
\`\`\``,
  );
  tempFiles.push('./blog-content/cli-usage.md');

  // Create author bio files
  await Deno.mkdir('./authors', { recursive: true });

  await Deno.writeTextFile(
    './authors/jane-developer.md',
    `Jane Developer is a senior software engineer with over 8 years of experience in TypeScript, Node.js, and documentation tooling. She's passionate about developer experience and creating tools that make developers more productive.

**Connect with Jane:**
- GitHub: [@jane-developer](https://github.com/jane-developer)
- Twitter: [@jane_codes](https://twitter.com/jane_codes)
- Blog: [jane-developer.dev](https://jane-developer.dev)`,
  );
  tempFiles.push('./authors/jane-developer.md');

  await Deno.writeTextFile(
    './authors/john-smith.md',
    `John Smith is a technical writer and developer advocate specializing in developer tools and API documentation. He has contributed to numerous open-source projects and enjoys helping developers learn new technologies.

**Connect with John:**
- GitHub: [@john-smith-docs](https://github.com/john-smith-docs)
- LinkedIn: [john-smith-tech](https://linkedin.com/in/john-smith-tech)
- Website: [johnsmith.tech](https://johnsmith.tech)`,
  );
  tempFiles.push('./authors/john-smith.docs');

  // Create related posts template
  await Deno.writeTextFile(
    './templates/related-posts.md',
    `- [Getting Started with Markdown Slots](./getting-started.md)
- [Advanced CLI Usage](./cli-usage.md)
- [Best Practices for Documentation](./best-practices.md)
- [Integration Patterns](./integration-patterns.md)`,
  );
  tempFiles.push('./templates/related-posts.md');

  // Create blog configuration
  const blogConfig = {
    slots: {
      author_bio: { file: './authors/jane-developer.md' },
      related_posts: { file: './templates/related-posts.md' },
      featured: { content: 'true' },
    },
    options: {
      resolveFrom: 'file',
      parallel: true,
    },
  };

  await Deno.writeTextFile('./blog-config.json', JSON.stringify(blogConfig, null, 2));
  tempFiles.push('./blog-config.json');

  // Create batch blog configuration for multiple posts
  const batchConfig = {
    posts: [
      {
        title: 'Getting Started with Markdown Slots',
        author: 'Jane Developer',
        date: '2024-01-15',
        tags: 'markdown, cli, documentation, getting-started',
        excerpt:
          'Learn the basics of Markdown Slots and how to get started with dynamic content generation.',
        category: 'Tutorial',
        content_file: './blog-content/getting-started.md',
        output_file: './output/getting-started.md',
      },
      {
        title: 'Advanced Features and Patterns',
        author: 'Jane Developer',
        date: '2024-01-20',
        tags: 'markdown, advanced, nested-composition, performance',
        excerpt:
          'Explore advanced features like nested compositions, parallel processing, and error handling strategies.',
        category: 'Advanced',
        content_file: './blog-content/advanced-features.md',
        output_file: './output/advanced-features.md',
      },
      {
        title: 'CLI Usage and Integration',
        author: 'John Smith',
        date: '2024-01-25',
        tags: 'cli, integration, npm, github-actions',
        excerpt:
          'Master the CLI interface and learn integration patterns for build systems and CI/CD.',
        category: 'Guide',
        content_file: './blog-content/cli-usage.md',
        output_file: './output/cli-usage.md',
      },
    ],
  };

  await Deno.writeTextFile('./batch-blog-config.json', JSON.stringify(batchConfig, null, 2));
  tempFiles.push('./batch-blog-config.json');

  return {
    cleanup: async () => {
      for (const file of tempFiles) {
        try {
          await Deno.remove(file);
        } catch {
          // Ignore cleanup errors
        }
      }
      try {
        await Deno.remove('./blog-content', { recursive: true });
        await Deno.remove('./authors', { recursive: true });
        await Deno.remove('./templates', { recursive: true });
        await Deno.remove('./output', { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

Deno.test('Blog Generation Tests', async (t) => {
  // Create directories first
  await Deno.mkdir('./templates', { recursive: true });

  const { cleanup } = await setupBlogFiles();

  await t.step('should generate blog post with complete metadata and content', async () => {
    const result = await runCli([
      'compose',
      'blog-template.md',
      '--json',
      'blog-config.json',
      '--slot',
      'title=Getting Started with Markdown Slots',
      '--slot',
      'author=Jane Developer',
      '--slot',
      'date=2024-01-15',
      '--slot',
      'tags=markdown, cli, documentation, tutorial',
      '--slot',
      'excerpt=Learn how to use Markdown Slots for dynamic content generation and documentation automation.',
      '--slot',
      'category=Tutorial',
      '--slot',
      'content=@blog-content/getting-started.md',
    ]);

    assertEquals(result.code, 0);

    // Verify frontmatter
    assertStringIncludes(result.stdout, '---');
    assertStringIncludes(result.stdout, 'title: Getting Started with Markdown Slots');
    assertStringIncludes(result.stdout, 'author: Jane Developer');
    assertStringIncludes(result.stdout, 'date: 2024-01-15');
    assertStringIncludes(result.stdout, 'tags: markdown, cli, documentation, tutorial');
    assertStringIncludes(result.stdout, 'excerpt: Learn how to use Markdown Slots');
    assertStringIncludes(result.stdout, 'category: Tutorial');
    assertStringIncludes(result.stdout, 'featured: true');

    // Verify blog structure
    assertStringIncludes(result.stdout, '# Getting Started with Markdown Slots');
    assertStringIncludes(result.stdout, '*By Jane Developer on 2024-01-15*');
    assertStringIncludes(result.stdout, 'Learn how to use Markdown Slots');

    // Verify content
    assertStringIncludes(result.stdout, '## What is Markdown Slots?');
    assertStringIncludes(result.stdout, 'Markdown Slots is a flexible templating system');
    assertStringIncludes(result.stdout, '## Key Benefits');
    assertStringIncludes(result.stdout, '- **Modularity**');

    // Verify author bio
    assertStringIncludes(result.stdout, '## About the Author');
    assertStringIncludes(result.stdout, 'Jane Developer is a senior software engineer');
    assertStringIncludes(result.stdout, 'GitHub: [@jane-developer]');

    // Verify related posts
    assertStringIncludes(result.stdout, '## Related Posts');
    assertStringIncludes(result.stdout, '- [Getting Started with Markdown Slots]');

    // Verify footer
    assertStringIncludes(result.stdout, '*Published in Tutorial | Featured: true*');
  });

  await t.step('should generate blog post with different author', async () => {
    const johnConfig = {
      slots: {
        author_bio: { file: './authors/john-smith.md' },
        related_posts: { file: './templates/related-posts.md' },
        featured: { content: 'false' },
      },
    };

    await Deno.writeTextFile('./john-config.json', JSON.stringify(johnConfig, null, 2));

    const result = await runCli([
      'compose',
      'blog-template.md',
      '--json',
      'john-config.json',
      '--slot',
      'title=CLI Usage and Integration',
      '--slot',
      'author=John Smith',
      '--slot',
      'date=2024-01-25',
      '--slot',
      'tags=cli, integration, npm, github-actions',
      '--slot',
      'excerpt=Master the CLI interface and learn integration patterns.',
      '--slot',
      'category=Guide',
      '--slot',
      'content=@blog-content/cli-usage.md',
    ]);

    assertEquals(result.code, 0);

    // Verify different author
    assertStringIncludes(result.stdout, 'author: John Smith');
    assertStringIncludes(result.stdout, '*By John Smith on 2024-01-25*');
    assertStringIncludes(result.stdout, 'John Smith is a technical writer');
    assertStringIncludes(result.stdout, 'LinkedIn: [john-smith-tech]');
    assertStringIncludes(result.stdout, 'featured: false');
    assertStringIncludes(result.stdout, '*Published in Guide | Featured: false*');

    await Deno.remove('./john-config.json');
  });

  await t.step('should generate multiple blog posts with batch processing', async () => {
    await Deno.mkdir('./output', { recursive: true });

    // Read batch configuration
    const batchConfigText = await Deno.readTextFile('./batch-blog-config.json');
    const batchConfig = JSON.parse(batchConfigText);

    // Generate each blog post
    for (const post of batchConfig.posts) {
      const result = await runCli([
        'compose',
        'blog-template.md',
        '--json',
        'blog-config.json',
        '--slot',
        `title=${post.title}`,
        '--slot',
        `author=${post.author}`,
        '--slot',
        `date=${post.date}`,
        '--slot',
        `tags=${post.tags}`,
        '--slot',
        `excerpt=${post.excerpt}`,
        '--slot',
        `category=${post.category}`,
        '--slot',
        `content=@${post.content_file}`,
        '--output',
        post.output_file,
      ]);

      assertEquals(result.code, 0);
    }

    // Verify all files were created
    const gettingStartedContent = await Deno.readTextFile('./output/getting-started.md');
    const advancedFeaturesContent = await Deno.readTextFile('./output/advanced-features.md');
    const cliUsageContent = await Deno.readTextFile('./output/cli-usage.md');

    // Verify getting started post
    assertStringIncludes(gettingStartedContent, 'title: Getting Started with Markdown Slots');
    assertStringIncludes(gettingStartedContent, 'category: Tutorial');
    assertStringIncludes(gettingStartedContent, '## What is Markdown Slots?');

    // Verify advanced features post
    assertStringIncludes(advancedFeaturesContent, 'title: Advanced Features and Patterns');
    assertStringIncludes(advancedFeaturesContent, 'category: Advanced');
    assertStringIncludes(advancedFeaturesContent, '## Nested Compositions');

    // Verify CLI usage post
    assertStringIncludes(cliUsageContent, 'title: CLI Usage and Integration');
    assertStringIncludes(cliUsageContent, 'category: Guide');
    assertStringIncludes(cliUsageContent, '## Basic Usage');
  });

  await t.step('should handle blog post generation with missing content gracefully', async () => {
    const result = await runCli([
      'compose',
      'blog-template.md',
      '--slot',
      'title=Test Blog Post',
      '--slot',
      'author=Test Author',
      '--slot',
      'date=2024-01-15',
      '--slot',
      'tags=test',
      '--slot',
      'excerpt=Test excerpt',
      '--slot',
      'category=Test',
      '--slot',
      'featured=false',
      '--slot',
      'content=@missing-content.md',
      '--slot',
      'author_bio=Test author bio',
      '--slot',
      'related_posts=- [Test Post](./test.md)',
    ]);

    assertEquals(result.code, 0);

    // Should still generate valid blog post structure
    assertStringIncludes(result.stdout, 'title: Test Blog Post');
    assertStringIncludes(result.stdout, '# Test Blog Post');
    assertStringIncludes(result.stdout, '*By Test Author on 2024-01-15*');
    assertStringIncludes(result.stdout, 'Test excerpt');
    assertStringIncludes(result.stdout, 'Test author bio');
    assertStringIncludes(result.stdout, '- [Test Post](./test.md)');
  });

  await t.step('should generate blog post with dynamic date and metadata', async () => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const result = await runCli([
      'compose',
      'blog-template.md',
      '--json',
      'blog-config.json',
      '--slot',
      'title=Dynamic Blog Post',
      '--slot',
      'author=Dynamic Author',
      '--slot',
      `date=${currentDate}`,
      '--slot',
      'tags=dynamic, automated, ci-cd',
      '--slot',
      'excerpt=This blog post was generated automatically with dynamic metadata.',
      '--slot',
      'category=Automation',
      '--slot',
      'content=This content was generated dynamically during the build process.',
    ]);

    assertEquals(result.code, 0);

    // Verify dynamic content
    assertStringIncludes(result.stdout, `date: ${currentDate}`);
    assertStringIncludes(result.stdout, `*By Dynamic Author on ${currentDate}*`);
    assertStringIncludes(result.stdout, 'tags: dynamic, automated, ci-cd');
    assertStringIncludes(result.stdout, 'category: Automation');
    assertStringIncludes(result.stdout, 'This content was generated dynamically');
  });

  await t.step('should generate blog post with nested template structures', async () => {
    // Create nested blog template
    const nestedBlogTemplate = `---
title: <!-- outlet: title -->
author: <!-- outlet: author -->
date: <!-- outlet: date -->
---

# <!-- outlet: title -->

<!-- outlet: header_section -->

<!-- outlet: main_content -->

<!-- outlet: footer_section -->`;

    const headerTemplate = `*By <!-- outlet: author --> on <!-- outlet: date -->*

<!-- outlet: excerpt -->

---`;

    const footerTemplate = `---

## About the Author

<!-- outlet: author_bio -->

*Published in <!-- outlet: category -->*`;

    await Deno.writeTextFile('./nested-blog-template.md', nestedBlogTemplate);
    await Deno.writeTextFile('./header-template.md', headerTemplate);
    await Deno.writeTextFile('./footer-template.md', footerTemplate);

    const nestedConfig = {
      slots: {
        header_section: {
          file: './header-template.md',
          slots: {
            author: { content: 'Nested Author' },
            date: { content: '2024-01-15' },
            excerpt: {
              content: 'This demonstrates nested template composition in blog generation.',
            },
          },
        },
        main_content: { file: './blog-content/getting-started.md' },
        footer_section: {
          file: './footer-template.md',
          slots: {
            author_bio: { file: './authors/jane-developer.md' },
            category: { content: 'Nested Example' },
          },
        },
      },
    };

    await Deno.writeTextFile('./nested-blog-config.json', JSON.stringify(nestedConfig, null, 2));

    const result = await runCli([
      'compose',
      'nested-blog-template.md',
      '--json',
      'nested-blog-config.json',
      '--slot',
      'title=Nested Blog Template Example',
      '--slot',
      'author=Nested Author',
      '--slot',
      'date=2024-01-15',
    ]);

    assertEquals(result.code, 0);

    // Verify nested structure
    assertStringIncludes(result.stdout, 'title: Nested Blog Template Example');
    assertStringIncludes(result.stdout, '# Nested Blog Template Example');
    assertStringIncludes(result.stdout, '*By Nested Author on 2024-01-15*');
    assertStringIncludes(result.stdout, 'This demonstrates nested template composition');
    assertStringIncludes(result.stdout, '## What is Markdown Slots?');
    assertStringIncludes(result.stdout, 'Jane Developer is a senior software engineer');
    assertStringIncludes(result.stdout, '*Published in Nested Example*');

    // Cleanup nested files
    await Deno.remove('./nested-blog-template.md');
    await Deno.remove('./header-template.md');
    await Deno.remove('./footer-template.md');
    await Deno.remove('./nested-blog-config.json');
  });

  await t.step('should handle blog generation with special characters and formatting', async () => {
    const specialContent = `# Special Characters Test

This content contains various special characters and formatting:

- **Bold text** with *italic text*
- \`Inline code\` and code blocks:

\`\`\`javascript
console.log("Hello, world!");
const special = "àáâãäå ñ ç ü ß €£¥";
\`\`\`

- Unicode characters: 🚀 🎉 💯 ⭐ 🌟
- Quotes: "double quotes" and 'single quotes'
- Special symbols: © ® ™ § ¶ † ‡ • … ‰ ‹ › « »

## Links and References

- [External link](https://example.com)
- [Internal link](./other-post.md)
- Email: test@example.com

## Lists and Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| àáâã     | ñç       | üß       |`;

    await Deno.writeTextFile('./special-content.md', specialContent);

    const result = await runCli([
      'compose',
      'blog-template.md',
      '--json',
      'blog-config.json',
      '--slot',
      'title=Special Characters & Formatting Test',
      '--slot',
      'author=Test Author',
      '--slot',
      'date=2024-01-15',
      '--slot',
      'tags=special-characters, unicode, formatting',
      '--slot',
      'excerpt=Testing special characters: àáâãäå ñ ç ü ß €£¥ 🚀',
      '--slot',
      'category=Testing',
      '--slot',
      'content=@special-content.md',
    ]);

    assertEquals(result.code, 0);

    // Verify special characters are preserved
    assertStringIncludes(result.stdout, 'title: Special Characters & Formatting Test');
    assertStringIncludes(
      result.stdout,
      'excerpt: Testing special characters: àáâãäå ñ ç ü ß €£¥ 🚀',
    );
    assertStringIncludes(result.stdout, 'tags: special-characters, unicode, formatting');
    assertStringIncludes(result.stdout, '# Special Characters Test');
    assertStringIncludes(result.stdout, 'const special = "àáâãäå ñ ç ü ß €£¥";');
    assertStringIncludes(result.stdout, 'Unicode characters: 🚀 🎉 💯 ⭐ 🌟');
    assertStringIncludes(result.stdout, '| àáâã     | ñç       | üß       |');

    await Deno.remove('./special-content.md');
  });

  await cleanup();
});
