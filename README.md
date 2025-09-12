# Markdown Slots

[![CI](https://img.shields.io/badge/CI-passing-brightgreen.svg)](#)
[![JSR](https://jsr.io/badges/@stefanlegg/markdown-slots)](https://jsr.io/@stefanlegg/markdown-slots)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](#)
[![Deno](https://img.shields.io/badge/Deno-1.40+-green.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful and flexible TypeScript library for composing markdown content with slot-based templating. Build modular, reusable markdown documents with dynamic content generation, file inclusion, and robust error handling.

## ✨ Features

- **🔧 Slot-based composition**: Use `<!-- outlet: name -->` markers to define content slots
- **📁 Multiple source types**: Content strings, file paths, and async functions
- **🔄 Nested compositions**: Unlimited nesting with circular dependency detection
- **⚡ Performance optimized**: Optional caching and parallel processing
- **🛡️ Error resilient**: Configurable error handling strategies
- **🎯 TypeScript first**: Full type safety and IntelliSense support
- **🚀 Zero dependencies**: Lightweight and fast

## 📦 Installation

```bash
# For Deno with JSR
import { composeMarkdown } from 'jsr:@stefanlegg/markdown-slots';

# Or from source
import { composeMarkdown } from 'https://deno.land/x/markdown_slots/mod.ts';
```

## 🚀 Quick Start

```typescript
import { composeMarkdown } from './src/mod.ts';

// Basic slot replacement
const result = await composeMarkdown({
  content: `# Welcome

<!-- outlet: greeting -->

<!-- outlet: content -->`,
  slots: {
    greeting: { content: 'Hello, World!' },
    content: { content: 'This is dynamically inserted content.' },
  },
});

console.log(result.markdown);
// Output:
// # Welcome
//
// Hello, World!
//
// This is dynamically inserted content.
```

## 📖 Table of Contents

- [Core Concepts](#-core-concepts)
- [CLI Usage](#-cli-usage)
- [API Reference](#-api-reference)
- [Examples](#-examples)
- [Error Handling](#-error-handling)
- [Performance](#-performance)
- [Advanced Usage](#-advanced-usage)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🖥️ CLI Usage

The Markdown Slots CLI provides a convenient way to compose markdown files without writing code. It supports both inline content and file-based slots, with flexible configuration options.

### Installation and Basic Usage

```bash
# Run directly from JSR (no installation needed)
deno run -A jsr:@stefanlegg/markdown-slots/cli --help

# Or run from source URL
deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts --help

# Create an alias for convenience
alias markdown-slots="deno run -A jsr:@stefanlegg/markdown-slots/cli"

# Or install globally with deno install
deno install -A --name markdown-slots jsr:@stefanlegg/markdown-slots/cli

# Then use like any other command
markdown-slots --help
```

### Command Syntax

```bash
# Direct JSR usage
deno run -A jsr:@stefanlegg/markdown-slots/cli compose <template> [options]

# With alias or installed command
markdown-slots compose <template> [options]

# Short form (compose command is optional)
markdown-slots <template> [options]
```

### Basic Examples

#### Inline Slots

```bash
# Using long flags
deno run -A jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="My Document" \
  --slot author="John Doe" \
  --slot version="1.0.0"

# Using short flags
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md \
  -s title="My Document" \
  -s author="John Doe" \
  -s version="1.0.0"

# With installed command
markdown-slots template.md \
  -s title="My Document" \
  -s author="John Doe" \
  -s version="1.0.0"
```

#### File-Based Slots

```bash
# Reference external files with @ prefix
deno run -A jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot content=@./content/main.md \
  --slot footer=@./shared/footer.md \
  --output result.md

# Short flags work too
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md \
  -s content=@./content/main.md \
  -s footer=@./shared/footer.md \
  -o result.md

# With installed command
markdown-slots template.md \
  -s content=@./content/main.md \
  -s footer=@./shared/footer.md \
  -o result.md
```

#### Mixed Content Sources

```bash
# Combine inline content and file references
deno run -A jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Mixed Example" \
  --slot description=@intro.md \
  --slot author="Jane Smith" \
  --slot features=@features.md \
  --output documentation.md \
  --verbose
```

### CLI Options

| Option              | Short | Description             | Example                   |
| ------------------- | ----- | ----------------------- | ------------------------- |
| `--slot name=value` | `-s`  | Define slot content     | `--slot title="My Title"` |
| `--slot name=@file` | `-s`  | Define slot from file   | `--slot content=@file.md` |
| `--json <config>`   | `-j`  | Load JSON configuration | `--json config.json`      |
| `--output <file>`   | `-o`  | Output to file          | `--output result.md`      |
| `--verbose`         | `-v`  | Verbose output          | `--verbose`               |
| `--help`            | `-h`  | Show help               | `--help`                  |

### JSON Configuration

For complex compositions, use JSON configuration files that support the full range of slot sources and composition options.

#### Basic JSON Configuration

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

#### Advanced JSON Configuration with Nesting

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

#### JSON Configuration Options

The `options` section supports all programmatic API options:

| Option          | Type                            | Default        | Description                       |
| --------------- | ------------------------------- | -------------- | --------------------------------- |
| `resolveFrom`   | `'cwd' \| 'file'`               | `'cwd'`        | Base for resolving relative paths |
| `onMissingSlot` | `'error' \| 'ignore' \| 'keep'` | `'keep'`       | How to handle missing slots       |
| `onFileError`   | `'throw' \| 'warn-empty'`       | `'warn-empty'` | How to handle file read errors    |
| `parallel`      | `boolean`                       | `false`        | Enable parallel file processing   |
| `maxDepth`      | `number`                        | `10`           | Maximum composition nesting depth |

#### Using JSON Configuration

```bash
# Load configuration from JSON file
deno run -A jsr:@stefanlegg/markdown-slots/cli compose template.md --json config.json

# Override specific slots from command line (CLI takes precedence)
deno run -A jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --json config.json \
  --slot title="Override Title" \
  --slot version="2.0.0"

# Multiple JSON files (later files override earlier ones)
markdown-slots compose template.md \
  --json base-config.json \
  --json environment-config.json
```

### Real-World Examples

#### Documentation Generation

```bash
# Generate README from template
deno run -A jsr:@stefanlegg/markdown-slots/cli compose README.template.md \
  --slot project_name="My Project" \
  --slot version="1.0.0" \
  --slot description=@docs/description.md \
  --slot installation=@docs/installation.md \
  --slot usage=@docs/usage.md \
  --output README.md

# Or with installed command
markdown-slots compose README.template.md \
  --slot project_name="My Project" \
  --slot version="1.0.0" \
  --slot description=@docs/description.md \
  --slot installation=@docs/installation.md \
  --slot usage=@docs/usage.md \
  --output README.md
```

#### Blog Post Creation

```bash
# Create blog post from template
deno run -A jsr:@stefanlegg/markdown-slots/cli compose blog-template.md \
  --slot title="Getting Started with Markdown Slots" \
  --slot author="Jane Developer" \
  --slot date="2024-01-15" \
  --slot content=@posts/getting-started.md \
  --slot tags="markdown, cli, documentation" \
  --output blog/2024-01-15-getting-started.md
```

#### Multi-Language Documentation

```bash
# English version
deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs-template.md \
  --json configs/base-config.json \
  --slot language="en" \
  --slot content=@content/en/user-guide.md \
  --output docs/en/user-guide.md

# Spanish version
deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs-template.md \
  --json configs/base-config.json \
  --slot language="es" \
  --slot content=@content/es/user-guide.md \
  --output docs/es/user-guide.md
```

### Integration with Build Systems

#### Deno Tasks

Create a `deno.json` file with tasks:

```json
{
  "tasks": {
    "docs:build": "deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs/template.md --json docs/config.json --output README.md",
    "docs:dev": "deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs/template.md --json docs/dev-config.json --output README.md",
    "docs:watch": "deno run -A --watch docs/ jsr:@stefanlegg/markdown-slots/cli compose docs/template.md --json docs/config.json --output README.md"
  }
}
```

Then run with:

```bash
# Build documentation
deno task docs:build

# Development mode
deno task docs:dev

# Watch mode (rebuilds on file changes)
deno task docs:watch
```

#### Makefile Integration

```makefile
docs: README.md

README.md: docs/template.md docs/config.json
	deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs/template.md \
		--json docs/config.json \
		--slot build_date="$(shell date)" \
		--slot version="$(VERSION)" \
		--output README.md
```

#### GitHub Actions

```yaml
- name: Setup Deno
  uses: denoland/setup-deno@v1
  with:
    deno-version: v1.x

- name: Generate Documentation
  run: |
    deno run -A jsr:@stefanlegg/markdown-slots/cli compose docs/template.md \
      --json docs/config.json \
      --slot version="${{ github.ref_name }}" \
      --slot commit="${{ github.sha }}" \
      --output README.md
```

### Deno Permissions and Security

Deno requires explicit permissions for file system access. The CLI needs:

- `--allow-read`: To read template files, content files, and JSON configurations
- `--allow-write`: To write output files (optional if outputting to stdout)

#### Permission Examples

```bash
# Minimal permissions for reading only (output to stdout)
deno run --allow-read jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test"

# Full permissions for reading and writing files (recommended)
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test" --output result.md

# Restrict permissions to specific directories
deno run --allow-read=./docs,./content --allow-write=./output jsr:@stefanlegg/markdown-slots/cli docs/template.md --output output/result.md
```

#### Deno Installation Best Practices

```bash
# Install with full permissions (recommended)
deno install -A --name markdown-slots jsr:@stefanlegg/markdown-slots/cli

# Install with restricted permissions (safer)
deno install --allow-read=. --allow-write=. --name markdown-slots-local jsr:@stefanlegg/markdown-slots/cli

# Create project-specific script
echo '#!/usr/bin/env -S deno run -A' > markdown-slots.ts
echo 'import "jsr:@stefanlegg/markdown-slots/cli";' >> markdown-slots.ts
chmod +x markdown-slots.ts
```

### Cross-Platform Compatibility

The CLI works consistently across all platforms:

```bash
# Unix/Linux/macOS (forward slashes work everywhere)
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@./content/file.md

# Windows (both styles work)
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@.\content\file.md
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@./content/file.md
```

## 🎯 Core Concepts

### Outlets

Outlets are placeholders in your markdown content marked with HTML comments:

```markdown
<!-- outlet: slot-name -->
```

### Slot Sources

Slots can be filled from three types of sources:

1. **Content**: Direct string content
2. **File**: Path to a markdown file
3. **Function**: Async function that returns content

```typescript
const slots = {
  // Content source
  title: { content: '# My Title' },

  // File source
  introduction: { file: './intro.md' },

  // Function source
  timestamp: () => Promise.resolve(new Date().toISOString()),
};
```

### Nested Composition

Slots can contain their own slots, enabling powerful nested compositions:

```typescript
const result = await composeMarkdown({
  content: '<!-- outlet: header -->\n\n<!-- outlet: body -->',
  slots: {
    header: {
      content: '# <!-- outlet: title -->',
      slots: {
        title: { content: 'My Document' },
      },
    },
    body: { file: './content.md' },
  },
});
```

## 📚 API Reference

### `composeMarkdown(node, options?)`

Main function to compose markdown content.

**Parameters:**

- `node: MarkdownNode` - The root node to compose
- `options?: ComposeOptions` - Optional configuration

**Returns:** `Promise<ComposeResult>`

### Types

#### `MarkdownNode`

```typescript
interface MarkdownNode {
  content?: string; // Direct markdown content
  file?: string; // Path to markdown file
  slots?: Record<string, MarkdownSlotSource>; // Slot definitions
}
```

#### `MarkdownSlotSource`

```typescript
type MarkdownSlotSource =
  | { content: string } // Direct content
  | { file: string } // File path
  | (() => Promise<string>) // Async function
  | MarkdownNode; // Nested node
```

#### `ComposeOptions`

```typescript
interface ComposeOptions {
  maxDepth?: number; // Maximum nesting depth (default: 10)
  onMissingSlot?: 'error' | 'ignore' | 'keep'; // Missing slot handling (default: 'keep')
  onFileError?: 'throw' | 'warn-empty'; // File error handling (default: 'warn-empty')
  resolveFrom?: 'cwd' | 'file'; // Path resolution base (default: 'cwd')
  parallel?: boolean; // Enable parallel processing (default: false)
  cache?: Map<string, string>; // Optional file content cache
}
```

#### `ComposeResult`

```typescript
interface ComposeResult {
  markdown: string; // Composed markdown content
  errors?: ComposeError[]; // Any errors encountered
}
```

## 🔧 Examples

### Basic Usage

```typescript
// Run: deno run --allow-read examples/basic-usage.ts
```

See [examples/basic-usage.ts](examples/basic-usage.ts) for comprehensive basic examples.

### File-Based Composition

```typescript
// Run: deno run --allow-read --allow-write examples/file-based.ts
```

See [examples/file-based.ts](examples/file-based.ts) for file-based composition examples.

### Advanced Features

```typescript
// Run: deno run --allow-read --allow-write examples/advanced.ts
```

See [examples/advanced.ts](examples/advanced.ts) for advanced features like circular dependency detection, depth limiting, and parallel processing.

### CLI Usage

See the comprehensive CLI usage guides:

- [Basic CLI Usage](examples/cli-basic-usage.md) - Getting started with the CLI
- [Advanced CLI Scenarios](examples/cli-advanced-scenarios.md) - Complex use cases and edge cases
- [JSON Configuration Guide](examples/cli-json-config.md) - Using JSON configuration files
- [Cross-Platform Usage](examples/cli-cross-platform.md) - Platform-specific considerations
- [Comprehensive CLI Guide](examples/cli-comprehensive-usage.md) - Complete CLI reference with real-world examples

## 🛡️ Error Handling

Markdown Slots provides flexible error handling strategies:

### Missing Slots

- `'error'`: Throw an error when a slot is missing
- `'ignore'`: Remove the outlet marker and continue
- `'keep'`: Keep the outlet marker in the output (default)

### File Errors

- `'throw'`: Throw an error when a file cannot be read
- `'warn-empty'`: Insert empty content and add error to results (default)

```typescript
const result = await composeMarkdown(node, {
  onMissingSlot: 'ignore',
  onFileError: 'warn-empty',
});

// Check for errors
if (result.errors) {
  console.log('Errors encountered:', result.errors);
}
```

## ⚡ Performance

### Caching

Enable caching to avoid re-reading files:

```typescript
const cache = new Map<string, string>();

const result = await composeMarkdown(node, { cache });
// Subsequent calls will use cached content
```

### Parallel Processing

Enable parallel processing for better performance with multiple files:

```typescript
const result = await composeMarkdown(node, { parallel: true });
```

### Depth Limiting

Prevent runaway compositions with depth limiting:

```typescript
const result = await composeMarkdown(node, { maxDepth: 5 });
```

## 🔬 Advanced Usage

### Circular Dependency Detection

Automatic detection and prevention of circular dependencies:

```typescript
// This will be detected and handled gracefully
const circular = {
  file: 'a.md', // Contains: <!-- outlet: b -->
  slots: {
    b: {
      file: 'b.md', // Contains: <!-- outlet: a -->
      slots: {
        a: { file: 'a.md' }, // Circular!
      },
    },
  },
};
```

### Dynamic Content Generation

```typescript
const result = await composeMarkdown({
  content: 'Generated at: <!-- outlet: timestamp -->',
  slots: {
    timestamp: async () => {
      // Simulate API call or computation
      await new Promise((resolve) => setTimeout(resolve, 100));
      return new Date().toISOString();
    },
  },
});
```

### Code Block Preservation

Outlets inside code blocks are automatically preserved:

````markdown
```typescript
// This outlet will NOT be replaced:
// outlet: example -->
```

<!-- This outlet WILL be replaced -->
<!-- outlet: real-content -->
````

## 🧪 Testing

```bash
# Run all tests
deno task test

# Run specific test file
deno task test tests/compose_test.ts

# Run with coverage
deno task test --coverage

# Type checking
deno task check

# Linting
deno task lint

# Formatting
deno task fmt
```

## 🔧 Troubleshooting

### Common CLI Issues

#### Template File Not Found

**Error:** `Error: Template file not found: template.md`

**Solutions:**

- Check that the template file exists and the path is correct
- Use absolute paths or ensure you're in the correct directory
- Verify file permissions allow reading

```bash
# Check if file exists
ls -la template.md

# Use absolute path
deno run -A jsr:@stefanlegg/markdown-slots/cli /full/path/to/template.md --slot title="Test"
```

#### Invalid Slot Format

**Error:** `Error: Invalid slot format. Expected name=value or name=@file.md`

**Solutions:**

- Ensure slot definitions follow the correct format
- Use quotes for values containing spaces
- Use `@` prefix for file references

```bash
# Correct formats
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot title="My Title"
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@file.md

# Incorrect formats (will cause errors)
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot "title=My Title"  # Wrong quotes
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot title=My Title   # Missing quotes for spaces
```

#### JSON Configuration Errors

**Error:** `Error: Invalid JSON in configuration file`

**Solutions:**

- Validate JSON syntax using a JSON validator
- Check for trailing commas, missing quotes, or unclosed brackets
- Use a JSON formatter to identify syntax issues

```bash
# Validate JSON syntax
python -m json.tool config.json > /dev/null && echo "Valid" || echo "Invalid"

# Or use jq if available
jq empty config.json && echo "Valid JSON" || echo "Invalid JSON"
```

#### File Reference Not Found

**Error:** `Warning: File not found: ./content/missing.md`

**Solutions:**

- Verify the referenced file exists
- Check file paths are relative to the correct base directory
- Use the `--verbose` flag to see detailed path resolution

```bash
# Check file exists
ls -la ./content/missing.md

# Use verbose mode to debug paths
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@./content/file.md --verbose
```

#### Permission Denied

**Error:** `Error: Permission denied: cannot read template.md`

**Solutions:**

- Check file permissions
- Ensure you have read access to the template and referenced files
- Run with appropriate permissions if needed

```bash
# Check permissions
ls -la template.md

# Fix permissions if needed
chmod 644 template.md
```

#### Output File Cannot Be Written

**Error:** `Error: Cannot write to output file: /protected/path/result.md`

**Solutions:**

- Ensure the output directory exists and is writable
- Check permissions on the target directory
- Use a different output location

```bash
# Create output directory
mkdir -p output/

# Check directory permissions
ls -la output/

# Use writable location
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot title="Test" --output ./result.md
```

### Common Composition Issues

#### Circular Dependencies

**Error:** `Error: Circular dependency detected: a.md -> b.md -> a.md`

**Solutions:**

- Review your file structure to identify circular references
- Restructure templates to avoid circular dependencies
- Use content slots instead of file references where appropriate

```bash
# Debug with verbose mode
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose
```

#### Maximum Depth Exceeded

**Error:** `Error: Maximum composition depth exceeded`

**Solutions:**

- Review deeply nested structures
- Increase max depth in JSON configuration if needed
- Simplify the composition structure

```json
{
  "slots": { ... },
  "options": {
    "maxDepth": 20
  }
}
```

#### Outlets Not Being Replaced

**Issue:** Outlet markers remain in the output

**Solutions:**

- Check outlet marker syntax: `<!-- outlet: name -->`
- Ensure slot names match exactly (case-sensitive)
- Verify outlets are not inside code blocks
- Use `--verbose` to see which slots are being processed

```bash
# Debug slot processing
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot test="value" --verbose
```

#### Code Blocks Being Processed

**Issue:** Outlets inside code blocks are being replaced

**Solutions:**

- This should not happen - outlets in code blocks are preserved
- If it occurs, check that code blocks are properly formatted
- Ensure code blocks use triple backticks or proper indentation

````markdown
```markdown
<!-- outlet: this_should_not_be_replaced -->
```

<!-- outlet: this_will_be_replaced -->
````

### Performance Issues

#### Slow Composition with Many Files

**Solutions:**

- Enable parallel processing in JSON configuration
- Use caching for repeated file access
- Consider breaking large compositions into smaller parts

```json
{
  "slots": { ... },
  "options": {
    "parallel": true
  }
}
```

#### Memory Issues with Large Files

**Solutions:**

- Process large documents in smaller chunks
- Avoid deeply nested compositions with large files
- Use file references instead of inline content for large sections

### Platform-Specific Issues

#### Windows Path Issues

**Issue:** File paths not resolving correctly on Windows

**Solutions:**

- Use forward slashes (work on all platforms)
- Avoid hard-coded path separators
- Use relative paths when possible

```bash
# Works on all platforms
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@./content/file.md

# Windows-specific (less portable)
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@.\content\file.md
```

#### Line Ending Issues

**Issue:** Unexpected line endings in output

**Solutions:**

- The CLI preserves line endings from source files
- Convert files to consistent line endings before processing if needed
- Use `.gitattributes` to manage line endings in version control

```bash
# Convert line endings if needed (Unix)
dos2unix input-file.md

# Convert line endings (Windows)
unix2dos input-file.md
```

### Debugging Tips

#### Use Verbose Mode

Always use `--verbose` or `-v` when debugging issues:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose
```

This shows:

- File paths being resolved
- Slots being processed
- Errors and warnings
- Processing steps

#### Test Incrementally

Build complex compositions step by step:

```bash
# Test basic template first
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot simple="test"

# Add one slot at a time
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --slot simple="test" --slot another="value"

# Test JSON config with minimal slots
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --json minimal-config.json
```

#### Validate Configurations

Check JSON configurations before use:

```bash
# Create a minimal test template
echo "Test: <!-- outlet: test -->" > test-template.md

# Test your configuration
deno run -A jsr:@stefanlegg/markdown-slots/cli test-template.md --json your-config.json --slot test="validation"
```

#### Check File Paths

Verify all referenced files exist:

```bash
# List all files referenced in your config
grep -r "file.*:" config.json

# Check if files exist
find . -name "*.md" -type f
```

### Getting Help

If you encounter issues not covered here:

1. **Check the examples**: Look at the [examples directory](examples/) for similar use cases
2. **Use verbose mode**: Run with `--verbose` to get detailed information
3. **Validate your setup**: Test with minimal configurations first
4. **Check file permissions**: Ensure all files are readable
5. **Review the documentation**: Check the [API documentation](docs/API.md) for programmatic usage

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/example/markdown-slots.git
cd markdown-slots

# Run tests
deno task test

# Run examples
deno run --allow-read examples/basic-usage.ts
```

### Project Structure

```
src/
├── mod.ts              # Main export
├── compose.ts          # Main API function
├── composition-engine.ts # Core composition logic
├── parser.ts           # Content parsing
├── filesystem.ts       # File system operations
├── dependency-tracker.ts # Circular dependency detection
└── types.ts            # Type definitions

tests/
├── compose_test.ts     # Main API tests
├── composition-engine_test.ts # Engine tests
├── parser_test.ts      # Parser tests
├── filesystem_test.ts  # File system tests
└── dependency-tracker_test.ts # Dependency tests

examples/
├── basic-usage.ts      # Basic examples
├── file-based.ts       # File-based examples
├── advanced.ts         # Advanced features
└── cli-example.ts      # CLI implementation
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by template engines and static site generators
- Built with [Deno](https://deno.land/) and TypeScript
- Tested with Deno's built-in test runner

---

**Made with ❤️ by the Markdown Slots team**
