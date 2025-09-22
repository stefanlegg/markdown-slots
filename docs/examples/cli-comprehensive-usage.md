# Comprehensive CLI Usage Guide

This document provides a complete guide to using the Markdown Slots CLI with real-world examples and best practices.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Advanced Configurations](#advanced-configurations)
- [Real-World Scenarios](#real-world-scenarios)
- [Integration Examples](#integration-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

### Node.js/NPM Installation

```bash
# Install globally for system-wide access
npm install -g markdown-slots

# Verify installation
markdown-slots --help
```

### Project-Local Installation (Node.js)

```bash
# Install as project dependency
npm install markdown-slots

# Use via JSR
deno run -R -W jsr:@stefanlegg/markdown-slots/cli --help

# Add to package.json scripts
{
  "scripts": {
    "docs": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --output README.md"
  }
}
```

### Deno Installation

```bash
# Run directly from URL (no installation needed)
deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts --help

# Install globally with deno install
deno install --allow-read --allow-write --name markdown-slots https://deno.land/x/markdown_slots/cli.ts

# Verify installation
markdown-slots --help

# Install with restricted permissions (safer)
deno install --allow-read=. --allow-write=. --name markdown-slots-local https://deno.land/x/markdown_slots/cli.ts
```

### Deno Tasks Setup

Create a `deno.json` file in your project:

```json
{
  "tasks": {
    "docs": "deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts template.md --json config.json --output README.md",
    "docs:dev": "deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts template.md --json dev-config.json --output README.md --verbose",
    "docs:watch": "deno run --allow-read --allow-write --watch docs/ https://deno.land/x/markdown_slots/cli.ts template.md --json config.json --output README.md"
  }
}
```

Then use with:

```bash
deno task docs
deno task docs:dev
deno task docs:watch
```

## Basic Usage

### Simple Template Composition

Create a basic template (`template.md`):

```markdown
# <!-- slot: title -->

**Author:** <!-- slot: author -->\
**Version:** <!-- slot: version -->

## Description

<!-- slot: description -->

## Installation

<!-- slot: installation -->

---

_Last updated: <!-- slot: last_updated -->_
```

#### Using Inline Content

```bash
# Long flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="My Awesome Project" \
  --slot author="Jane Developer" \
  --slot version="1.0.0" \
  --slot description="A comprehensive tool for developers" \
  --slot installation="npm install my-awesome-project" \
  --slot last_updated="2024-01-15"

# Short flags (equivalent)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  -s title="My Awesome Project" \
  -s author="Jane Developer" \
  -s version="1.0.0" \
  -s description="A comprehensive tool for developers" \
  -s installation="npm install my-awesome-project" \
  -s last_updated="2024-01-15"
```

#### Using File-Based Content

Create content files:

```bash
# Create content directory
mkdir -p content

# Create individual content files
echo "A comprehensive tool for developers that simplifies complex workflows." > content/description.md
echo "npm install my-awesome-project" > content/installation.md
```

Use file-based slots:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  --slot title="My Awesome Project" \
  --slot author="Jane Developer" \
  --slot version="1.0.0" \
  --slot description=@content/description.md \
  --slot installation=@content/installation.md \
  --slot last_updated="$(date)" \
  --output README.md
```

### Output Options

```bash
# Output to stdout (default)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test"

# Output to file
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test" --output result.md

# Verbose output for debugging
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test" --verbose

# Combined options
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  --slot title="Test" \
  --output result.md \
  --verbose
```

## Advanced Configurations

### JSON Configuration Files

#### Basic JSON Configuration

Create `config.json`:

```json
{
  "slots": {
    "title": { "content": "Advanced Project Documentation" },
    "author": { "content": "Development Team" },
    "version": { "content": "2.1.0" },
    "description": { "file": "./content/description.md" },
    "installation": { "file": "./content/installation.md" },
    "last_updated": { "content": "2024-01-15" }
  }
}
```

Use the configuration:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --output README.md
```

#### Configuration with Options

Create `advanced-config.json`:

```json
{
  "slots": {
    "title": { "content": "Advanced Configuration Example" },
    "main_content": { "file": "./content/main.md" },
    "api_docs": { "file": "./content/api.md" },
    "examples": { "file": "./content/examples.md" }
  },
  "options": {
    "resolveFrom": "file",
    "onMissingSlot": "ignore",
    "onFileError": "warn-empty",
    "parallel": true,
    "maxDepth": 15
  }
}
```

#### Nested Compositions

Create `nested-config.json`:

```json
{
  "slots": {
    "document": {
      "file": "./templates/document-template.md",
      "slots": {
        "title": { "content": "Complex Document" },
        "sections": {
          "file": "./templates/sections-template.md",
          "slots": {
            "introduction": {
              "file": "./templates/section-template.md",
              "slots": {
                "section_title": { "content": "Introduction" },
                "section_content": { "file": "./content/intro.md" }
              }
            },
            "getting_started": {
              "file": "./templates/section-template.md",
              "slots": {
                "section_title": { "content": "Getting Started" },
                "section_content": { "file": "./content/getting-started.md" }
              }
            },
            "advanced_topics": {
              "file": "./templates/section-template.md",
              "slots": {
                "section_title": { "content": "Advanced Topics" },
                "section_content": { "file": "./content/advanced.md" }
              }
            }
          }
        }
      }
    }
  }
}
```

### Combining JSON and CLI

Override JSON configuration with CLI arguments:

```bash
# Base configuration from JSON, override specific slots
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  --json config.json \
  --slot version="2.0.0-beta" \
  --slot last_updated="$(date)" \
  --output beta-README.md
```

## Real-World Scenarios

### Documentation Site Generation

#### Project Structure

```
docs/
├── templates/
│   ├── main-template.md
│   ├── api-template.md
│   ├── guide-template.md
│   └── section-template.md
├── content/
│   ├── intro.md
│   ├── installation.md
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

#### Main Documentation Configuration

`configs/main-config.json`:

```json
{
  "slots": {
    "site_title": { "content": "My API Documentation" },
    "version": { "content": "v2.1.0" },
    "last_updated": { "content": "2024-01-15" },
    "introduction": { "file": "./content/intro.md" },
    "installation": { "file": "./content/installation.md" },
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

#### Generate Documentation

```bash
# Generate main documentation
deno run -R -W jsr:@stefanlegg/markdown-slots/cli templates/main-template.md \
  --json configs/main-config.json \
  --slot build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output output/documentation.md \
  --verbose

# Generate API documentation
deno run -R -W jsr:@stefanlegg/markdown-slots/cli templates/api-template.md \
  --json configs/api-config.json \
  --output output/api.md

# Generate user guide
deno run -R -W jsr:@stefanlegg/markdown-slots/cli templates/guide-template.md \
  --json configs/guide-config.json \
  --output output/guide.md
```

### Blog Post Generation

#### Blog Template

`templates/blog-post.md`:

```markdown
---
title: <!-- slot: title -->
author: <!-- slot: author -->
date: <!-- slot: date -->
tags: <!-- slot: tags -->
excerpt: <!-- slot: excerpt -->
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

#### Blog Configuration

`configs/blog-config.json`:

```json
{
  "slots": {
    "author": { "content": "Jane Developer" },
    "author_bio": { "file": "./authors/jane-developer.md" },
    "related_posts": { "file": "./templates/related-posts.md" }
  }
}
```

#### Generate Blog Posts

```bash
# Generate individual blog post
deno run -R -W jsr:@stefanlegg/markdown-slots/cli templates/blog-post.md \
  --json configs/blog-config.json \
  --slot title="Getting Started with Markdown Slots" \
  --slot date="2024-01-15" \
  --slot tags="markdown, cli, documentation, tools" \
  --slot excerpt="Learn how to use Markdown Slots for dynamic content generation and documentation automation." \
  --slot content=@posts/markdown-slots-intro.md \
  --output blog/2024-01-15-getting-started.md \
  --verbose

# Generate multiple posts with different content
for post in posts/*.md; do
  post_name=$(basename "$post" .md)
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli templates/blog-post.md \
    --json configs/blog-config.json \
    --slot title="$(head -1 "$post" | sed 's/^# //')" \
    --slot date="$(date +%Y-%m-%d)" \
    --slot content=@"$post" \
    --output "blog/${post_name}.md"
done
```

### Multi-Language Site Generation

#### Base Configuration

`configs/base-config.json`:

```json
{
  "slots": {
    "site_name": { "content": "My International Website" },
    "navigation": { "file": "./templates/nav-template.md" },
    "footer": { "file": "./templates/footer-template.md" }
  }
}
```

#### Language-Specific Configurations

`configs/en-config.json`:

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

`configs/es-config.json`:

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

#### Generate Multi-Language Sites

```bash
# Generate English version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli site-template.md \
  --json configs/base-config.json \
  --json configs/en-config.json \
  --output dist/en/index.md

# Generate Spanish version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli site-template.md \
  --json configs/base-config.json \
  --json configs/es-config.json \
  --output dist/es/index.md

# Generate all languages
for lang in en es fr de; do
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli site-template.md \
    --json configs/base-config.json \
    --json "configs/${lang}-config.json" \
    --output "dist/${lang}/index.md" \
    --verbose
done
```

## Integration Examples

### NPM Scripts Integration

`package.json`:

```json
{
  "scripts": {
    "docs:build": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/template.md --json docs/config.json --output README.md",
    "docs:dev": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/template.md --json docs/dev-config.json --output README.md --verbose",
    "docs:watch": "chokidar 'docs/**/*.md' 'docs/**/*.json' -c 'npm run docs:dev'",
    "docs:all": "npm run docs:api && npm run docs:guide && npm run docs:readme",
    "docs:api": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/api-template.md --json docs/api-config.json --output docs/API.md",
    "docs:guide": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/guide-template.md --json docs/guide-config.json --output docs/GUIDE.md",
    "docs:readme": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/readme-template.md --json docs/readme-config.json --output README.md",
    "prebuild": "npm run docs:build",
    "postinstall": "npm run docs:build"
  }
}
```

### Makefile Integration

`Makefile`:

```makefile
.PHONY: docs clean watch help

# Variables
TEMPLATE_DIR := docs/templates
CONFIG_DIR := docs/configs
OUTPUT_DIR := docs/output
VERSION ?= dev
BUILD_DATE := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)

# Default target
docs: $(OUTPUT_DIR)/README.md $(OUTPUT_DIR)/API.md $(OUTPUT_DIR)/GUIDE.md

# Generate README
$(OUTPUT_DIR)/README.md: $(TEMPLATE_DIR)/readme-template.md $(CONFIG_DIR)/readme-config.json
	@mkdir -p $(OUTPUT_DIR)
	deno run -R -W jsr:@stefanlegg/markdown-slots/cli $< \
		--json $(CONFIG_DIR)/readme-config.json \
		--slot version="$(VERSION)" \
		--slot build_date="$(BUILD_DATE)" \
		--output $@ \
		--verbose

# Generate API documentation
$(OUTPUT_DIR)/API.md: $(TEMPLATE_DIR)/api-template.md $(CONFIG_DIR)/api-config.json
	@mkdir -p $(OUTPUT_DIR)
	deno run -R -W jsr:@stefanlegg/markdown-slots/cli $< \
		--json $(CONFIG_DIR)/api-config.json \
		--slot version="$(VERSION)" \
		--slot build_date="$(BUILD_DATE)" \
		--output $@ \
		--verbose

# Generate user guide
$(OUTPUT_DIR)/GUIDE.md: $(TEMPLATE_DIR)/guide-template.md $(CONFIG_DIR)/guide-config.json
	@mkdir -p $(OUTPUT_DIR)
	deno run -R -W jsr:@stefanlegg/markdown-slots/cli $< \
		--json $(CONFIG_DIR)/guide-config.json \
		--slot version="$(VERSION)" \
		--slot build_date="$(BUILD_DATE)" \
		--output $@ \
		--verbose

# Watch for changes
watch:
	@echo "Watching for changes..."
	@while true; do \
		inotifywait -r -e modify $(TEMPLATE_DIR) $(CONFIG_DIR) 2>/dev/null && \
		make docs; \
	done

# Clean generated files
clean:
	rm -rf $(OUTPUT_DIR)

# Show help
help:
	@echo "Available targets:"
	@echo "  docs    - Generate all documentation"
	@echo "  watch   - Watch for changes and regenerate"
	@echo "  clean   - Remove generated files"
	@echo "  help    - Show this help"
	@echo ""
	@echo "Variables:"
	@echo "  VERSION - Set version (default: dev)"
	@echo ""
	@echo "Example:"
	@echo "  make docs VERSION=1.2.0"
```

### GitHub Actions Integration

`.github/workflows/docs.yml`:

```yaml
name: Generate Documentation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to use in documentation'
        required: false
        default: 'dev'

jobs:
  generate-docs:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install markdown-slots
        run: npm install -g markdown-slots

      - name: Generate documentation
        run: |
          # Set version from input or use branch name
          VERSION="${{ github.event.inputs.version || github.ref_name }}"
          BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          COMMIT_SHA="${{ github.sha }}"

          # Generate main documentation
          deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/templates/readme-template.md \
            --json docs/configs/readme-config.json \
            --slot version="$VERSION" \
            --slot build_date="$BUILD_DATE" \
            --slot commit_sha="$COMMIT_SHA" \
            --output README.md \
            --verbose

          # Generate API documentation
          deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/templates/api-template.md \
            --json docs/configs/api-config.json \
            --slot version="$VERSION" \
            --slot build_date="$BUILD_DATE" \
            --output docs/API.md \
            --verbose

          # Generate user guide
          deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/templates/guide-template.md \
            --json docs/configs/guide-config.json \
            --slot version="$VERSION" \
            --slot build_date="$BUILD_DATE" \
            --output docs/GUIDE.md \
            --verbose

      - name: Check for changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "changed=true" >> $GITHUB_OUTPUT
          else
            echo "changed=false" >> $GITHUB_OUTPUT
          fi

      - name: Commit generated documentation
        if: steps.verify-changed-files.outputs.changed == 'true'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add README.md docs/API.md docs/GUIDE.md
          git commit -m "docs: auto-update documentation [skip ci]"
          git push

      - name: Upload documentation artifacts
        uses: actions/upload-artifact@v4
        with:
          name: documentation
          path: |
            README.md
            docs/API.md
            docs/GUIDE.md
```

### GitLab CI Integration

`.gitlab-ci.yml`:

```yaml
stages:
  - generate
  - deploy

variables:
  NODE_VERSION: '18'

generate-docs:
  stage: generate
  image: node:${NODE_VERSION}-alpine

  before_script:
    - npm install -g markdown-slots

  script:
    - |
        # Set variables
        VERSION=${CI_COMMIT_TAG:-$CI_COMMIT_REF_NAME}
        BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

        # Generate documentation
        deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/templates/readme-template.md \
          --json docs/configs/readme-config.json \
          --slot version="$VERSION" \
          --slot build_date="$BUILD_DATE" \
          --slot pipeline_id="$CI_PIPELINE_ID" \
          --slot commit_sha="$CI_COMMIT_SHA" \
          --output README.md \
          --verbose

        deno run -R -W jsr:@stefanlegg/markdown-slots/cli docs/templates/api-template.md \
          --json docs/configs/api-config.json \
          --slot version="$VERSION" \
          --slot build_date="$BUILD_DATE" \
          --output docs/API.md \
          --verbose

  artifacts:
    paths:
      - README.md
      - docs/API.md
      - docs/GUIDE.md
    expire_in: 1 week

  only:
    - main
    - develop
    - tags
```

## Best Practices

### 1. Organize Your Project Structure

```
project/
├── docs/
│   ├── templates/          # Reusable templates
│   ├── content/           # Content files
│   ├── configs/           # JSON configurations
│   └── output/            # Generated files
├── tools/
│   └── generate-docs.sh   # Build scripts
└── package.json           # NPM scripts
```

### 2. Use Meaningful Slot Names

```bash
# Good - descriptive names
--slot project_title="My Project"
--slot api_documentation=@docs/api.md
--slot installation_guide=@docs/install.md

# Avoid - unclear names
--slot title="My Project"
--slot content1=@docs/api.md
--slot stuff=@docs/install.md
```

### 3. Validate Configurations

```bash
# Validate JSON before use
python -m json.tool config.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"

# Test with minimal template
echo "Test: <!-- slot: test -->" > test-template.md
deno run -R -W jsr:@stefanlegg/markdown-slots/cli test-template.md --json config.json --slot test="validation"
```

### 4. Use Environment-Specific Configurations

```bash
# Development
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json dev-config.json --output dev-README.md

# Staging
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json staging-config.json --output staging-README.md

# Production
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json prod-config.json --output README.md
```

### 5. Version Control Best Practices

```gitignore
# .gitignore
docs/output/          # Generated files
*.generated.md        # Generated markdown files
temp-*.md            # Temporary files

# But keep
docs/templates/       # Templates
docs/configs/         # Configurations
docs/content/         # Source content
```

### 6. Use Verbose Mode for Debugging

```bash
# Always use verbose mode when debugging
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose 2>&1 | tee debug.log
```

### 7. Handle Errors Gracefully

```json
{
  "slots": { ... },
  "options": {
    "onMissingSlot": "ignore",
    "onFileError": "warn-empty"
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Template Not Found

```bash
# Error: Template file not found
# Solution: Check file path and permissions
ls -la template.md
deno run -R -W jsr:@stefanlegg/markdown-slots/cli ./path/to/template.md --slot test="value"
```

#### 2. JSON Syntax Errors

```bash
# Error: Invalid JSON
# Solution: Validate JSON syntax
python -m json.tool config.json
# or
jq empty config.json
```

#### 3. File References Not Found

```bash
# Warning: File not found
# Solution: Check file paths and use verbose mode
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@missing.md --verbose
```

#### 4. Circular Dependencies

```bash
# Error: Circular dependency detected
# Solution: Review file structure and remove circular references
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose
```

### Debug Workflow

1. **Start simple**: Test with minimal template and configuration
2. **Use verbose mode**: Always use `--verbose` when debugging
3. **Validate inputs**: Check JSON syntax and file existence
4. **Test incrementally**: Add complexity step by step
5. **Check permissions**: Ensure files are readable and directories writable

### Getting Help

- Check the [main documentation](../README.md)
- Review [API documentation](../docs/API.md)
- Look at other [examples](../examples/)
- Use `--help` flag for quick reference
- Enable `--verbose` for detailed processing information

---

This comprehensive guide covers most CLI usage scenarios. For more specific use cases or advanced programmatic usage, refer to the API documentation and other example files.
