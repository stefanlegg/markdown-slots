# Cross-Platform CLI Compatibility Examples

This document demonstrates how the Markdown Slots CLI works consistently across different operating systems and environments.

## Path Handling

### Unix/Linux/macOS Path Examples

```bash
# Forward slashes work on all Unix-like systems
npx markdown-slots compose template.md \
  --slot content=@./content/unix-style.md \
  --slot footer=@../shared/footer.md \
  --output ./output/result.md

# Relative paths from current directory
npx markdown-slots compose docs/template.md \
  --json docs/config.json \
  --output docs/generated.md

# Absolute paths (Unix-style)
npx markdown-slots compose /home/user/templates/main.md \
  --slot content=@/home/user/content/main.md \
  --output /home/user/output/result.md
```

### Windows Path Examples

```cmd
REM Backslashes work on Windows
npx markdown-slots compose template.md ^
  --slot content=@.\content\windows-style.md ^
  --slot footer=@..\shared\footer.md ^
  --output .\output\result.md

REM Forward slashes also work on Windows
npx markdown-slots compose template.md ^
  --slot content=@./content/mixed-style.md ^
  --slot footer=@../shared/footer.md ^
  --output ./output/result.md

REM Absolute paths (Windows-style)
npx markdown-slots compose C:\Users\User\templates\main.md ^
  --slot content=@C:\Users\User\content\main.md ^
  --output C:\Users\User\output\result.md
```

### PowerShell Examples

```powershell
# PowerShell with line continuation
npx markdown-slots compose template.md `
  --slot content=@./content/powershell-style.md `
  --slot footer=@../shared/footer.md `
  --output ./output/result.md

# Using PowerShell variables
$TemplateDir = "C:\Projects\Templates"
$OutputDir = "C:\Projects\Output"

npx markdown-slots compose "$TemplateDir\main.md" `
  --json "$TemplateDir\config.json" `
  --output "$OutputDir\result.md" `
  --verbose
```

## Line Ending Handling

The CLI preserves line endings from source files:

### Unix Line Endings (LF)

```bash
# Files with Unix line endings are preserved
npx markdown-slots compose template.md \
  --slot content=@unix-file.md \
  --output unix-result.md
```

### Windows Line Endings (CRLF)

```cmd
REM Files with Windows line endings are preserved
npx markdown-slots compose template.md ^
  --slot content=@windows-file.md ^
  --output windows-result.md
```

### Mixed Line Endings

```bash
# Mixed line endings are preserved as-is
npx markdown-slots compose template.md \
  --slot unix_content=@unix-file.md \
  --slot windows_content=@windows-file.md \
  --output mixed-result.md
```

## Character Encoding

The CLI handles UTF-8 encoding consistently across platforms:

```bash
# Unicode content works on all platforms
npx markdown-slots compose template.md \
  --slot title="Unicode Test: 🌍 中文 العربية ñ àáâãäå" \
  --slot content=@unicode-content.md \
  --output unicode-result.md
```

## Environment Variables

### Unix/Linux/macOS

```bash
# Using environment variables in Unix shells
export PROJECT_NAME="My Project"
export VERSION="1.0.0"
export BUILD_DATE=$(date)

npx markdown-slots compose template.md \
  --slot project_name="$PROJECT_NAME" \
  --slot version="$VERSION" \
  --slot build_date="$BUILD_DATE" \
  --output README.md
```

### Windows Command Prompt

```cmd
REM Using environment variables in Windows CMD
set PROJECT_NAME=My Project
set VERSION=1.0.0
set BUILD_DATE=%DATE%

npx markdown-slots compose template.md ^
  --slot project_name="%PROJECT_NAME%" ^
  --slot version="%VERSION%" ^
  --slot build_date="%BUILD_DATE%" ^
  --output README.md
```

### PowerShell

```powershell
# Using environment variables in PowerShell
$env:PROJECT_NAME = "My Project"
$env:VERSION = "1.0.0"
$env:BUILD_DATE = Get-Date -Format "yyyy-MM-dd"

npx markdown-slots compose template.md `
  --slot project_name="$env:PROJECT_NAME" `
  --slot version="$env:VERSION" `
  --slot build_date="$env:BUILD_DATE" `
  --output README.md
```

## Shell Scripting Integration

### Bash Script (Unix/Linux/macOS)

```bash
#!/bin/bash

# generate-docs.sh
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$PROJECT_ROOT/templates"
OUTPUT_DIR="$PROJECT_ROOT/docs"
CONFIG_DIR="$PROJECT_ROOT/configs"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate documentation files
for template in "$TEMPLATE_DIR"/*.md; do
    filename=$(basename "$template" .md)
    config_file="$CONFIG_DIR/${filename}.json"
    output_file="$OUTPUT_DIR/${filename}.md"
    
    echo "Generating $output_file..."
    
    if [ -f "$config_file" ]; then
        npx markdown-slots compose "$template" \
            --json "$config_file" \
            --slot build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --slot version="${VERSION:-dev}" \
            --output "$output_file" \
            --verbose
    else
        npx markdown-slots compose "$template" \
            --slot build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --slot version="${VERSION:-dev}" \
            --output "$output_file" \
            --verbose
    fi
done

echo "Documentation generation complete!"
```

### Batch Script (Windows)

```batch
@echo off
REM generate-docs.bat
setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set TEMPLATE_DIR=%PROJECT_ROOT%templates
set OUTPUT_DIR=%PROJECT_ROOT%docs
set CONFIG_DIR=%PROJECT_ROOT%configs

REM Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Generate documentation files
for %%f in ("%TEMPLATE_DIR%\*.md") do (
    set filename=%%~nf
    set config_file=%CONFIG_DIR%\!filename!.json
    set output_file=%OUTPUT_DIR%\!filename!.md
    
    echo Generating !output_file!...
    
    if exist "!config_file!" (
        npx markdown-slots compose "%%f" ^
            --json "!config_file!" ^
            --slot build_date="%DATE% %TIME%" ^
            --slot version="%VERSION%" ^
            --output "!output_file!" ^
            --verbose
    ) else (
        npx markdown-slots compose "%%f" ^
            --slot build_date="%DATE% %TIME%" ^
            --slot version="%VERSION%" ^
            --output "!output_file!" ^
            --verbose
    )
)

echo Documentation generation complete!
```

### PowerShell Script

```powershell
# generate-docs.ps1
param(
    [string]$Version = "dev",
    [string]$TemplateDir = "templates",
    [string]$OutputDir = "docs",
    [string]$ConfigDir = "configs"
)

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force
}

# Get all template files
$templates = Get-ChildItem -Path $TemplateDir -Filter "*.md"

foreach ($template in $templates) {
    $filename = $template.BaseName
    $configFile = Join-Path $ConfigDir "$filename.json"
    $outputFile = Join-Path $OutputDir "$filename.md"
    
    Write-Host "Generating $outputFile..."
    
    $buildDate = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    
    if (Test-Path $configFile) {
        & npx markdown-slots compose $template.FullName `
            --json $configFile `
            --slot build_date="$buildDate" `
            --slot version="$Version" `
            --output $outputFile `
            --verbose
    } else {
        & npx markdown-slots compose $template.FullName `
            --slot build_date="$buildDate" `
            --slot version="$Version" `
            --output $outputFile `
            --verbose
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate $outputFile"
        exit 1
    }
}

Write-Host "Documentation generation complete!"
```

## CI/CD Integration Examples

### GitHub Actions (Cross-Platform)

```yaml
name: Generate Documentation
on: [push, pull_request]

jobs:
  generate-docs:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install markdown-slots
        run: npm install -g markdown-slots

      - name: Generate docs (Unix)
        if: runner.os != 'Windows'
        run: |
          npx markdown-slots compose docs/template.md \
            --json docs/config.json \
            --slot os="${{ runner.os }}" \
            --slot build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --output README-${{ runner.os }}.md \
            --verbose

      - name: Generate docs (Windows)
        if: runner.os == 'Windows'
        run: |
          npx markdown-slots compose docs/template.md ^
            --json docs/config.json ^
            --slot os="${{ runner.os }}" ^
            --slot build_date="%DATE% %TIME%" ^
            --output README-${{ runner.os }}.md ^
            --verbose

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: docs-${{ runner.os }}
          path: README-${{ runner.os }}.md
```

### GitLab CI (Multi-Platform)

```yaml
stages:
  - generate

variables:
  NODE_VERSION: '18'

.generate_template: &generate_template
  stage: generate
  before_script:
    - npm install -g markdown-slots
  script:
    - npx markdown-slots compose docs/template.md
      --json docs/config.json
      --slot platform="$CI_RUNNER_DESCRIPTION"
      --slot pipeline_id="$CI_PIPELINE_ID"
      --slot commit_sha="$CI_COMMIT_SHA"
      --output README-$CI_RUNNER_DESCRIPTION.md
      --verbose
  artifacts:
    paths:
      - README-*.md

generate:linux:
  <<: *generate_template
  image: node:18-alpine
  tags:
    - linux

generate:windows:
  <<: *generate_template
  image: mcr.microsoft.com/windows/servercore:ltsc2019
  tags:
    - windows
```

## Testing Cross-Platform Compatibility

### Test Script for Multiple Platforms

```bash
#!/bin/bash
# test-cross-platform.sh

echo "Testing Markdown Slots CLI cross-platform compatibility..."

# Test basic functionality
echo "Testing basic composition..."
npx markdown-slots compose test-template.md \
  --slot title="Cross-Platform Test" \
  --slot content="This works on $(uname -s)" \
  --output test-output.md

# Test with special characters
echo "Testing special characters..."
npx markdown-slots compose test-template.md \
  --slot title="Special Chars: àáâãäå ñ 中文 🚀" \
  --slot content="Unicode content test" \
  --output unicode-test.md

# Test with file paths
echo "Testing file paths..."
npx markdown-slots compose test-template.md \
  --slot content=@./test-content.md \
  --output path-test.md

# Test JSON configuration
echo "Testing JSON configuration..."
npx markdown-slots compose test-template.md \
  --json test-config.json \
  --output json-test.md

echo "Cross-platform tests completed!"
```

## Common Issues and Solutions

### Path Separator Issues

```bash
# Problem: Hard-coded path separators
--slot content=@content\file.md  # Only works on Windows

# Solution: Use forward slashes (work everywhere)
--slot content=@content/file.md  # Works on all platforms
```

### Line Ending Issues

```bash
# The CLI preserves line endings, so this is usually not an issue
# But if you need to normalize line endings, do it before processing:

# Unix: Convert CRLF to LF
dos2unix input-file.md

# Windows: Convert LF to CRLF
unix2dos input-file.md
```

### Character Encoding Issues

```bash
# Ensure all files are UTF-8 encoded
# The CLI expects UTF-8 input and produces UTF-8 output

# Check file encoding (Unix)
file -bi filename.md

# Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 input.md > output.md
```

### Environment Variable Differences

```bash
# Use consistent environment variable syntax
# Unix/Linux/macOS
export VAR="value"
echo $VAR

# Windows CMD
set VAR=value
echo %VAR%

# PowerShell
$env:VAR = "value"
echo $env:VAR
```

## Deno-Specific Considerations

### Permission Management

Deno's security model requires explicit permissions:

```bash
# Minimal permissions (read-only, output to stdout)
deno run --allow-read https://deno.land/x/markdown_slots/cli.ts template.md --slot title="Test"

# Full permissions
deno run --allow-read --allow-write https://deno.land/x/markdown_slots/cli.ts template.md --slot title="Test" --output result.md

# Restricted to specific directories
deno run --allow-read=./docs,./templates --allow-write=./output https://deno.land/x/markdown_slots/cli.ts docs/template.md --output output/result.md
```

### Deno Watch Mode

Deno has built-in file watching:

```bash
# Watch for changes and regenerate
deno run --allow-read --allow-write --watch docs/ https://deno.land/x/markdown_slots/cli.ts docs/template.md --json docs/config.json --output README.md
```

### Import Maps and Local Development

For local development, you can use import maps:

```json
// import_map.json
{
  "imports": {
    "markdown-slots/": "./src/"
  }
}
```

```bash
# Use local version with import map
deno run --import-map=import_map.json --allow-read --allow-write ./cli.ts template.md --slot title="Local Development"
```

## Best Practices for Cross-Platform Usage

1. **Use forward slashes in paths**: They work on all platforms
2. **Use relative paths**: More portable than absolute paths
3. **Test on multiple platforms**: Especially if distributing scripts
4. **Use UTF-8 encoding**: Ensures consistent character handling
5. **Avoid platform-specific commands**: In shell scripts that call the CLI
6. **Use environment variables carefully**: Syntax varies between shells
7. **Document platform requirements**: If any platform-specific features are used
8. **Use CI/CD for testing**: Automated testing on multiple platforms
9. **Handle line endings appropriately**: Usually not an issue, but be aware
10. **Use consistent shell syntax**: Or provide platform-specific scripts
11. **For Deno**: Always specify required permissions explicitly
12. **For Deno**: Use `deno install` for frequently used commands
13. **For Deno**: Consider using `deno task` for project-specific commands
