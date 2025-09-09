# Requirements Document

## Introduction

The Markdown Slots library is a Node.js utility that enables composing Markdown files using a slot/outlet pattern. The library allows parent templates to define insertion points (outlets) that can be filled with content from various sources including files, strings, functions, or nested compositions. The library will be developed in Deno for superior developer experience and then compiled to Node.js for distribution via npm.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define outlets in Markdown templates using HTML comments, so that I can create reusable templates with insertion points.

#### Acceptance Criteria

1. WHEN a template contains `<!-- outlet: NAME -->` THEN the system SHALL recognize it as a valid outlet marker
2. WHEN the outlet marker is in a code block THEN the system SHALL NOT process it as an outlet
3. WHEN an outlet marker uses invalid characters in the name THEN the system SHALL only accept alphanumeric characters and underscores
4. WHEN multiple outlets have the same name in a template THEN the system SHALL replace all instances with the same content

### Requirement 2

**User Story:** As a developer, I want to fill outlets with content from multiple sources, so that I can compose Markdown from files, strings, functions, or nested compositions.

#### Acceptance Criteria

1. WHEN a slot source is `{ file: string }` THEN the system SHALL read the file content and insert it at the outlet
2. WHEN a slot source is `{ content: string }` THEN the system SHALL insert the string content directly at the outlet
3. WHEN a slot source is a function THEN the system SHALL execute the function and insert the returned content
4. WHEN a slot source is a MarkdownNode THEN the system SHALL recursively compose the nested structure
5. WHEN a function returns a Promise THEN the system SHALL await the result before insertion

### Requirement 3

**User Story:** As a developer, I want path resolution options, so that I can control how relative file paths are resolved in my compositions.

#### Acceptance Criteria

1. WHEN `resolveFrom` is set to 'cwd' THEN the system SHALL resolve relative paths from the current working directory
2. WHEN `resolveFrom` is set to 'file' THEN the system SHALL resolve relative paths from the parent file's directory
3. WHEN a file path is absolute THEN the system SHALL use it as-is regardless of resolution settings
4. WHEN `basePath` is provided THEN the system SHALL use it as the base for relative path resolution

### Requirement 4

**User Story:** As a developer, I want circular dependency protection, so that my compositions don't cause infinite loops.

#### Acceptance Criteria

1. WHEN a file references itself directly or indirectly THEN the system SHALL detect the circular dependency
2. WHEN a circular dependency is detected THEN the system SHALL throw an error with a clear message
3. WHEN the composition completes successfully THEN the system SHALL clear the circular dependency tracking

### Requirement 5

**User Story:** As a developer, I want depth limiting, so that deeply nested compositions don't cause stack overflow errors.

#### Acceptance Criteria

1. WHEN the composition depth exceeds the maximum allowed THEN the system SHALL throw an error
2. WHEN `maxDepth` is not specified THEN the system SHALL use a default limit of 10
3. WHEN `maxDepth` is set to a custom value THEN the system SHALL respect that limit

### Requirement 6

**User Story:** As a developer, I want configurable error handling, so that I can control how missing files and slots are handled.

#### Acceptance Criteria

1. WHEN `onMissingSlot` is 'error' AND a slot is not provided THEN the system SHALL throw an error
2. WHEN `onMissingSlot` is 'ignore' AND a slot is not provided THEN the system SHALL remove the outlet marker
3. WHEN `onMissingSlot` is 'keep' AND a slot is not provided THEN the system SHALL preserve the outlet marker
4. WHEN `onFileError` is 'throw' AND a file cannot be read THEN the system SHALL throw an error
5. WHEN `onFileError` is 'warn-empty' AND a file cannot be read THEN the system SHALL use empty content and record a warning

### Requirement 7

**User Story:** As a developer, I want performance optimizations, so that large compositions complete efficiently.

#### Acceptance Criteria

1. WHEN `parallel` is true THEN the system SHALL read multiple files concurrently
2. WHEN `cache` is provided THEN the system SHALL cache file contents to avoid duplicate reads
3. WHEN the same file is referenced multiple times THEN the system SHALL read it only once when caching is enabled

### Requirement 8

**User Story:** As a developer, I want comprehensive error reporting, so that I can debug composition issues effectively.

#### Acceptance Criteria

1. WHEN errors occur during composition THEN the system SHALL return a ComposeResult with error details
2. WHEN multiple errors occur THEN the system SHALL collect all errors in the result
3. WHEN an error occurs THEN the system SHALL include the error type, message, and relevant path information

### Requirement 9

**User Story:** As a developer, I want TypeScript support, so that I can use the library with full type safety.

#### Acceptance Criteria

1. WHEN the library is imported THEN the system SHALL provide complete TypeScript type definitions
2. WHEN using the API THEN the system SHALL enforce type safety for all parameters and return values
3. WHEN building for Node.js THEN the system SHALL generate both ESM and CommonJS compatible types

### Requirement 10

**User Story:** As a developer, I want to use the library in Node.js projects, so that I can integrate it into existing Node.js workflows.

#### Acceptance Criteria

1. WHEN the library is published to npm THEN the system SHALL support Node.js >= 16.0.0
2. WHEN imported in a Node.js project THEN the system SHALL work with both ESM and CommonJS module systems
3. WHEN using Node.js APIs THEN the system SHALL use appropriate Node.js equivalents for file operations

### Requirement 11

**User Story:** As a developer, I want to use the library via NPX command line, so that I can compose Markdown files without writing code.

#### Acceptance Criteria

1. WHEN running `npx markdown-slots compose <template>` THEN the system SHALL compose the template and output to stdout
2. WHEN using `--slot name=value` or `-s name=value` flags THEN the system SHALL fill the named slot with the provided content
3. WHEN using `--slot name=@file.md` or `-s name=@file.md` syntax THEN the system SHALL fill the slot with the file contents
4. WHEN using `--json <config.json>` or `-j <config.json>` THEN the system SHALL load slot configuration from the JSON file
5. WHEN using `--output <file>` or `-o <file>` THEN the system SHALL write the result to the specified file instead of stdout
6. WHEN using `--help` or `-h` THEN the system SHALL display usage information and available options

### Requirement 12

**User Story:** As a developer, I want flexible slot content specification via CLI, so that I can provide content from various sources.

#### Acceptance Criteria

1. WHEN slot value starts with `@` THEN the system SHALL treat it as a file path and read the content
2. WHEN slot value is plain text THEN the system SHALL use it as literal content
3. WHEN slot value contains newlines THEN the system SHALL preserve the formatting
4. WHEN multiple `--slot` or `-s` flags use the same name THEN the system SHALL use the last value provided

### Requirement 13

**User Story:** As a developer, I want JSON configuration support for complex compositions, so that I can define multiple slots and nested structures easily.

#### Acceptance Criteria

1. WHEN JSON config contains a `slots` object THEN the system SHALL use it to fill template slots
2. WHEN JSON config contains file references THEN the system SHALL resolve them relative to the config file
3. WHEN JSON config contains nested MarkdownNode structures THEN the system SHALL process them recursively
4. WHEN both `--slot`/`-s` flags and `--json`/`-j` are provided THEN the CLI flags SHALL override JSON values for the same slot names

### Requirement 14

**User Story:** As a developer, I want clear CLI error messages and help, so that I can troubleshoot issues and learn the tool quickly.

#### Acceptance Criteria

1. WHEN required arguments are missing THEN the system SHALL display a clear error message and usage help
2. WHEN file paths cannot be resolved THEN the system SHALL show the attempted path and suggest corrections
3. WHEN composition errors occur THEN the system SHALL display them in a user-friendly format
4. WHEN using `--verbose` or `-v` flag THEN the system SHALL show detailed processing information
