# Design Document

## Overview

The Markdown Slots library implements a slot/outlet composition pattern for Markdown files. The system uses HTML comment markers (`<!-- outlet: NAME -->`) as insertion points that can be filled with content from various sources. The library is developed in Deno for optimal developer experience and compiled to Node.js for distribution.

### Key Design Principles

- **Safety First**: Circular dependency detection and depth limiting prevent infinite loops
- **Flexible Sources**: Support files, strings, functions, and recursive compositions
- **Performance**: Parallel file reading and optional caching for efficiency
- **Error Resilience**: Configurable error handling with detailed reporting
- **Developer Experience**: Full TypeScript support with clear APIs and intuitive CLI
- **Universal Access**: Both programmatic API and command-line interface for different workflows

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Public API    │    │  Composition    │    │  File System    │
│                 │    │     Engine      │    │    Adapter      │
│ composeMarkdown │───▶│                 │───▶│                 │
│   MarkdownNode  │    │ - Recursion     │    │ - File Reading  │
│ ComposeOptions  │    │ - Slot Filling  │    │ - Path Resolve  │
│ ComposeResult   │    │ - Error Handle  │    │ - Caching       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │
         │                       ▼
┌─────────────────┐    ┌─────────────────┐
│   CLI Interface │    │  Content Parser │
│                 │    │                 │
│ - Arg Parsing   │    │ - Outlet Detect │
│ - Config Load   │    │ - Code Block    │
│ - Output Handle │    │   Protection    │
│ - Error Format  │    │ - Safe Replace  │
└─────────────────┘    └─────────────────┘
```

### Data Flow

#### Programmatic API Flow

1. **Input Validation**: Validate MarkdownNode structure and options
2. **Content Resolution**: Load base content from file or direct content
3. **Outlet Detection**: Parse content to find outlet markers outside code blocks
4. **Slot Processing**: Resolve each slot source (file, content, function, nested)
5. **Recursive Composition**: Handle nested MarkdownNode structures
6. **Content Assembly**: Replace outlets with resolved slot content
7. **Result Generation**: Return composed markdown with any errors

#### CLI Flow

1. **Argument Parsing**: Parse command line arguments and flags
2. **Configuration Loading**: Load JSON config if provided, merge with CLI flags
3. **Template Resolution**: Resolve template file path and validate existence
4. **Slot Preparation**: Convert CLI slots to MarkdownSlotSource format
5. **API Delegation**: Call programmatic API with prepared inputs
6. **Output Handling**: Write result to file or stdout with error formatting

## Components and Interfaces

### Type Definitions

```typescript
// Core types for slot sources
export type MarkdownSlotSource =
  | { file: string }
  | { content: string }
  | (() => string | Promise<string>)
  | MarkdownNode;

// Node definition with file or content backing
export type MarkdownNode =
  | { file: string; slots?: Record<string, MarkdownSlotSource> }
  | { content: string; slots?: Record<string, MarkdownSlotSource> };

// Configuration options
export interface ComposeOptions {
  basePath?: string;
  resolveFrom?: 'cwd' | 'file';
  maxDepth?: number;
  onMissingSlot?: 'error' | 'ignore' | 'keep';
  onFileError?: 'throw' | 'warn-empty';
  cache?: Map<string, string>;
  parallel?: boolean;
}

// Result with error reporting
export interface ComposeResult {
  markdown: string;
  errors?: Array<{
    type: 'missing-slot' | 'file-error' | 'max-depth' | 'circular-dependency';
    message: string;
    path?: string;
  }>;
}

// CLI-specific types
export interface CliOptions {
  template: string;
  slots: Record<string, string>;
  json?: string;
  output?: string;
  verbose?: boolean;
  help?: boolean;
}

export interface JsonConfig {
  slots?: Record<string, MarkdownSlotSource>;
  options?: Partial<ComposeOptions>;
}
```

### Core Composition Engine

The main composition engine handles the recursive processing of MarkdownNode structures:

```typescript
class CompositionEngine {
  private visitedFiles = new Set<string>();
  private currentDepth = 0;
  private errors: ComposeError[] = [];

  async compose(node: MarkdownNode, options: ComposeOptions): Promise<ComposeResult> {
    // 1. Validate input and initialize state
    // 2. Load base content (file or direct)
    // 3. Process slots if present
    // 4. Return result with errors
  }

  private async processSlots(
    content: string,
    slots: Record<string, MarkdownSlotSource>,
    options: ComposeOptions,
  ): Promise<string> {
    // 1. Find all outlets in content (excluding code blocks)
    // 2. Resolve slot sources in parallel if enabled
    // 3. Replace outlets with resolved content
    // 4. Handle missing slots per configuration
  }
}
```

### File System Adapter

Abstracts file operations for cross-platform compatibility:

```typescript
interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  resolvePath(path: string, base?: string): string;
}

// Deno implementation
class DenoFileSystem implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }

  resolvePath(path: string, base?: string): string {
    return resolve(base || Deno.cwd(), path);
  }
}

// Node.js implementation (generated by dnt)
class NodeFileSystem implements FileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return await readFile(path, 'utf-8');
  }

  resolvePath(path: string, base?: string): string {
    return resolve(base || process.cwd(), path);
  }
}
```

### Content Parser

Handles outlet detection and safe replacement:

````typescript
class ContentParser {
  private static OUTLET_REGEX = /<!-- outlet:(\w+) -->/g;

  findOutlets(content: string): Array<{ name: string; position: number }> {
    // Split content by code blocks to avoid processing outlets inside them
    const parts = this.splitByCodeBlocks(content);
    const outlets: Array<{ name: string; position: number }> = [];

    parts.forEach((part, index) => {
      if (index % 2 === 0) { // Only process non-code-block parts
        // Find outlets in this part and adjust positions
      }
    });

    return outlets;
  }

  replaceOutlets(
    content: string,
    replacements: Record<string, string>,
  ): string {
    const parts = this.splitByCodeBlocks(content);

    return parts.map((part, index) => {
      if (index % 2 === 1) return part; // Preserve code blocks

      return part.replace(
        ContentParser.OUTLET_REGEX,
        (match, name) => replacements[name] ?? match,
      );
    }).join('');
  }

  private splitByCodeBlocks(content: string): string[] {
    return content.split(/(```[\s\S]*?```|`[^`\n]*`)/);
  }
}
````

### CLI Interface

The command-line interface provides an intuitive way to use the library without writing code:

```typescript
class CliInterface {
  async run(args: string[]): Promise<void> {
    try {
      const options = this.parseArguments(args);

      if (options.help) {
        this.showHelp();
        return;
      }

      const config = await this.loadConfiguration(options);
      const result = await this.compose(config);
      await this.handleOutput(result, options);
    } catch (error) {
      this.handleError(error, options.verbose);
      Deno.exit(1);
    }
  }

  private parseArguments(args: string[]): CliOptions {
    // Parse command line arguments using a lightweight argument parser
    // Support: --slot/-s name=value, --json/-j config.json, --output/-o file.md, --verbose/-v, --help/-h
  }

  private async loadConfiguration(options: CliOptions): Promise<MarkdownNode> {
    // 1. Load JSON config if provided
    // 2. Parse CLI slot values (handle @file.md syntax)
    // 3. Merge JSON and CLI slots (CLI takes precedence)
    // 4. Build MarkdownNode structure
  }
}
```

### Argument Parser

Handles command-line argument parsing with support for various flag formats:

```typescript
class ArgumentParser {
  parse(args: string[]): CliOptions {
    const options: CliOptions = {
      template: '',
      slots: {},
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'compose':
          options.template = args[++i];
          break;
        case '--slot':
        case '-s':
          const slotDef = args[++i];
          const [name, value] = slotDef.split('=', 2);
          options.slots[name] = value;
          break;
        case '--json':
        case '-j':
          options.json = args[++i];
          break;
        case '--output':
        case '-o':
          options.output = args[++i];
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }

    return options;
  }
}
```

### Configuration Loader

Handles loading and merging of JSON configuration with CLI arguments:

```typescript
class ConfigurationLoader {
  async load(options: CliOptions): Promise<MarkdownNode> {
    let jsonConfig: JsonConfig = {};

    // Load JSON configuration if provided
    if (options.json) {
      const configPath = resolve(options.json);
      const configContent = await Deno.readTextFile(configPath);
      jsonConfig = JSON.parse(configContent);
    }

    // Convert CLI slots to MarkdownSlotSource format
    const cliSlots = await this.parseCliSlots(options.slots);

    // Merge configurations (CLI takes precedence)
    const mergedSlots = { ...jsonConfig.slots, ...cliSlots };

    return {
      file: resolve(options.template),
      slots: mergedSlots,
    };
  }

  private async parseCliSlots(
    slots: Record<string, string>,
  ): Promise<Record<string, MarkdownSlotSource>> {
    const result: Record<string, MarkdownSlotSource> = {};

    for (const [name, value] of Object.entries(slots)) {
      if (value.startsWith('@')) {
        // File reference
        const filepath = value.slice(1);
        result[name] = { file: resolve(filepath) };
      } else {
        // Literal content
        result[name] = { content: value };
      }
    }

    return result;
  }
}
```

### Output Handler

Manages output formatting and destination:

````typescript
class OutputHandler {
  async handle(result: ComposeResult, options: CliOptions): Promise<void> {
    // Handle errors first
    if (result.errors && result.errors.length > 0) {
      this.formatErrors(result.errors, options.verbose);
    }

    // Write output
    if (options.output) {
      await Deno.writeTextFile(resolve(options.output), result.markdown);
      if (options.verbose) {
        console.error(`Output written to: ${options.output}`);
      }
    } else {
      console.log(result.markdown);
    }
  }

  private formatErrors(errors: ComposeError[], verbose: boolean): void {
    console.error('Composition completed with errors:');
    
    for (const error of errors) {
      if (verbose) {
        console.error(`  [${error.type}] ${error.message}`);
        if (error.path) {
          console.error(`    Path: ${error.path}`);
        }
      } else {
        console.error(`  ${error.message}`);
      }
    }
  }
}

## Data Models

### Slot Resolution Strategy

Each slot source type requires different resolution logic:

1. **File Source** (`{ file: string }`):
   - Resolve path using basePath and resolveFrom options
   - Check circular dependency before reading
   - Read file content with error handling
   - Cache content if caching enabled

2. **Content Source** (`{ content: string }`):
   - Use content directly, no additional processing needed

3. **Function Source** (`() => string | Promise<string>`):
   - Execute function and await result if Promise
   - Handle function execution errors

4. **Nested Node** (`MarkdownNode`):
   - Recursively call composition engine
   - Increment depth counter
   - Merge errors from nested composition

### Path Resolution Logic

```typescript
function resolvePath(
  filepath: string,
  options: ComposeOptions,
  parentFile?: string,
): string {
  if (isAbsolute(filepath)) {
    return filepath;
  }

  const base = options.resolveFrom === 'file' && parentFile
    ? dirname(parentFile)
    : options.basePath ?? Deno.cwd();

  return resolve(base, filepath);
}
````

### Circular Dependency Detection

```typescript
class CircularDependencyTracker {
  private visitedFiles = new Set<string>();

  checkAndAdd(filepath: string): void {
    const normalizedPath = resolve(filepath);

    if (this.visitedFiles.has(normalizedPath)) {
      throw new Error(`Circular dependency detected: ${normalizedPath}`);
    }

    this.visitedFiles.add(normalizedPath);
  }

  remove(filepath: string): void {
    this.visitedFiles.delete(resolve(filepath));
  }
}
```

## Error Handling

### Error Types and Recovery

1. **Missing Slot Errors**:
   - `error`: Throw immediately when slot not provided
   - `ignore`: Remove outlet marker silently
   - `keep`: Preserve outlet marker in output

2. **File Errors**:
   - `throw`: Propagate file read errors immediately
   - `warn-empty`: Use empty content and record warning

3. **Circular Dependencies**:
   - Always throw with clear error message
   - Include the problematic file path

4. **Max Depth Exceeded**:
   - Throw when recursion depth exceeds limit
   - Include current depth in error message

5. **CLI-Specific Errors**:
   - Invalid arguments: Show usage help and exit with code 1
   - Missing template file: Clear error message with suggested corrections
   - JSON config parsing errors: Show line/column information when possible
   - File permission errors: User-friendly messages for common scenarios

### Error Collection Strategy

```typescript
class ErrorCollector {
  private errors: ComposeError[] = [];

  addError(type: string, message: string, path?: string): void {
    this.errors.push({ type, message, path });
  }

  shouldThrow(options: ComposeOptions): boolean {
    return options.onMissingSlot === 'error' ||
      options.onFileError === 'throw';
  }

  getErrors(): ComposeError[] {
    return [...this.errors];
  }
}
```

## Testing Strategy

### Unit Testing Approach

1. **Component Isolation**: Test each component independently
2. **Mock File System**: Use in-memory file system for predictable tests
3. **Error Scenarios**: Comprehensive coverage of error conditions
4. **Edge Cases**: Test boundary conditions and malformed input

### Test Categories

1. **Basic Functionality Tests**:
   - Simple slot filling
   - Multiple outlet types
   - Nested compositions

2. **Safety Feature Tests**:
   - Circular dependency detection
   - Maximum depth limiting
   - Code block protection

3. **Error Handling Tests**:
   - Missing files with different error modes
   - Missing slots with different handling modes
   - Malformed input validation

4. **Performance Tests**:
   - Parallel file reading verification
   - Caching effectiveness
   - Large composition handling

5. **Integration Tests**:
   - End-to-end composition scenarios
   - Cross-platform compatibility
   - Real file system operations

6. **CLI Tests**:
   - Argument parsing with various flag combinations
   - JSON configuration loading and merging
   - Output handling (stdout vs file output)
   - Error message formatting and exit codes
   - Help text display and usage scenarios

### Test Structure

```typescript
// Example test structure
Deno.test('Composition Engine', async (t) => {
  await t.step('should fill basic slots', async () => {
    // Test basic slot filling functionality
  });

  await t.step('should handle missing files gracefully', async () => {
    // Test error handling for missing files
  });

  await t.step('should detect circular dependencies', async () => {
    // Test circular dependency protection
  });
});
```

### Build and Distribution Strategy

The library uses Deno's `dnt` (Deno to Node Transform) for Node.js compatibility:

1. **Development in Deno**:
   - Native TypeScript support
   - Built-in testing and formatting
   - Modern runtime features

2. **Build Process**:
   - Transform Deno code to Node.js compatible code
   - Generate both ESM and CommonJS builds
   - Create TypeScript declaration files
   - Map Deno standard library to Node.js equivalents

3. **Distribution**:
   - Publish to npm for Node.js users with executable CLI
   - Configure package.json with `bin` field for NPX support
   - Include shebang in CLI entry point for Unix systems
   - Maintain Deno compatibility for deno.land/x
   - Support Node.js >= 16.0.0

### CLI Distribution Strategy

The CLI is distributed as part of the npm package with the following considerations:

1. **NPX Integration**:
   - Package name: `markdown-slots`
   - CLI command: `npx markdown-slots compose <template>`
   - Binary entry point in package.json: `"bin": { "markdown-slots": "./cli.js" }`

2. **Cross-Platform Compatibility**:
   - Unix shebang: `#!/usr/bin/env node`
   - Windows compatibility through npm's automatic .cmd wrapper
   - Path resolution works consistently across platforms

3. **Help and Documentation**:
   - Built-in help with `--help` flag
   - Usage examples in help text
   - Error messages guide users toward correct usage

### CLI Usage Examples

```bash
# Basic composition with inline slots
npx markdown-slots compose template.md --slot title="My Document" --slot author="John Doe"
npx markdown-slots compose template.md -s title="My Document" -s author="John Doe"

# Using file-based slots
npx markdown-slots compose template.md --slot content=@content.md --slot footer=@footer.md
npx markdown-slots compose template.md -s content=@content.md -s footer=@footer.md

# JSON configuration
npx markdown-slots compose template.md --json config.json
npx markdown-slots compose template.md -j config.json

# Output to file
npx markdown-slots compose template.md --slot title="Test" --output result.md
npx markdown-slots compose template.md -s title="Test" -o result.md

# Verbose output for debugging
npx markdown-slots compose template.md --json config.json --verbose
npx markdown-slots compose template.md -j config.json -v

# Help
npx markdown-slots --help
npx markdown-slots -h
```

### JSON Configuration Format

```json
{
  "slots": {
    "title": { "content": "My Document Title" },
    "content": { "file": "./content.md" },
    "author": { "content": "John Doe" },
    "nested": {
      "file": "./nested-template.md",
      "slots": {
        "section": { "file": "./section.md" }
      }
    }
  },
  "options": {
    "resolveFrom": "file",
    "onMissingSlot": "ignore"
  }
}
```

This design provides a robust, performant, and developer-friendly solution for Markdown composition using the slot/outlet pattern while maintaining safety and flexibility.
