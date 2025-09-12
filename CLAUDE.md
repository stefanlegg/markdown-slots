# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Tasks
- `deno task test` - Run all tests with required permissions (--allow-read --allow-write --allow-run)
- `deno task test:watch` - Run tests in watch mode
- `deno task test tests/specific_test.ts` - Run specific test file
- `deno task fmt` - Format all code according to project standards
- `deno task fmt:check` - Check code formatting without making changes
- `deno task lint` - Run linter with recommended rules
- `deno task check` - Type check the entire project
- `deno task build` - Run build script (build.ts)
- `deno task publish` - Publish to Deno registry

### Development
- `deno task dev` - Run in development mode with watch mode
- `deno run -A cli.ts` - Run CLI tool directly from source
- `deno run -A jsr:@stefanlegg/markdown-slots/cli` - Run CLI from JSR registry
- `deno run --allow-read examples/basic-usage.ts` - Test basic functionality

## Architecture Overview

This is a TypeScript library for composing markdown content with slot-based templating, built for both Deno and Node.js environments.

### Core Architecture
- **Slot-based composition system**: Uses `<!-- outlet: name -->` markers for content replacement
- **Multi-source content**: Supports content strings, file paths, and async functions as slot sources
- **Nested composition**: Unlimited nesting with circular dependency detection
- **CLI tool**: Full-featured command line interface for composition without coding

### Key Components

**Core Library** (`src/`):
- `compose.ts` - Main API function and public interface
- `composition-engine.ts` - Core composition logic and orchestration
- `parser.ts` - Markdown content parsing and outlet detection
- `filesystem.ts` - File system operations with cross-platform support
- `dependency-tracker.ts` - Circular dependency detection and prevention
- `types.ts` - TypeScript type definitions for all components

**CLI Implementation** (`src/cli/`):
- `cli-interface.ts` - Main CLI orchestration and command handling
- `argument-parser.ts` - Command line argument parsing and validation
- `configuration-loader.ts` - JSON configuration file loading and merging
- `output-handler.ts` - Output formatting and file writing

**Entry Points**:
- `mod.ts` - Main library export for programmatic use
- `cli.ts` - CLI entry point with cross-platform compatibility

### Testing Strategy
- Comprehensive test coverage across all modules
- Integration tests for complex composition scenarios
- File system operation testing with temporary directories
- CLI integration tests with real command execution
- Error handling and edge case validation

### Code Quality Standards
- TypeScript strict mode enabled
- Deno's recommended lint rules
- Consistent code formatting (2 spaces, single quotes, semicolons)
- Line width limit of 100 characters
- JSDoc documentation for public APIs

## Development Notes

### File Permissions
The CLI and many operations require `--allow-read` and `--allow-write` permissions for file system access.

### JSR Registry Integration  
Published to JSR registry as `@stefanlegg/markdown-slots` for easy installation and usage with Deno.

### Performance Considerations
- Optional parallel processing for multiple file operations
- Configurable caching system for file content
- Depth limiting to prevent runaway compositions
- Circular dependency detection to prevent infinite loops