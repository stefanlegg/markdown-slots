# CLI Basic Usage Examples

This document demonstrates basic CLI usage patterns for the Markdown Slots CLI tool.

## Installation

```bash
# Run directly from JSR (no installation needed)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli --help

# Or install globally with deno install
deno install -R -W --name markdown-slots jsr:@stefanlegg/markdown-slots/cli
```

## Basic Template Composition

### Simple Inline Slots

Create a template file:

```markdown
<!-- template.md -->

# <!-- slot: title -->

Welcome to <!-- slot: project_name -->!

## About

<!-- slot: description -->

## Contact

Email: <!-- slot: email -->
```

Compose with inline content using long flags:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="My Awesome Project" \
  --slot project_name="Markdown Slots" \
  --slot description="A powerful tool for composing Markdown files" \
  --slot email="contact@example.com"
```

Same composition using short flags:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  -s title="My Awesome Project" \
  -s project_name="Markdown Slots" \
  -s description="A powerful tool for composing Markdown files" \
  -s email="contact@example.com"
```

### File-Based Slots

Create content files:

```markdown
<!-- intro.md -->

This is a comprehensive introduction to our project.

It includes **markdown formatting** and [links](https://example.com).
```

```markdown
<!-- features.md -->

## Key Features

- Easy to use CLI interface
- Support for nested compositions
- File and inline content mixing
- Cross-platform compatibility
```

Compose using file references:

```bash
# Using long flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Documentation" \
  --slot description=@intro.md \
  --slot features=@features.md

# Using short flags
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  -s title="Documentation" \
  -s description=@intro.md \
  -s features=@features.md
```

### Mixed Content Sources

Combine inline content and file references:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Mixed Content Example" \
  --slot description=@intro.md \
  --slot email="support@example.com" \
  --slot features="Simple inline feature list"
```

## Output Options

### Output to File

```bash
# Long flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="My Project" \
  --output result.md

# Short flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  -s title="My Project" \
  -o result.md
```

### Verbose Output

Get detailed information about the composition process:

```bash
# Long flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Debug Example" \
  --verbose

# Short flag
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md \
  -s title="Debug Example" \
  -v
```

### Combined Output Options

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Combined Example" \
  --slot description=@intro.md \
  --output final-result.md \
  --verbose
```

## Help and Documentation

```bash
# Show help
deno run -R -W jsr:@stefanlegg/markdown-slots/cli --help
deno run -R -W jsr:@stefanlegg/markdown-slots/cli -h

# Help works with any combination
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose --help
deno run -R -W jsr:@stefanlegg/markdown-slots/cli --help --verbose
```

## Common Patterns

### Documentation Generation

```bash
# Generate README from template
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose README.template.md \
  --slot project_name="My Project" \
  --slot version="1.0.0" \
  --slot description=@docs/description.md \
  --slot installation=@docs/installation.md \
  --slot usage=@docs/usage.md \
  --output README.md
```

### Blog Post Creation

```bash
# Create blog post from template
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose blog-template.md \
  --slot title="My Blog Post" \
  --slot author="John Doe" \
  --slot date="2024-01-15" \
  --slot content=@posts/my-post-content.md \
  --slot tags="tech, markdown, tools" \
  --output blog/my-blog-post.md
```

### Multi-language Documentation

```bash
# English version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs-template.md \
  --slot title="User Guide" \
  --slot content=@content/en/user-guide.md \
  --output docs/en/user-guide.md

# Spanish version
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs-template.md \
  --slot title="Guía del Usuario" \
  --slot content=@content/es/user-guide.md \
  --output docs/es/user-guide.md
```

## Error Handling

The CLI handles errors gracefully and provides helpful messages:

```bash
# Missing template file
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose non-existent.md
# Output: Error with suggestion to check file path

# Invalid slot format
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot invalid_format
# Output: Error explaining expected format

# Missing file reference
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@missing.md
# Output: Composition completes with warning about missing file
```

## Tips and Best Practices

1. **Use short flags for quick compositions**: `-s`, `-o`, `-v`, `-j`, `-h`
2. **Combine flags**: Mix long and short flags as needed
3. **File references**: Use `@filename.md` syntax for file-based content
4. **Verbose mode**: Use `-v` when debugging composition issues
5. **Help is always available**: Use `-h` or `--help` anytime
6. **Template-first**: You can omit the `compose` command for simpler syntax
