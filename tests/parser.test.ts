import { assertArrayIncludes, assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ContentParser } from '../src/parser.ts';

Deno.test('ContentParser', async (t) => {
  const parser = new ContentParser();

  await t.step('should find basic outlet markers', () => {
    const content = 'Hello <!-- outlet: header --> World <!-- outlet: footer -->';
    const outlets = parser.findOutlets(content);

    assertEquals(outlets.length, 2);
    assertEquals(outlets[0].name, 'header');
    assertEquals(outlets[1].name, 'footer');
  });

  await t.step('should ignore outlets in fenced code blocks', () => {
    const content = `
# Title

\`\`\`markdown
<!-- outlet: ignored -->
\`\`\`

<!-- outlet: valid -->
`;
    const outlets = parser.findOutlets(content);

    assertEquals(outlets.length, 1);
    assertEquals(outlets[0].name, 'valid');
  });

  await t.step('should ignore outlets in indented code blocks', () => {
    const content = `
# Title

    <!-- outlet: ignored -->
    Some code

<!-- outlet: valid -->
`;
    const outlets = parser.findOutlets(content);

    assertEquals(outlets.length, 1);
    assertEquals(outlets[0].name, 'valid');
  });

  await t.step('should handle outlets with various whitespace', () => {
    const content = `
<!--outlet:no-spaces-->
<!-- outlet: with-spaces -->
<!--  outlet:  extra-spaces  -->
`;
    const outlets = parser.findOutlets(content);

    assertEquals(outlets.length, 3);
    assertEquals(outlets[0].name, 'no-spaces');
    assertEquals(outlets[1].name, 'with-spaces');
    assertEquals(outlets[2].name, 'extra-spaces');
  });

  await t.step('should replace outlets with content', () => {
    const content = 'Hello <!-- outlet: greeting --> World';
    const replacements = { greeting: 'Beautiful' };
    const result = parser.replaceOutlets(content, replacements);

    assertEquals(result, 'Hello Beautiful World');
  });

  await t.step('should handle multiple replacements', () => {
    const content = '<!-- outlet: start -->Content<!-- outlet: end -->';
    const replacements = { start: 'BEGIN', end: 'FINISH' };
    const result = parser.replaceOutlets(content, replacements);

    assertEquals(result, 'BEGINContentFINISH');
  });

  await t.step('should preserve outlets without replacements', () => {
    const content = 'Hello <!-- outlet: missing --> World';
    const replacements = {};
    const result = parser.replaceOutlets(content, replacements);

    assertEquals(result, content);
  });

  await t.step('should not replace outlets in code blocks', () => {
    const content = `
# Title

\`\`\`
<!-- outlet: code -->
\`\`\`

<!-- outlet: text -->
`;
    const replacements = { code: 'REPLACED', text: 'REPLACED' };
    const result = parser.replaceOutlets(content, replacements);

    // Should only replace the text outlet, not the code outlet
    assertEquals(result.includes('<!-- outlet: code -->'), true);
    assertEquals(result.includes('REPLACED'), true);
    assertEquals(result.split('REPLACED').length, 2); // Only one replacement
  });

  await t.step('should identify code blocks correctly', () => {
    const content = `
# Title

\`\`\`javascript
const x = 1;
\`\`\`

    indented code
    more code

Regular text
`;
    const codeBlocks = parser.splitByCodeBlocks(content);

    assertEquals(codeBlocks.length, 2);
    assertEquals(codeBlocks[0].type, 'fenced');
    assertEquals(codeBlocks[1].type, 'indented');
  });

  await t.step('should get outlet names', () => {
    const content = 'Hello <!-- outlet: header --> and <!-- outlet: footer -->';
    const names = parser.getOutletNames(content);

    assertEquals(names.length, 2);
    assertArrayIncludes(names, ['header', 'footer']);
  });

  await t.step('should detect if content has outlets', () => {
    const withOutlets = 'Hello <!-- outlet: test -->';
    const withoutOutlets = 'Hello World';

    assertEquals(parser.hasOutlets(withOutlets), true);
    assertEquals(parser.hasOutlets(withoutOutlets), false);
  });

  await t.step('should handle edge cases', () => {
    // Empty content
    assertEquals(parser.findOutlets('').length, 0);

    // Only code blocks
    const onlyCode = '```\n<!-- outlet: test -->\n```';
    assertEquals(parser.findOutlets(onlyCode).length, 0);

    // Malformed outlets (should be ignored)
    const malformed = '<!-- outlet: --> <!-- outlet -->';
    assertEquals(parser.findOutlets(malformed).length, 0);
  });

  await t.step('should handle nested code blocks correctly', () => {
    const content = `
\`\`\`markdown
# Example

\`\`\`javascript
console.log('nested');
\`\`\`

<!-- outlet: inside -->
\`\`\`

<!-- outlet: outside -->
`;
    const outlets = parser.findOutlets(content);

    assertEquals(outlets.length, 1);
    assertEquals(outlets[0].name, 'outside');
  });
});
