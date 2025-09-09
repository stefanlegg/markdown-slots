import { assertEquals } from '@std/assert';
import { DenoFileSystem } from '../src/filesystem.ts';

Deno.test('DenoFileSystem Integration', async (t) => {
  const fs = new DenoFileSystem();

  await t.step('should work with actual project files', async () => {
    // Test reading the README.md file that should exist
    const readmeExists = await fs.exists('README.md');
    assertEquals(readmeExists, true);

    const readmeContent = await fs.readFile('README.md');
    assertEquals(typeof readmeContent, 'string');
    assertEquals(readmeContent.length > 0, true);
    assertEquals(readmeContent.includes('Markdown Slots'), true);
  });

  await t.step('should work with deno.json configuration', async () => {
    const configExists = await fs.exists('deno.json');
    assertEquals(configExists, true);

    const configContent = await fs.readFile('deno.json');
    assertEquals(typeof configContent, 'string');
    assertEquals(configContent.includes('"name"'), true);
  });

  await t.step('should resolve paths correctly in project context', () => {
    // Test resolving from project root
    const srcPath = fs.resolvePath('src/mod.ts');
    assertEquals(srcPath.endsWith('src/mod.ts'), true);

    // Test resolving relative to a file
    const relativePath = fs.resolvePath('../types.ts', 'src/parser.ts', 'file');
    assertEquals(relativePath.includes('types.ts'), true);

    // More specific test - should resolve to src/types.ts from src/parser.ts
    const specificPath = fs.resolvePath('./types.ts', 'src/parser.ts', 'file');
    assertEquals(specificPath.endsWith('src/types.ts'), true);
  });
});
