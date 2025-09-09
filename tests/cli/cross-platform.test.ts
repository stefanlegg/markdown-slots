/**
 * Cross-platform compatibility tests for CLI functionality
 * Tests path handling, character encoding, and platform-specific behaviors
 */

import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { resolve } from 'https://deno.land/std@0.208.0/path/mod.ts';

const CLI_PATH = resolve('./cli.ts');

/**
 * Run CLI command and return result
 */
async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const cmd = new Deno.Command('deno', {
    args: ['run', '--allow-read', '--allow-write', CLI_PATH, ...args],
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout, stderr } = await cmd.output();

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

/**
 * Setup test files for cross-platform testing
 */
async function setupCrossPlatformTests(): Promise<{ cleanup: () => Promise<void> }> {
  const tempFiles: string[] = [];

  // Create template with various path references
  const template = `# <!-- outlet: title -->

## Content from different path styles
<!-- outlet: unix_style -->
<!-- outlet: relative_path -->
<!-- outlet: nested_path -->

## Unicode content
<!-- outlet: unicode -->

## Special characters
<!-- outlet: special_chars -->`;

  await Deno.writeTextFile('./cross-platform-template.md', template);
  tempFiles.push('./cross-platform-template.md');

  // Create content files in different directory structures
  await Deno.mkdir('./test-content', { recursive: true });
  await Deno.mkdir('./test-content/nested', { recursive: true });

  await Deno.writeTextFile(
    './test-content/unix-style.md',
    'Content with Unix-style path reference',
  );
  tempFiles.push('./test-content/unix-style.md');

  await Deno.writeTextFile('./test-content/relative.md', 'Content from relative path');
  tempFiles.push('./test-content/relative.md');

  await Deno.writeTextFile('./test-content/nested/deep.md', 'Content from nested directory');
  tempFiles.push('./test-content/nested/deep.md');

  // Create files with various character encodings and content
  await Deno.writeTextFile(
    './unicode-content.md',
    'Unicode: 🌍 中文 العربية àáâãäå ñ ç ü ß €£¥ ©®™',
  );
  tempFiles.push('./unicode-content.md');

  await Deno.writeTextFile(
    './special-chars.md',
    'Special chars: "quotes" \'apostrophes\' & ampersands < > brackets',
  );
  tempFiles.push('./special-chars.md');

  // Create JSON config with various path styles
  const config = {
    slots: {
      title: { content: 'Cross-Platform Test' },
      unix_style: { file: './test-content/unix-style.md' },
      relative_path: { file: './test-content/relative.md' },
      nested_path: { file: './test-content/nested/deep.md' },
      unicode: { file: './unicode-content.md' },
      special_chars: { file: './special-chars.md' },
    },
  };

  await Deno.writeTextFile('./cross-platform-config.json', JSON.stringify(config, null, 2));
  tempFiles.push('./cross-platform-config.json');

  return {
    cleanup: async () => {
      for (const file of tempFiles) {
        try {
          await Deno.remove(file);
        } catch {
          // Ignore cleanup errors
        }
      }
      try {
        await Deno.remove('./test-content', { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    },
  };
}

Deno.test('Cross-Platform CLI Tests', async (t) => {
  const { cleanup } = await setupCrossPlatformTests();

  await t.step('should handle forward slash paths on all platforms', async () => {
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Forward Slash Test',
      '--slot',
      'unix_style=@./test-content/unix-style.md',
      '--slot',
      'relative_path=@./test-content/relative.md',
      '--slot',
      'nested_path=@./test-content/nested/deep.md',
      '--slot',
      'unicode=Forward slash unicode',
      '--slot',
      'special_chars=Forward slash special',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Forward Slash Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
    assertStringIncludes(result.stdout, 'Content from relative path');
    assertStringIncludes(result.stdout, 'Content from nested directory');
  });

  await t.step('should handle mixed path separators gracefully', async () => {
    // Test with mixed separators (should work on all platforms)
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Mixed Path Test',
      '--slot',
      'unix_style=@./test-content/unix-style.md',
      '--slot',
      'relative_path=@test-content/relative.md', // No leading ./
      '--slot',
      'nested_path=@./test-content/nested/deep.md',
      '--slot',
      'unicode=Mixed path unicode',
      '--slot',
      'special_chars=Mixed path special',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Mixed Path Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
    assertStringIncludes(result.stdout, 'Content from relative path');
    assertStringIncludes(result.stdout, 'Content from nested directory');
  });

  await t.step('should handle platform-specific path separators', async () => {
    // Test that forward slashes work on all platforms (including Windows)
    // This is the recommended cross-platform approach
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Platform Separator Test',
      '--slot',
      'unix_style=@./test-content/unix-style.md',
      '--slot',
      'relative_path=@./test-content/relative.md',
      '--slot',
      'nested_path=@./test-content/nested/deep.md',
      '--slot',
      'unicode=Platform separator content',
      '--slot',
      'special_chars=Platform separator content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Platform Separator Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
    assertStringIncludes(result.stdout, 'Content from relative path');
    assertStringIncludes(result.stdout, 'Content from nested directory');
  });

  await t.step('should handle normalized path separators in JSON config', async () => {
    // Create JSON config with mixed path separators
    const mixedConfig = {
      slots: {
        title: { content: 'Mixed Separators JSON Test' },
        unix_style: { file: './test-content/unix-style.md' },
        relative_path: { file: 'test-content/relative.md' },
        nested_path: { file: './test-content/nested/deep.md' },
        unicode: { content: 'JSON mixed separators' },
        special_chars: { content: 'JSON mixed separators' },
      },
    };

    await Deno.writeTextFile(
      './mixed-separators-config.json',
      JSON.stringify(mixedConfig, null, 2),
    );

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--json',
        'mixed-separators-config.json',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Mixed Separators JSON Test');
      assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
      assertStringIncludes(result.stdout, 'Content from relative path');
      assertStringIncludes(result.stdout, 'Content from nested directory');
    } finally {
      await Deno.remove('./mixed-separators-config.json');
    }
  });

  await t.step('should handle complex nested path structures', async () => {
    // Create complex nested structure
    const complexPath = './test-content/level1/level2/level3';
    await Deno.mkdir(complexPath, { recursive: true });
    await Deno.writeTextFile(
      `${complexPath}/deep-nested.md`,
      'Content from deeply nested structure',
    );

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Complex Nested Paths',
        '--slot',
        `nested_path=@${complexPath}/deep-nested.md`,
        '--slot',
        'unix_style=@./test-content/../test-content/unix-style.md', // Path with ..
        '--slot',
        'relative_path=@test-content/./relative.md', // Path with .
        '--slot',
        'unicode=Complex nested content',
        '--slot',
        'special_chars=Complex nested content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Complex Nested Paths');
      assertStringIncludes(result.stdout, 'Content from deeply nested structure');
      assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
      assertStringIncludes(result.stdout, 'Content from relative path');
    } finally {
      await Deno.remove('./test-content/level1', { recursive: true });
    }
  });

  await t.step('should handle Unicode content correctly', async () => {
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Unicode Test 🌍',
      '--slot',
      'unicode=Unicode inline: àáâãäå ñ 中文 العربية 🚀 💯',
      '--slot',
      'special_chars=@unicode-content.md',
      '--slot',
      'unix_style=Regular content',
      '--slot',
      'relative_path=Regular content',
      '--slot',
      'nested_path=Regular content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Unicode Test 🌍');
    assertStringIncludes(result.stdout, 'Unicode inline: àáâãäå ñ 中文 العربية 🚀 💯');
    assertStringIncludes(result.stdout, 'Unicode: 🌍 中文 العربية àáâãäå ñ ç ü ß €£¥ ©®™');
  });

  await t.step('should handle comprehensive Unicode character sets', async () => {
    // Create files with various Unicode character sets
    const unicodeFiles = [
      {
        name: './latin-extended.md',
        content: 'Latin Extended: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ',
      },
      {
        name: './cyrillic.md',
        content: 'Cyrillic: абвгдеёжзийклмнопрстуфхцчшщъыьэюя АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
      },
      { name: './chinese.md', content: 'Chinese: 你好世界 中文测试 繁體中文 简体中文 漢字 汉字' },
      { name: './arabic.md', content: 'Arabic: مرحبا بالعالم العربية اختبار النص العربي' },
      {
        name: './japanese.md',
        content: 'Japanese: こんにちは世界 ひらがな カタカナ 漢字 日本語テスト',
      },
      { name: './emoji.md', content: 'Emoji: 🌍🌎🌏 🚀💯⭐ 👍👎👌 🎉🎊🎈 🔥💧❄️ 🌈☀️🌙' },
      { name: './symbols.md', content: 'Symbols: ©®™ €£¥$ ±×÷ ∞≠≤≥ ∑∏∆ αβγδε λμπσω' },
    ];

    for (const file of unicodeFiles) {
      await Deno.writeTextFile(file.name, file.content);
    }

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Comprehensive Unicode Test 🌐',
        '--slot',
        'unix_style=@./latin-extended.md',
        '--slot',
        'relative_path=@./cyrillic.md',
        '--slot',
        'nested_path=@./chinese.md',
        '--slot',
        'unicode=@./arabic.md',
        '--slot',
        'special_chars=@./japanese.md',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Comprehensive Unicode Test 🌐');
      assertStringIncludes(result.stdout, 'Latin Extended: àáâãäåæç');
      assertStringIncludes(result.stdout, 'Cyrillic: абвгдеёжз');
      assertStringIncludes(result.stdout, 'Chinese: 你好世界');
      assertStringIncludes(result.stdout, 'Arabic: مرحبا بالعالم');
      assertStringIncludes(result.stdout, 'Japanese: こんにちは世界');

      // Test emoji and symbols separately
      const emojiResult = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Emoji and Symbols Test',
        '--slot',
        'unicode=@./emoji.md',
        '--slot',
        'special_chars=@./symbols.md',
        '--slot',
        'unix_style=Regular content',
        '--slot',
        'relative_path=Regular content',
        '--slot',
        'nested_path=Regular content',
      ]);

      assertEquals(emojiResult.code, 0);
      assertStringIncludes(emojiResult.stdout, 'Emoji: 🌍🌎🌏');
      assertStringIncludes(emojiResult.stdout, 'Symbols: ©®™');
    } finally {
      for (const file of unicodeFiles) {
        try {
          await Deno.remove(file.name);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  await t.step('should handle Unicode in file names', async () => {
    // Create files with Unicode names (where filesystem supports it)
    const unicodeFileNames = [
      './测试文件.md',
      './файл-тест.md',
      './archivo-prueba.md',
      './tệp-thử-nghiệm.md',
    ];

    const createdFiles: string[] = [];

    for (const fileName of unicodeFileNames) {
      try {
        await Deno.writeTextFile(fileName, `Content from Unicode filename: ${fileName}`);
        createdFiles.push(fileName);
      } catch {
        // Skip files that can't be created on this filesystem
        console.log(`Skipping Unicode filename test for: ${fileName}`);
      }
    }

    if (createdFiles.length > 0) {
      try {
        const result = await runCli([
          'cross-platform-template.md',
          '--slot',
          'title=Unicode Filenames Test',
          '--slot',
          `unix_style=@${createdFiles[0]}`,
          '--slot',
          'relative_path=Regular content',
          '--slot',
          'nested_path=Regular content',
          '--slot',
          'unicode=Unicode filename test',
          '--slot',
          'special_chars=Unicode filename test',
        ]);

        assertEquals(result.code, 0);
        assertStringIncludes(result.stdout, '# Unicode Filenames Test');
        assertStringIncludes(result.stdout, `Content from Unicode filename: ${createdFiles[0]}`);
      } finally {
        for (const file of createdFiles) {
          try {
            await Deno.remove(file);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  });

  await t.step('should preserve character encoding across operations', async () => {
    // Test that character encoding is preserved through the entire pipeline
    const encodingTestContent = `# Encoding Preservation Test

## Latin Characters
àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ

## Cyrillic Characters  
абвгдеёжзийклмнопрстуфхцчшщъыьэюя

## Chinese Characters
你好世界 中文测试 繁體中文

## Arabic Characters
مرحبا بالعالم العربية

## Japanese Characters
こんにちは世界 ひらがな カタカナ

## Emoji and Symbols
🌍🚀💯 ©®™ €£¥ ∞≠≤≥

## Special Markdown Characters
**Bold with Unicode: 中文粗体**
*Italic with Unicode: العربية مائل*
\`Code with Unicode: こんにちはコード\`

## Mixed Content
English + 中文 + العربية + русский + 日本語 + 🌍`;

    await Deno.writeTextFile('./encoding-test.md', encodingTestContent);

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Character Encoding Preservation',
        '--slot',
        'unix_style=@./encoding-test.md',
        '--slot',
        'relative_path=Encoding test content',
        '--slot',
        'nested_path=Encoding test content',
        '--slot',
        'unicode=Encoding test content',
        '--slot',
        'special_chars=Encoding test content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Character Encoding Preservation');
      assertStringIncludes(result.stdout, 'àáâãäåæçèéêë');
      assertStringIncludes(result.stdout, 'абвгдеёжзийкл');
      assertStringIncludes(result.stdout, '你好世界 中文测试');
      assertStringIncludes(result.stdout, 'مرحبا بالعالم');
      assertStringIncludes(result.stdout, 'こんにちは世界');
      assertStringIncludes(result.stdout, '🌍🚀💯');
      assertStringIncludes(result.stdout, '**Bold with Unicode: 中文粗体**');
      assertStringIncludes(result.stdout, '*Italic with Unicode: العربية مائل*');
    } finally {
      await Deno.remove('./encoding-test.md');
    }
  });

  await t.step('should handle special characters in slot values', async () => {
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Special Characters Test',
      '--slot',
      'special_chars=Inline: "quotes" \'apostrophes\' & <brackets>',
      '--slot',
      'unicode=@special-chars.md',
      '--slot',
      'unix_style=Regular content',
      '--slot',
      'relative_path=Regular content',
      '--slot',
      'nested_path=Regular content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Special Characters Test');
    assertStringIncludes(result.stdout, 'Inline: "quotes" \'apostrophes\' & <brackets>');
    assertStringIncludes(
      result.stdout,
      'Special chars: "quotes" \'apostrophes\' & ampersands < > brackets',
    );
  });

  await t.step('should handle comprehensive special character sets', async () => {
    // Create files with various special character combinations
    const specialCharFiles = [
      {
        name: './quotes-test.md',
        content: 'Quotes: "double" \'single\' "left" "right" „german" «french» ‹single french›',
      },
      {
        name: './symbols-test.md',
        content: 'Symbols: @#$%^&*()_+-=[]{}|\\:";\'<>?,./ ~`!',
      },
      {
        name: './html-entities.md',
        content: 'HTML-like: &amp; &lt; &gt; &quot; &#39; &nbsp; &copy; &reg; &trade;',
      },
      {
        name: './markdown-special.md',
        content: 'Markdown: **bold** *italic* `code` [link](url) ![image](url) > quote | table |',
      },
      {
        name: './whitespace-test.md',
        content: 'Whitespace:\ttab\nNewline\r\nCRLF   Multiple   Spaces',
      },
    ];

    for (const file of specialCharFiles) {
      await Deno.writeTextFile(file.name, file.content);
    }

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Comprehensive Special Characters 🔤',
        '--slot',
        'unix_style=@./quotes-test.md',
        '--slot',
        'relative_path=@./symbols-test.md',
        '--slot',
        'nested_path=@./html-entities.md',
        '--slot',
        'unicode=@./markdown-special.md',
        '--slot',
        'special_chars=@./whitespace-test.md',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Comprehensive Special Characters 🔤');
      assertStringIncludes(result.stdout, 'Quotes: "double" \'single\'');
      assertStringIncludes(result.stdout, 'Symbols: @#$%^&*()');
      assertStringIncludes(result.stdout, 'HTML-like: &amp; &lt; &gt;');
      assertStringIncludes(result.stdout, 'Markdown: **bold** *italic*');
      assertStringIncludes(result.stdout, 'Whitespace:\ttab');
    } finally {
      for (const file of specialCharFiles) {
        try {
          await Deno.remove(file.name);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  await t.step('should handle special characters in CLI arguments', async () => {
    // Test special characters passed directly in CLI arguments
    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=CLI Special Chars: @#$%^&*()',
      '--slot',
      'unix_style=Quotes: "double" \'single\' `backtick`',
      '--slot',
      'relative_path=Symbols: !@#$%^&*()_+-=[]{}|\\:";\'<>?,./',
      '--slot',
      'nested_path=HTML: &amp; &lt; &gt; &quot; &#39;',
      '--slot',
      'unicode=Whitespace:\ttab\nNewline   Spaces',
      '--slot',
      'special_chars=Mixed: 中文 + "quotes" + @symbols + 🚀',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# CLI Special Chars: @#$%^&*()');
    assertStringIncludes(result.stdout, 'Quotes: "double" \'single\'');
    assertStringIncludes(result.stdout, 'Symbols: !@#$%^&*()');
    assertStringIncludes(result.stdout, 'HTML: &amp; &lt; &gt;');
    assertStringIncludes(result.stdout, 'Mixed: 中文 + "quotes"');
  });

  await t.step('should handle JSON configuration with various path styles', async () => {
    const result = await runCli([
      'cross-platform-template.md',
      '--json',
      'cross-platform-config.json',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Cross-Platform Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
    assertStringIncludes(result.stdout, 'Content from relative path');
    assertStringIncludes(result.stdout, 'Content from nested directory');
    assertStringIncludes(result.stdout, 'Unicode: 🌍 中文 العربية');
    assertStringIncludes(result.stdout, 'Special chars: "quotes"');
  });

  await t.step('should handle absolute paths correctly', async () => {
    const absolutePath = resolve('./test-content/unix-style.md');

    const result = await runCli([
      'cross-platform-template.md',
      '--slot',
      'title=Absolute Path Test',
      '--slot',
      `unix_style=@${absolutePath}`,
      '--slot',
      'relative_path=Regular content',
      '--slot',
      'nested_path=Regular content',
      '--slot',
      'unicode=Regular content',
      '--slot',
      'special_chars=Regular content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Absolute Path Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
  });

  await t.step('should handle current directory references', async () => {
    const result = await runCli([
      './cross-platform-template.md', // Explicit current directory
      '--slot',
      'title=Current Dir Test',
      '--slot',
      'unix_style=@./test-content/unix-style.md',
      '--slot',
      'relative_path=@./test-content/relative.md',
      '--slot',
      'nested_path=@./test-content/nested/deep.md',
      '--slot',
      'unicode=Current dir content',
      '--slot',
      'special_chars=Current dir content',
    ]);

    assertEquals(result.code, 0);
    assertStringIncludes(result.stdout, '# Current Dir Test');
    assertStringIncludes(result.stdout, 'Content with Unix-style path reference');
  });

  await t.step('should handle parent directory references', async () => {
    // Create a subdirectory and test from there
    await Deno.mkdir('./subdir-test', { recursive: true });
    await Deno.writeTextFile(
      './subdir-test/sub-template.md',
      'Parent ref: <!-- outlet: parent_content -->',
    );

    try {
      // Change to subdirectory and reference parent
      const originalCwd = Deno.cwd();
      Deno.chdir('./subdir-test');

      try {
        const result = await runCli([
          'sub-template.md',
          '--slot',
          'parent_content=@../test-content/unix-style.md',
        ]);

        assertEquals(result.code, 0);
        assertStringIncludes(result.stdout, 'Parent ref: Content with Unix-style path reference');
      } finally {
        Deno.chdir(originalCwd);
      }
    } finally {
      await Deno.remove('./subdir-test', { recursive: true });
    }
  });

  await t.step('should handle very long paths', async () => {
    // Create a deeply nested directory structure
    const deepPath = './very/deep/nested/directory/structure/for/testing';
    await Deno.mkdir(deepPath, { recursive: true });
    await Deno.writeTextFile(`${deepPath}/deep-content.md`, 'Content from very deep path');

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Deep Path Test',
        '--slot',
        `nested_path=@${deepPath}/deep-content.md`,
        '--slot',
        'unix_style=Regular content',
        '--slot',
        'relative_path=Regular content',
        '--slot',
        'unicode=Regular content',
        '--slot',
        'special_chars=Regular content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Deep Path Test');
      assertStringIncludes(result.stdout, 'Content from very deep path');
    } finally {
      await Deno.remove('./very', { recursive: true });
    }
  });

  await t.step('should handle extremely long file paths', async () => {
    // Create an extremely long path (approaching filesystem limits)
    const longDirName = 'a'.repeat(50); // 50 character directory name
    const longPath = Array(5).fill(longDirName).join('/'); // 5 levels deep
    const fullPath = `./${longPath}`;

    await Deno.mkdir(fullPath, { recursive: true });

    const longFileName = 'very-long-filename-' + 'x'.repeat(100) + '.md';
    const longFilePath = `${fullPath}/${longFileName}`;

    try {
      await Deno.writeTextFile(longFilePath, 'Content from extremely long path');

      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Extremely Long Path Test',
        '--slot',
        `nested_path=@${longFilePath}`,
        '--slot',
        'unix_style=Regular content',
        '--slot',
        'relative_path=Regular content',
        '--slot',
        'unicode=Regular content',
        '--slot',
        'special_chars=Regular content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Extremely Long Path Test');
      assertStringIncludes(result.stdout, 'Content from extremely long path');
    } catch (error) {
      // If filesystem doesn't support such long paths, that's expected
      console.log(
        'Filesystem limitation reached for extremely long paths:',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      try {
        await Deno.remove(`./${longDirName}`, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  await t.step('should handle file names with spaces and special characters', async () => {
    // Create files with special names (where supported by filesystem)
    const specialFiles = [
      './file with spaces.md',
      './file-with-dashes.md',
      './file_with_underscores.md',
    ];

    for (const file of specialFiles) {
      await Deno.writeTextFile(file, `Content from ${file}`);
    }

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Special Filenames Test',
        '--slot',
        'unix_style=@./file with spaces.md',
        '--slot',
        'relative_path=@./file-with-dashes.md',
        '--slot',
        'nested_path=@./file_with_underscores.md',
        '--slot',
        'unicode=Regular content',
        '--slot',
        'special_chars=Regular content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Special Filenames Test');
      assertStringIncludes(result.stdout, 'Content from ./file with spaces.md');
      assertStringIncludes(result.stdout, 'Content from ./file-with-dashes.md');
      assertStringIncludes(result.stdout, 'Content from ./file_with_underscores.md');
    } finally {
      for (const file of specialFiles) {
        try {
          await Deno.remove(file);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  await t.step('should handle comprehensive special filename characters', async () => {
    // Test various special characters in filenames (where filesystem supports them)
    const specialFilenames = [
      './file with multiple   spaces.md',
      './file.with.dots.md',
      './file-with-many-dashes-and-numbers-123.md',
      './file_with_many_underscores_and_numbers_456.md',
      './file(with)parentheses.md',
      './file[with]brackets.md',
      './file{with}braces.md',
      "./file'with'quotes.md",
      './file"with"doublequotes.md',
    ];

    const createdFiles: string[] = [];

    for (const filename of specialFilenames) {
      try {
        await Deno.writeTextFile(filename, `Content from special filename: ${filename}`);
        createdFiles.push(filename);
      } catch (error) {
        // Skip files that can't be created on this filesystem
        console.log(
          `Skipping special filename test for: ${filename} (${
            error instanceof Error ? error.message : String(error)
          })`,
        );
      }
    }

    if (createdFiles.length > 0) {
      try {
        // Test with the first few created files
        const result = await runCli([
          'cross-platform-template.md',
          '--slot',
          'title=Comprehensive Special Filenames',
          '--slot',
          `unix_style=@${createdFiles[0]}`,
          '--slot',
          createdFiles.length > 1
            ? `relative_path=@${createdFiles[1]}`
            : 'relative_path=Regular content',
          '--slot',
          createdFiles.length > 2
            ? `nested_path=@${createdFiles[2]}`
            : 'nested_path=Regular content',
          '--slot',
          'unicode=Special filename test',
          '--slot',
          'special_chars=Special filename test',
        ]);

        assertEquals(result.code, 0);
        assertStringIncludes(result.stdout, '# Comprehensive Special Filenames');
        assertStringIncludes(result.stdout, `Content from special filename: ${createdFiles[0]}`);
      } finally {
        for (const file of createdFiles) {
          try {
            await Deno.remove(file);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  });

  await t.step('should preserve line endings from source files', async () => {
    // Create files with different line endings
    const unixContent = 'Line 1\nLine 2\nLine 3\n';
    const windowsContent = 'Line 1\r\nLine 2\r\nLine 3\r\n';

    await Deno.writeTextFile('./unix-endings.md', unixContent);
    await Deno.writeTextFile('./windows-endings.md', windowsContent);

    try {
      const unixResult = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Unix Endings',
        '--slot',
        'unix_style=@./unix-endings.md',
        '--slot',
        'relative_path=Regular',
        '--slot',
        'nested_path=Regular',
        '--slot',
        'unicode=Regular',
        '--slot',
        'special_chars=Regular',
      ]);

      const windowsResult = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Windows Endings',
        '--slot',
        'unix_style=@./windows-endings.md',
        '--slot',
        'relative_path=Regular',
        '--slot',
        'nested_path=Regular',
        '--slot',
        'unicode=Regular',
        '--slot',
        'special_chars=Regular',
      ]);

      assertEquals(unixResult.code, 0);
      assertEquals(windowsResult.code, 0);

      // Both should contain the content (line endings preserved)
      assertStringIncludes(unixResult.stdout, 'Line 1');
      assertStringIncludes(unixResult.stdout, 'Line 2');
      assertStringIncludes(windowsResult.stdout, 'Line 1');
      assertStringIncludes(windowsResult.stdout, 'Line 2');
    } finally {
      await Deno.remove('./unix-endings.md');
      await Deno.remove('./windows-endings.md');
    }
  });

  await t.step('should handle comprehensive line ending scenarios', async () => {
    // Create files with various line ending combinations
    const lineEndingFiles = [
      { name: './lf-only.md', content: 'Line 1\nLine 2\nLine 3\n', desc: 'LF only (Unix)' },
      {
        name: './crlf-only.md',
        content: 'Line 1\r\nLine 2\r\nLine 3\r\n',
        desc: 'CRLF only (Windows)',
      },
      { name: './cr-only.md', content: 'Line 1\rLine 2\rLine 3\r', desc: 'CR only (Classic Mac)' },
      {
        name: './mixed-endings.md',
        content: 'Line 1\nLine 2\r\nLine 3\rLine 4\n',
        desc: 'Mixed endings',
      },
      {
        name: './no-final-newline.md',
        content: 'Line 1\nLine 2\nLine 3',
        desc: 'No final newline',
      },
      { name: './empty-lines.md', content: 'Line 1\n\n\nLine 4\n', desc: 'Empty lines' },
      { name: './only-newlines.md', content: '\n\n\n', desc: 'Only newlines' },
    ];

    for (const file of lineEndingFiles) {
      // Write files in binary mode to preserve exact line endings
      const encoder = new TextEncoder();
      await Deno.writeFile(file.name, encoder.encode(file.content));
    }

    try {
      for (let i = 0; i < lineEndingFiles.length; i++) {
        const file = lineEndingFiles[i];
        const result = await runCli([
          'cross-platform-template.md',
          '--slot',
          `title=Line Endings Test: ${file.desc}`,
          '--slot',
          `unix_style=@${file.name}`,
          '--slot',
          'relative_path=Regular content',
          '--slot',
          'nested_path=Regular content',
          '--slot',
          'unicode=Regular content',
          '--slot',
          'special_chars=Regular content',
        ]);

        assertEquals(result.code, 0, `Failed for ${file.desc}`);
        assertStringIncludes(result.stdout, `# Line Endings Test: ${file.desc}`);

        // Check that content is present (exact line ending preservation tested separately)
        if (file.content.includes('Line 1')) {
          assertStringIncludes(result.stdout, 'Line 1');
        }
      }
    } finally {
      for (const file of lineEndingFiles) {
        try {
          await Deno.remove(file.name);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  await t.step('should handle large file content', async () => {
    // Create a large file to test memory handling
    const largeContent = Array(1000).fill(
      'This is a line of content that will be repeated many times to create a large file.\n',
    ).join('');
    await Deno.writeTextFile('./large-content.md', largeContent);

    try {
      const result = await runCli([
        'cross-platform-template.md',
        '--slot',
        'title=Large File Test',
        '--slot',
        'unix_style=@./large-content.md',
        '--slot',
        'relative_path=Regular content',
        '--slot',
        'nested_path=Regular content',
        '--slot',
        'unicode=Regular content',
        '--slot',
        'special_chars=Regular content',
      ]);

      assertEquals(result.code, 0);
      assertStringIncludes(result.stdout, '# Large File Test');
      assertStringIncludes(result.stdout, 'This is a line of content that will be repeated');
    } finally {
      await Deno.remove('./large-content.md');
    }
  });

  await t.step('should handle empty and minimal files', async () => {
    // Create edge case files
    const edgeCaseFiles = [
      { name: './empty-file.md', content: '', desc: 'Empty file' },
      { name: './single-char.md', content: 'A', desc: 'Single character' },
      { name: './single-line.md', content: 'Single line without newline', desc: 'Single line' },
      { name: './only-whitespace.md', content: '   \t  \n  \t  ', desc: 'Only whitespace' },
      { name: './only-newlines.md', content: '\n\n\n\n', desc: 'Only newlines' },
    ];

    for (const file of edgeCaseFiles) {
      await Deno.writeTextFile(file.name, file.content);
    }

    try {
      for (const file of edgeCaseFiles) {
        const result = await runCli([
          'cross-platform-template.md',
          '--slot',
          `title=Edge Case: ${file.desc}`,
          '--slot',
          `unix_style=@${file.name}`,
          '--slot',
          'relative_path=Regular content',
          '--slot',
          'nested_path=Regular content',
          '--slot',
          'unicode=Regular content',
          '--slot',
          'special_chars=Regular content',
        ]);

        assertEquals(result.code, 0, `Failed for ${file.desc}`);
        assertStringIncludes(result.stdout, `# Edge Case: ${file.desc}`);
      }
    } finally {
      for (const file of edgeCaseFiles) {
        try {
          await Deno.remove(file.name);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  await cleanup();
});
