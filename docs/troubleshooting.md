# 🔧 Troubleshooting Guide

This comprehensive guide covers common issues you might encounter when using Markdown Slots and provides step-by-step solutions.

## 📋 Quick Reference

| Issue Type | Common Symptoms | Quick Fix |
|------------|----------------|-----------|
| [Template Not Found](#template-file-not-found) | `Template file not found` | Check file path and permissions |
| [Invalid Slot Format](#invalid-slot-format) | `Invalid slot format` | Use `name=value` or `name=@file.md` |
| [JSON Errors](#json-configuration-errors) | `Invalid JSON` | Validate JSON syntax |
| [File Not Found](#file-reference-not-found) | `File not found` warning | Verify file paths |
| [Permission Denied](#permission-denied) | `Permission denied` | Check file permissions |
| [Circular Dependencies](#circular-dependencies) | `Circular dependency detected` | Review file structure |
| [Outlets Not Replaced](#outlets-not-being-replaced) | Outlets remain in output | Check syntax and slot names |

## 🚨 Emergency Fixes

### Quick Diagnostic Commands

```bash
# Test basic functionality
echo "Test: <!-- outlet: test -->" > test.md
deno run -A jsr:@stefanlegg/markdown-slots/cli test.md --slot test="working"

# Validate JSON configuration
python -m json.tool config.json || echo "Invalid JSON"

# Check file permissions
ls -la template.md

# Debug with verbose output
deno run -A jsr:@stefanlegg/markdown-slots/cli template.md --verbose
```

## 📖 Table of Contents

### CLI Issues
- [Template File Not Found](#template-file-not-found)
- [Invalid Slot Format](#invalid-slot-format)
- [JSON Configuration Errors](#json-configuration-errors)
- [File Reference Not Found](#file-reference-not-found)
- [Permission Denied](#permission-denied)
- [Output File Cannot Be Written](#output-file-cannot-be-written)

### Composition Issues
- [Circular Dependencies](#circular-dependencies)
- [Maximum Depth Exceeded](#maximum-depth-exceeded)
- [Outlets Not Being Replaced](#outlets-not-being-replaced)
- [Code Blocks Being Processed](#code-blocks-being-processed)

### Performance Issues
- [Slow Composition with Many Files](#slow-composition-with-many-files)
- [Memory Issues with Large Files](#memory-issues-with-large-files)

### Platform-Specific Issues
- [Windows Path Issues](#windows-path-issues)
- [Line Ending Issues](#line-ending-issues)

### Debugging & Best Practices
- [Debugging Tips](#debugging-tips)
- [Getting Help](#getting-help)

---

## Common CLI Issues

### Template File Not Found

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

### Invalid Slot Format

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

### JSON Configuration Errors

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

### File Reference Not Found

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

### Permission Denied

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

### Output File Cannot Be Written

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

## Common Composition Issues

### Circular Dependencies

**Error:** `Error: Circular dependency detected: a.md -> b.md -> a.md`

**Solutions:**

- Review your file structure to identify circular references
- Restructure templates to avoid circular dependencies
- Use content slots instead of file references where appropriate

```bash
# Debug with verbose mode
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose
```

### Maximum Depth Exceeded

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

### Outlets Not Being Replaced

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

### Code Blocks Being Processed

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

## Performance Issues

### Slow Composition with Many Files

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

### Memory Issues with Large Files

**Solutions:**

- Process large documents in smaller chunks
- Avoid deeply nested compositions with large files
- Use file references instead of inline content for large sections

## Platform-Specific Issues

### Windows Path Issues

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

### Line Ending Issues

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

## Debugging Tips

### Use Verbose Mode

Always use `--verbose` or `-v` when debugging issues:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose
```

This shows:

- File paths being resolved
- Slots being processed
- Errors and warnings
- Processing steps

## Getting Help

If you're still having issues:

1. Check the [examples](./examples/) for similar use cases
2. Search [existing issues](https://github.com/stefanlegg/markdown-slots/issues) on GitHub
3. Create a [new issue](https://github.com/stefanlegg/markdown-slots/issues/new) with:
   - Your operating system
   - Deno version (`deno --version`)
   - Complete error message
   - Minimal reproduction case
   - What you expected to happen