# CLI Advanced Scenarios and Edge Cases

This document demonstrates advanced CLI usage patterns, edge cases, and complex real-world scenarios.

## Complex Nested Compositions

### Multi-Level Documentation System

Template structure:

```
templates/
├── main-doc.md          # Main document template
├── chapter.md           # Chapter template
├── section.md           # Section template
└── subsection.md        # Subsection template
```

Main document template (`templates/main-doc.md`):

```markdown
# <!-- outlet: doc_title -->

**Version:** <!-- outlet: version -->\
**Last Updated:** <!-- outlet: last_updated -->

## Table of Contents

<!-- outlet: toc -->

---

<!-- outlet: chapters -->

---

## Appendix

<!-- outlet: appendix -->

_Generated on <!-- outlet: generation_date -->_
```

Chapter template (`templates/chapter.md`):

```markdown
## <!-- outlet: chapter_number -->. <!-- outlet: chapter_title -->

<!-- outlet: chapter_intro -->

<!-- outlet: sections -->

### Chapter Summary

<!-- outlet: chapter_summary -->
```

Complex configuration (`complex-doc-config.json`):

```json
{
  "slots": {
    "doc_title": { "content": "Advanced User Guide" },
    "version": { "content": "2.1.0" },
    "last_updated": { "content": "2024-01-15" },
    "generation_date": { "content": "2024-01-15 14:30:00" },
    "toc": { "file": "./content/table-of-contents.md" },
    "chapters": {
      "file": "./templates/chapters-container.md",
      "slots": {
        "chapter_1": {
          "file": "./templates/chapter.md",
          "slots": {
            "chapter_number": { "content": "1" },
            "chapter_title": { "content": "Getting Started" },
            "chapter_intro": { "file": "./content/ch1/intro.md" },
            "sections": {
              "file": "./templates/sections-container.md",
              "slots": {
                "section_1_1": {
                  "file": "./templates/section.md",
                  "slots": {
                    "section_title": { "content": "Installation" },
                    "section_content": { "file": "./content/ch1/installation.md" }
                  }
                },
                "section_1_2": {
                  "file": "./templates/section.md",
                  "slots": {
                    "section_title": { "content": "Configuration" },
                    "section_content": { "file": "./content/ch1/configuration.md" }
                  }
                }
              }
            },
            "chapter_summary": { "file": "./content/ch1/summary.md" }
          }
        },
        "chapter_2": {
          "file": "./templates/chapter.md",
          "slots": {
            "chapter_number": { "content": "2" },
            "chapter_title": { "content": "Advanced Features" },
            "chapter_intro": { "file": "./content/ch2/intro.md" },
            "sections": { "file": "./content/ch2/all-sections.md" },
            "chapter_summary": { "file": "./content/ch2/summary.md" }
          }
        }
      }
    },
    "appendix": { "file": "./content/appendix.md" }
  },
  "options": {
    "resolveFrom": "file",
    "parallel": true,
    "onMissingSlot": "keep"
  }
}
```

Generate the complex document:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose templates/main-doc.md \
  --json complex-doc-config.json \
  --output docs/advanced-user-guide.md \
  --verbose
```

## Special Characters and Edge Cases

### Unicode and International Content

Template with international content:

```markdown
# <!-- outlet: title -->

## <!-- outlet: section_chinese -->

<!-- outlet: chinese_content -->

## <!-- outlet: section_arabic -->

<!-- outlet: arabic_content -->

## <!-- outlet: section_emoji -->

<!-- outlet: emoji_content -->

## Special Characters

<!-- outlet: special_chars -->
```

Usage with international content:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose international-template.md \
  --slot title="国际化文档 / International Documentation 🌍" \
  --slot section_chinese="中文部分" \
  --slot chinese_content="这是中文内容，包含特殊字符：《》【】" \
  --slot section_arabic="القسم العربي" \
  --slot arabic_content="هذا محتوى باللغة العربية" \
  --slot section_emoji="Emoji Section 🚀" \
  --slot emoji_content="Content with emojis: 🎉 🔥 💯 ⭐ 🌟" \
  --slot special_chars="Special chars: àáâãäå ñ ç ü ß €£¥ ©®™"
```

### Code Blocks and Markdown Preservation

Template with code blocks:

````markdown
# <!-- outlet: title -->

## Code Example

Here's a code block that should NOT be processed:

```markdown
<!-- @outlet:this_should_not_be_replaced -->

This outlet marker should remain unchanged in code blocks.
```
````

Inline code: `<!-- @outlet:also_not_replaced -->`

But this should be replaced: <!-- outlet: normal_outlet -->

## Another Example

```javascript
// This outlet should NOT be replaced: <!-- @outlet:js_comment -->
console.log('Hello World');
```

Normal content: <!-- outlet: content -->

````
Test code block preservation:
```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose code-template.md \
  --slot title="Code Block Test" \
  --slot normal_outlet="This gets replaced" \
  --slot content="This also gets replaced" \
  --slot this_should_not_be_replaced="This should not appear" \
  --slot also_not_replaced="This should not appear" \
  --slot js_comment="This should not appear"
````

### Extremely Long Content

Generate content with very long slot values:

```bash
# Create a very long content string (10KB)
LONG_CONTENT=$(printf 'A%.0s' {1..10000})

deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Long Content Test" \
  --slot long_content="$LONG_CONTENT" \
  --slot normal_content="Regular content"
```

### Empty and Whitespace Content

Test edge cases with empty and whitespace content:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot title="Whitespace Test" \
  --slot empty_slot="" \
  --slot whitespace_only="   " \
  --slot tabs_and_spaces="	  	  " \
  --slot newlines_only=$'\n\n\n' \
  --slot mixed_whitespace=$'  \n\t  \n  '
```

## Error Handling and Recovery

### Graceful Degradation

Configuration with mixed valid/invalid references:

```json
{
  "slots": {
    "valid_content": { "file": "./content/exists.md" },
    "invalid_file": { "file": "./content/does-not-exist.md" },
    "valid_inline": { "content": "This works fine" },
    "another_invalid": { "file": "./missing/file.md" }
  }
}
```

The CLI handles this gracefully:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --json mixed-validity-config.json \
  --verbose
# Completes successfully with warnings about missing files
```

### Network Path Handling (Cross-Platform)

Test with various path formats:

```bash
# Unix-style paths
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot content=@./content/unix-style.md \
  --slot other=@../other/file.md

# Windows-style paths (on Windows)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot content=@.\content\windows-style.md \
  --slot other=@..\other\file.md

# Mixed separators (should work on all platforms)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot content=@./content/mixed\path/file.md
```

### Large-Scale Batch Processing

Process multiple templates with shared configuration:

```bash
# Process multiple templates with the same config
for template in templates/*.md; do
  output_name=$(basename "$template" .md)
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose "$template" \
    --json shared-config.json \
    --slot template_name="$output_name" \
    --slot build_date="$(date)" \
    --output "output/${output_name}-generated.md" \
    --verbose
done
```

## Performance and Optimization

### Parallel Processing with Large Files

Configuration optimized for performance:

```json
{
  "slots": {
    "large_section_1": { "file": "./content/large-file-1.md" },
    "large_section_2": { "file": "./content/large-file-2.md" },
    "large_section_3": { "file": "./content/large-file-3.md" },
    "large_section_4": { "file": "./content/large-file-4.md" }
  },
  "options": {
    "parallel": true,
    "resolveFrom": "file"
  }
}
```

Process with performance monitoring:

```bash
time deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose large-template.md \
  --json performance-config.json \
  --output large-output.md \
  --verbose
```

### Memory-Efficient Processing

For very large documents, process in chunks:

```bash
# Process sections separately then combine
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose section1-template.md \
  --json section1-config.json \
  --output temp-section1.md

deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose section2-template.md \
  --json section2-config.json \
  --output temp-section2.md

# Combine sections
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose final-template.md \
  --slot section1=@temp-section1.md \
  --slot section2=@temp-section2.md \
  --output final-document.md

# Cleanup
rm temp-section*.md
```

## Integration with Build Systems

### Makefile Integration

```makefile
# Makefile
.PHONY: docs clean

TEMPLATES := $(wildcard templates/*.md)
OUTPUTS := $(TEMPLATES:templates/%.md=output/%.md)

docs: $(OUTPUTS)

output/%.md: templates/%.md configs/%.json
	@mkdir -p output
	deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose $< \
		--json configs/$*.json \
		--slot build_date="$(shell date)" \
		--slot version="$(VERSION)" \
		--output $@ \
		--verbose

clean:
	rm -rf output/

# Usage: make docs VERSION=1.2.0
```

### GitHub Actions Integration

```yaml
# .github/workflows/docs.yml
name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install markdown-slots
        run: npm install -g markdown-slots

      - name: Generate documentation
        run: |
          deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/template.md \
            --json docs/config.json \
            --slot version="${{ github.ref_name }}" \
            --slot commit="${{ github.sha }}" \
            --slot build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --output README.md \
            --verbose

      - name: Commit generated docs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add README.md
          git diff --staged --quiet || git commit -m "Auto-update documentation"
          git push
```

### NPM Scripts Integration

```json
{
  "scripts": {
    "docs:dev": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/template.md --json docs/dev-config.json --output README.md",
    "docs:prod": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/template.md --json docs/prod-config.json --output README.md",
    "docs:watch": "chokidar 'docs/**/*.md' 'docs/**/*.json' -c 'npm run docs:dev'",
    "docs:all": "npm run docs:api && npm run docs:guide && npm run docs:readme",
    "docs:api": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/api-template.md --json docs/api-config.json --output docs/API.md",
    "docs:guide": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/guide-template.md --json docs/guide-config.json --output docs/GUIDE.md",
    "docs:readme": "deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose docs/readme-template.md --json docs/readme-config.json --output README.md"
  }
}
```

## Debugging and Troubleshooting

### Verbose Output Analysis

Use verbose mode to understand complex compositions:

```bash
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose complex-template.md \
  --json complex-config.json \
  --verbose 2>&1 | tee debug.log
```

### Step-by-Step Debugging

Debug complex nested structures by testing each level:

```bash
# Test the base template first
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose base-template.md \
  --slot simple_slot="test content" \
  --verbose

# Test first level of nesting
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose base-template.md \
  --json level1-config.json \
  --verbose

# Test full complexity
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose base-template.md \
  --json full-config.json \
  --verbose
```

### Configuration Validation

Validate JSON configurations before use:

```bash
# Check JSON syntax
python -m json.tool config.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"

# Or use jq
jq empty config.json && echo "Valid JSON" || echo "Invalid JSON"

# Test with minimal template
echo "Test: <!-- outlet: test -->" > test-template.md
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose test-template.md \
  --json config.json \
  --slot test="validation test" \
  --verbose
```

## Cross-Platform Considerations

### Path Separator Handling

The CLI handles path separators automatically, but be aware of these patterns:

```bash
# These all work on any platform
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@./content/file.md
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@content/file.md
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@../other/file.md

# Absolute paths work but are not portable
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@/absolute/path/file.md  # Unix
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@C:\absolute\path\file.md  # Windows
```

### Line Ending Handling

The CLI preserves line endings from source files:

```bash
# Unix line endings (LF)
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@unix-file.md

# Windows line endings (CRLF) 
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md --slot content=@windows-file.md

# Mixed line endings are preserved as-is
```

### Character Encoding

The CLI handles UTF-8 encoding by default:

```bash
# Files with various encodings
deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose template.md \
  --slot utf8_content=@utf8-file.md \
  --slot ascii_content=@ascii-file.md \
  --slot unicode_content="Unicode: 🌍 中文 العربية"
```

## Best Practices for Advanced Usage

1. **Test incrementally**: Build complex configurations step by step
2. **Use verbose mode**: Always use `-v` when debugging complex compositions
3. **Validate JSON**: Check JSON syntax before using in production
4. **Handle errors gracefully**: Design templates to work even with missing content
5. **Document configurations**: Comment complex JSON structures
6. **Version control everything**: Include all templates, configs, and content files
7. **Use relative paths**: Make configurations portable across environments
8. **Test cross-platform**: Verify configurations work on different operating systems
9. **Monitor performance**: Use timing and verbose output for large compositions
10. **Backup before automation**: Test automated processes thoroughly before production use
