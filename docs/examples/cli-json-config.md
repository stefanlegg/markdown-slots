# CLI JSON Configuration Examples

This document demonstrates advanced CLI usage with JSON configuration files.

## Basic JSON Configuration

### Simple Configuration

Create a JSON configuration file:

```json
{
  "slots": {
    "title": { "content": "My Project Documentation" },
    "author": { "content": "John Doe" },
    "version": { "content": "1.0.0" },
    "description": { "file": "./content/description.md" },
    "installation": { "file": "./content/installation.md" }
  }
}
```

Use with CLI:

```bash
# Long flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --json config.json

# Short flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md -j config.json
```

### Configuration with Options

```json
{
  "slots": {
    "title": { "content": "Advanced Configuration" },
    "content": { "file": "./content/main.md" }
  },
  "options": {
    "resolveFrom": "file",
    "onMissingSlot": "ignore",
    "parallel": true
  }
}
```

## Nested Compositions

### Simple Nesting

```json
{
  "slots": {
    "header": { "content": "# Main Document" },
    "main_section": {
      "file": "./templates/section-template.md",
      "slots": {
        "section_title": { "content": "Important Section" },
        "section_content": { "file": "./content/section-content.md" }
      }
    },
    "footer": { "content": "© 2024 My Company" }
  }
}
```

### Deep Nesting

```json
{
  "slots": {
    "document": {
      "file": "./templates/document-template.md",
      "slots": {
        "title": { "content": "Complex Document" },
        "chapters": {
          "file": "./templates/chapters-template.md",
          "slots": {
            "chapter1": {
              "file": "./templates/chapter-template.md",
              "slots": {
                "chapter_title": { "content": "Chapter 1: Introduction" },
                "chapter_content": { "file": "./content/chapter1.md" },
                "subsections": {
                  "file": "./templates/subsections-template.md",
                  "slots": {
                    "subsection1": { "content": "First subsection content" },
                    "subsection2": { "file": "./content/subsection2.md" }
                  }
                }
              }
            },
            "chapter2": {
              "file": "./templates/chapter-template.md",
              "slots": {
                "chapter_title": { "content": "Chapter 2: Advanced Topics" },
                "chapter_content": { "file": "./content/chapter2.md" }
              }
            }
          }
        }
      }
    }
  }
}
```

## Combining JSON and CLI

### CLI Overrides JSON

JSON configuration (`base-config.json`):

```json
{
  "slots": {
    "title": { "content": "Default Title" },
    "author": { "content": "Default Author" },
    "version": { "content": "1.0.0" },
    "description": { "file": "./content/description.md" }
  }
}
```

Override specific slots via CLI:

```bash
# Long flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --json base-config.json \
  --slot title="Custom Title" \
  --slot author="Jane Smith"

# Short flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  -j base-config.json \
  -s title="Custom Title" \
  -s author="Jane Smith"

# Mixed flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  --json base-config.json \
  -s title="Mixed Flags Title" \
  --slot version="2.0.0"
```

### Environment-Specific Configurations

Development configuration (`dev-config.json`):

```json
{
  "slots": {
    "environment": { "content": "Development" },
    "api_url": { "content": "http://localhost:3000" },
    "debug_info": { "file": "./content/debug-info.md" },
    "footer": { "content": "DEV BUILD - Not for production" }
  }
}
```

Production configuration (`prod-config.json`):

```json
{
  "slots": {
    "environment": { "content": "Production" },
    "api_url": { "content": "https://api.example.com" },
    "debug_info": { "content": "" },
    "footer": { "content": "© 2024 Production System" }
  }
}
```

Usage:

```bash
# Development build
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose app-template.md \
  --json dev-config.json \
  --output docs/dev-guide.md

# Production build
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose app-template.md \
  --json prod-config.json \
  --output docs/user-guide.md
```

## Real-World Examples

### Documentation Site Generation

Directory structure:

```
docs/
├── templates/
│   ├── main-template.md
│   ├── api-template.md
│   └── guide-template.md
├── content/
│   ├── intro.md
│   ├── api/
│   │   ├── authentication.md
│   │   └── endpoints.md
│   └── guides/
│       ├── getting-started.md
│       └── advanced.md
├── configs/
│   ├── main-config.json
│   ├── api-config.json
│   └── guide-config.json
└── output/
```

Main configuration (`configs/main-config.json`):

```json
{
  "slots": {
    "site_title": { "content": "My API Documentation" },
    "version": { "content": "v2.1.0" },
    "last_updated": { "content": "2024-01-15" },
    "introduction": { "file": "./content/intro.md" },
    "api_section": {
      "file": "./templates/api-template.md",
      "slots": {
        "auth_docs": { "file": "./content/api/authentication.md" },
        "endpoints_docs": { "file": "./content/api/endpoints.md" }
      }
    },
    "guides_section": {
      "file": "./templates/guide-template.md",
      "slots": {
        "getting_started": { "file": "./content/guides/getting-started.md" },
        "advanced_guide": { "file": "./content/guides/advanced.md" }
      }
    }
  },
  "options": {
    "resolveFrom": "file",
    "parallel": true
  }
}
```

Generate documentation:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose templates/main-template.md \
  --json configs/main-config.json \
  --output output/documentation.md \
  --verbose
```

### Multi-Language Site

Base configuration (`base-config.json`):

```json
{
  "slots": {
    "site_name": { "content": "My Website" },
    "navigation": { "file": "./templates/nav-template.md" },
    "footer": { "file": "./templates/footer-template.md" }
  }
}
```

English content (`en-config.json`):

```json
{
  "slots": {
    "language": { "content": "en" },
    "title": { "content": "Welcome to My Website" },
    "content": { "file": "./content/en/home.md" },
    "nav_home": { "content": "Home" },
    "nav_about": { "content": "About" },
    "nav_contact": { "content": "Contact" }
  }
}
```

Spanish content (`es-config.json`):

```json
{
  "slots": {
    "language": { "content": "es" },
    "title": { "content": "Bienvenido a Mi Sitio Web" },
    "content": { "file": "./content/es/home.md" },
    "nav_home": { "content": "Inicio" },
    "nav_about": { "content": "Acerca de" },
    "nav_contact": { "content": "Contacto" }
  }
}
```

Generate multi-language sites:

```bash
# English version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose site-template.md \
  --json base-config.json \
  --json en-config.json \
  --output dist/en/index.md

# Spanish version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose site-template.md \
  --json base-config.json \
  --json es-config.json \
  --output dist/es/index.md
```

### Blog Post Generation

Blog template (`blog-template.md`):

```markdown
---
title: <!-- slot: title -->
author: <!-- slot: author -->
date: <!-- slot: date -->
tags: <!-- slot: tags -->
---

# <!-- slot: title -->

_By <!-- slot: author --> on <!-- slot: date -->_

<!-- slot: excerpt -->

---

<!-- slot: content -->

---

## About the Author

<!-- slot: author_bio -->

## Related Posts

<!-- slot: related_posts -->

_Tags: <!-- slot: tags -->_
```

Blog configuration (`blog-config.json`):

```json
{
  "slots": {
    "author": { "content": "Jane Developer" },
    "author_bio": { "file": "./authors/jane-developer.md" },
    "related_posts": { "file": "./templates/related-posts-template.md" }
  }
}
```

Generate blog post:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose blog-template.md \
  --json blog-config.json \
  --slot title="Getting Started with Markdown Slots" \
  --slot date="2024-01-15" \
  --slot tags="markdown, cli, documentation" \
  --slot excerpt="Learn how to use Markdown Slots for dynamic content generation" \
  --slot content=@posts/markdown-slots-intro.md \
  --output blog/2024-01-15-getting-started.md
```

## Advanced Patterns

### Conditional Content

Use different configurations for different builds:

```bash
# Development version with debug info
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --json base-config.json \
  --slot environment="development" \
  --slot debug_panel=@debug-panel.md

# Production version without debug info
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --json base-config.json \
  --slot environment="production" \
  --slot debug_panel=""
```

### Template Inheritance

Base template configuration:

```json
{
  "slots": {
    "layout": {
      "file": "./templates/base-layout.md",
      "slots": {
        "head": { "file": "./templates/head.md" },
        "header": { "file": "./templates/header.md" },
        "footer": { "file": "./templates/footer.md" }
      }
    }
  }
}
```

Extend with page-specific content:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose page-template.md \
  --json base-layout-config.json \
  --slot page_title="About Us" \
  --slot page_content=@content/about.md \
  --slot meta_description="Learn about our company"
```

## Error Handling and Debugging

### Verbose Mode with JSON

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose complex-template.md \
  --json complex-config.json \
  --verbose
```

### Handling Missing Files

Configuration with missing file reference:

```json
{
  "slots": {
    "existing_content": { "file": "./content/exists.md" },
    "missing_content": { "file": "./content/missing.md" }
  }
}
```

The CLI will complete successfully but report warnings:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --json config.json
# Output includes warnings about missing files
```

### JSON Validation Errors

Invalid JSON will produce helpful error messages:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --json invalid.json
# Error: Invalid JSON in configuration file
# Tip: Validate your JSON configuration file syntax.
```

## Best Practices

1. **Organize configurations**: Keep JSON configs in a dedicated directory
2. **Use relative paths**: Make configurations portable with relative file paths
3. **Environment-specific configs**: Separate configs for dev/staging/production
4. **Validate JSON**: Use a JSON validator to check syntax before use
5. **Document your schemas**: Comment your JSON structure for team members
6. **Version control**: Include configuration files in version control
7. **Test configurations**: Verify complex nested structures work as expected
