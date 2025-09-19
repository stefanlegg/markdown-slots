```typescript
import { composeMarkdown } from 'markdown-slots';

const result = await composeMarkdown({
  content: '# Hello <!-- slot: name -->',
  slots: {
    name: { content: 'World' },
  },
});

console.log(result.markdown); // "# Hello World"
```