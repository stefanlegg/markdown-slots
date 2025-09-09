# Implementation Plan

-
  1. [x] Set up project structure and core type definitions
  - Create Deno project structure with src/, tests/, and examples/ directories
  - Define TypeScript interfaces for MarkdownSlotSource, MarkdownNode, ComposeOptions, and ComposeResult
  - Set up deno.json configuration with tasks for testing, formatting, and building
  - _Requirements: 9.1, 9.2, 10.1_

-
  2. [x] Implement content parser with outlet detection
  - Create ContentParser class with outlet regex pattern matching
  - Implement splitByCodeBlocks method to identify and preserve code blocks
  - Write findOutlets method to locate outlet markers outside code blocks
  - Create replaceOutlets method for safe outlet replacement
  - Write unit tests for content parsing edge cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

-
  3. [x] Create file system adapter interface and Deno implementation
  - Define FileSystemAdapter interface with readFile, exists, and resolvePath methods
  - Implement DenoFileSystem class using Deno.readTextFile and standard path utilities
  - Create path resolution logic supporting both 'cwd' and 'file' resolution modes
  - Write unit tests for path resolution with various scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

-
  4. [x] Implement circular dependency detection and depth limiting
  - Create CircularDependencyTracker class with file path tracking
  - Implement checkAndAdd method to detect circular references
  - Add depth counter to composition engine with configurable limits
  - Write unit tests for circular dependency detection and depth limiting
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

-
  5. [x] Build core composition engine with slot resolution
  - Create CompositionEngine class with main compose method
  - Implement slot source resolution for file, content, function, and nested node types
  - Add support for parallel file reading when enabled
  - Integrate circular dependency checking and depth limiting
  - Write unit tests for basic slot filling functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1_

-
  6. [x] Implement error handling and collection system
  - Add configurable error handling for missing slots (error/ignore/keep modes)
  - Implement file error handling with throw/warn-empty options
  - Create comprehensive error reporting in ComposeResult
  - Write unit tests for all error handling scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3_

-
  7. [x] Add caching support and performance optimizations
  - Implement file content caching using Map<string, string>
  - Add parallel file reading support using Promise.all
  - Optimize repeated file access through cache integration
  - Write performance tests to verify caching effectiveness
  - _Requirements: 7.2, 7.3_

-
  8. [x] Create main public API and integrate all components
  - Implement composeMarkdown function as main entry point
  - Integrate CompositionEngine, ContentParser, and FileSystemAdapter
  - Add input validation for MarkdownNode and ComposeOptions
  - Create comprehensive integration tests for end-to-end functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

-
  9. [x] Write comprehensive test suite
  - Create unit tests for all components with edge case coverage
  - Add integration tests for complex composition scenarios
  - Write tests for error conditions and recovery mechanisms
  - Create performance tests for parallel processing and caching
  - Test code block protection and outlet marker handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 5.1, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

-
  10. [x] Create build system for Node.js distribution
  - Implement build.ts script using dnt (Deno to Node Transform)
  - Configure ESM and CommonJS output with TypeScript declarations
  - Map Deno standard library imports to Node.js equivalents
  - Set up package.json generation with proper metadata
  - Test Node.js compatibility with both module systems
  - _Requirements: 9.3, 10.1, 10.2, 10.3_

-
  11. [x] Add example usage and documentation
  - Create basic usage examples in examples/ directory
  - Write examples for nested composition and error handling
  - Create comprehensive README with API documentation
  - Add inline code documentation and JSDoc comments
  - Test all examples to ensure they work correctly
  - _Requirements: 9.1, 9.2_

-
  12. [x] Set up development workflow and tooling
  - Configure Deno tasks for development, testing, and building
  - Set up formatting and linting rules in deno.json
  - Create development scripts for watch mode and testing
  - Test the complete development and build workflow
  - _Requirements: 10.1, 10.2, 10.3_

-
  13. [x] Fix function error handling in composition engine
  - Add proper error type for function errors in ComposeError interface
  - Update composition engine to handle function execution errors correctly
  - Ensure function errors are properly categorized and reported
  - _Requirements: 6.1, 6.2, 8.1_

-
  14. [x] Implement CLI argument parser
  - Create ArgumentParser class to handle command-line argument parsing
  - Support --slot/-s name=value syntax for inline slot content
  - Support --slot/-s name=@file.md syntax for file-based slot content
  - Add support for --json/-j, --output/-o, --verbose/-v, and --help/-h flags
  - Write unit tests for argument parsing with both long and short flag combinations
  - _Requirements: 11.2, 11.3, 11.6, 12.1, 12.2_

-
  15. [x] Create configuration loader for CLI
  - Implement ConfigurationLoader class to handle JSON config loading
  - Add support for merging JSON configuration with CLI flags (CLI takes precedence)
  - Implement file path resolution for @file.md syntax in CLI slots
  - Handle nested MarkdownNode structures from JSON configuration
  - Write unit tests for configuration loading and merging scenarios with short flags
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

-
  16. [x] Build CLI interface and output handler
  - Create CliInterface class as main CLI entry point
  - Implement OutputHandler for managing stdout vs file output
  - Add user-friendly error formatting for CLI context
  - Create help text display with usage examples
  - Write unit tests for CLI interface and output handling
  - _Requirements: 11.1, 11.5, 14.1, 14.2, 14.3_

-
  17. [x] Create CLI entry point and NPX integration
  - Create cli.ts file as executable entry point with proper shebang
  - Update build.ts to generate CLI executable for Node.js distribution
  - Configure package.json with bin field for NPX support
  - Test NPX functionality with various command combinations using both long and short flags
  - Write integration tests for end-to-end CLI usage
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

-
  18. [x] Add comprehensive CLI testing and examples
  - Create CLI-specific test suite covering all argument combinations with long and short flags
  - Test JSON configuration loading with complex nested structures
  - Add CLI usage examples to examples/ directory showing both flag styles
  - Test error scenarios and help text display
  - Verify cross-platform compatibility for CLI executable
  - _Requirements: 11.6, 12.3, 12.4, 13.1, 14.4_

-
  19. [x] Update documentation for CLI usage
  - Add CLI usage section to README with examples
  - Document JSON configuration format and options
  - Create CLI-specific examples showing various use cases
  - Add troubleshooting section for common CLI issues
  - Update API documentation to include CLI interface
  - _Requirements: 11.6, 13.1, 14.1, 14.4_

-
  20. [ ] Add CI/CD configuration for automated testing and publishing
  - Create GitHub Actions workflow for automated testing
  - Set up automated publishing to npm registry
  - Add automated Deno compatibility testing
  - Configure automated security scanning and dependency updates
  - Test CLI functionality in CI environment
  - _Requirements: 10.1, 10.2, 10.3_
