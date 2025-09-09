# Project Documentation

**Version:** 1.0.0\
**Last Updated:** 2024-01-15

---

## Overview

This is a comprehensive guide to our project.

### Features

- ✅ Slot-based composition
- ✅ File and content sources
- ✅ Function-based dynamic content
- ✅ Circular dependency detection
- ✅ Configurable error handling

### Installation

```bash
npm install markdown-slots
```

### Usage

```typescript
import { composeMarkdown } from 'markdown-slots';

const result = await composeMarkdown({
  content: '# Hello <!-- outlet: name -->',
  slots: {
    name: { content: 'World' },
  },
});

console.log(result.markdown); // "# Hello World"
```

## Conclusion

---

_Generated with ❤️ by Markdown Slots_
