import { assertEquals, assertRejects } from '@std/assert';
import { dirname, join, resolve } from '@std/path';
import { DenoFileSystem } from '../src/filesystem.ts';

Deno.test('DenoFileSystem', async (t) => {
  const fs = new DenoFileSystem();

  await t.step('should read existing files', async () => {
    // Create a temporary test file
    const testContent = 'Hello, World!';
    const testFile = './test_temp_file.txt';

    await Deno.writeTextFile(testFile, testContent);

    try {
      const content = await fs.readFile(testFile);
      assertEquals(content, testContent);
    } finally {
      // Clean up
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should throw error for non-existent files', async () => {
    await assertRejects(
      () => fs.readFile('./non_existent_file.txt'),
      Error,
      'File not found',
    );
  });

  await t.step('should check file existence correctly', async () => {
    // Create a temporary test file
    const testFile = './test_exists_file.txt';
    await Deno.writeTextFile(testFile, 'test');

    try {
      const exists = await fs.exists(testFile);
      assertEquals(exists, true);

      const notExists = await fs.exists('./definitely_not_exists.txt');
      assertEquals(notExists, false);
    } finally {
      // Clean up
      try {
        await Deno.remove(testFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should resolve absolute paths as-is', () => {
    const absolutePath = '/absolute/path/to/file.txt';
    const resolved = fs.resolvePath(absolutePath);
    assertEquals(resolved, absolutePath);
  });

  await t.step('should resolve relative paths from cwd by default', () => {
    const relativePath = 'relative/file.txt';
    const resolved = fs.resolvePath(relativePath);
    const expected = resolve(relativePath);
    assertEquals(resolved, expected);
  });

  await t.step('should resolve relative paths from cwd when explicitly specified', () => {
    const relativePath = 'relative/file.txt';
    const basePath = '/some/base/path.md';
    const resolved = fs.resolvePath(relativePath, basePath, 'cwd');
    const expected = resolve(relativePath);
    assertEquals(resolved, expected);
  });

  await t.step('should resolve relative paths from file parent directory', () => {
    const relativePath = 'relative/file.txt';
    const basePath = '/some/base/path.md';
    const resolved = fs.resolvePath(relativePath, basePath, 'file');
    const expected = resolve(dirname(basePath), relativePath);
    assertEquals(resolved, expected);
  });

  await t.step('should handle complex relative path resolution', () => {
    const relativePath = '../sibling/file.txt';
    const basePath = '/project/docs/readme.md';
    const resolved = fs.resolvePath(relativePath, basePath, 'file');
    const expected = resolve(dirname(basePath), relativePath);
    assertEquals(resolved, expected);
  });

  await t.step('should handle nested relative paths', () => {
    const relativePath = './nested/deep/file.txt';
    const basePath = '/project/src/main.ts';
    const resolved = fs.resolvePath(relativePath, basePath, 'file');
    const expected = resolve(dirname(basePath), relativePath);
    assertEquals(resolved, expected);
  });

  await t.step('should get current working directory', () => {
    const cwd = fs.getCwd();
    assertEquals(typeof cwd, 'string');
    assertEquals(cwd.length > 0, true);
  });

  await t.step('should join path segments correctly', () => {
    const joined = fs.joinPath('path', 'to', 'file.txt');
    const expected = join('path', 'to', 'file.txt');
    assertEquals(joined, expected);
  });

  await t.step('should handle edge cases in path resolution', () => {
    // Empty relative path
    const emptyPath = fs.resolvePath('');
    assertEquals(emptyPath, resolve(''));

    // Dot path
    const dotPath = fs.resolvePath('.');
    assertEquals(dotPath, resolve('.'));

    // Double dot path
    const doubleDotPath = fs.resolvePath('..');
    assertEquals(doubleDotPath, resolve('..'));
  });

  await t.step('should handle file resolution without basePath', () => {
    const relativePath = 'file.txt';
    const resolved = fs.resolvePath(relativePath, undefined, 'file');
    const expected = resolve(relativePath);
    assertEquals(resolved, expected);
  });
});
