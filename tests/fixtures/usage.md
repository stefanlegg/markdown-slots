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
