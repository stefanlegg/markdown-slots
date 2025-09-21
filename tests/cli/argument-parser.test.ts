/**
 * Tests for the ArgumentParser class
 */

import { assertEquals, assertThrows } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ArgumentParser } from '../../src/cli/argument-parser.ts';
import { disableNetworkRequests } from '../../src/version.ts';

Deno.test('ArgumentParser', async (t) => {
  const parser = new ArgumentParser();

  // Disable network requests to prevent timer leaks in tests
  disableNetworkRequests();

  await t.step('should parse basic compose command', () => {
    const result = parser.parse(['compose', 'template.md']);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {});
    assertEquals(result.help, undefined);
    assertEquals(result.verbose, undefined);
  });

  await t.step('should parse template without compose command', () => {
    const result = parser.parse(['template.md']);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {});
  });

  await t.step('should parse long flag slot arguments', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'title=My Document',
      '--slot',
      'author=John Doe',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'My Document',
      author: 'John Doe',
    });
  });

  await t.step('should parse short flag slot arguments', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '-s',
      'title=My Document',
      '-s',
      'author=John Doe',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'My Document',
      author: 'John Doe',
    });
  });

  await t.step('should parse mixed long and short flags', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'title=My Document',
      '-s',
      'author=John Doe',
      '--slot',
      'content=@content.md',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'My Document',
      author: 'John Doe',
      content: '@content.md',
    });
  });

  await t.step('should parse file-based slot syntax', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'content=@content.md',
      '--slot',
      'footer=@footer.md',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      content: '@content.md',
      footer: '@footer.md',
    });
  });

  await t.step('should parse json flag with long form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--json',
      'config.json',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.json, 'config.json');
  });

  await t.step('should parse json flag with short form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '-j',
      'config.json',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.json, 'config.json');
  });

  await t.step('should parse output flag with long form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--output',
      'result.md',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.output, 'result.md');
  });

  await t.step('should parse output flag with short form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '-o',
      'result.md',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.output, 'result.md');
  });

  await t.step('should parse verbose flag with long form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--verbose',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.verbose, true);
  });

  await t.step('should parse verbose flag with short form', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '-v',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.verbose, true);
  });

  await t.step('should parse help flag with long form', () => {
    const result = parser.parse(['--help']);
    assertEquals(result.help, true);
    assertEquals(result.template, ''); // Help doesn't require template
  });

  await t.step('should parse help flag with short form', () => {
    const result = parser.parse(['-h']);
    assertEquals(result.help, true);
    assertEquals(result.template, ''); // Help doesn't require template
  });

  await t.step('should parse complex combination of all flags', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'title=My Document',
      '-s',
      'content=@content.md',
      '--json',
      'config.json',
      '-o',
      'result.md',
      '--verbose',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'My Document',
      content: '@content.md',
    });
    assertEquals(result.json, 'config.json');
    assertEquals(result.output, 'result.md');
    assertEquals(result.verbose, true);
  });

  await t.step('should handle slots with special characters in values', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'title=My "Special" Document & More',
      '--slot',
      'path=@/path/to/file.md',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'My "Special" Document & More',
      path: '@/path/to/file.md',
    });
  });

  await t.step('should handle empty slot values', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'empty=',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      empty: '',
    });
  });

  await t.step('should override duplicate slot names with last value', () => {
    const result = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'title=First Title',
      '--slot',
      'title=Second Title',
    ]);
    assertEquals(result.template, 'template.md');
    assertEquals(result.slots, {
      title: 'Second Title',
    });
  });

  await t.step('should validate slot names contain only valid characters', () => {
    // Valid slot names
    const validResult = parser.parse([
      'compose',
      'template.md',
      '--slot',
      'valid_name123=content',
    ]);
    assertEquals(validResult.slots, { valid_name123: 'content' });

    // Invalid slot names should throw
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot', 'invalid-name=content']),
      Error,
      'Invalid slot name: invalid-name',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot', 'invalid.name=content']),
      Error,
      'Invalid slot name: invalid.name',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot', 'invalid name=content']),
      Error,
      'Invalid slot name: invalid name',
    );
  });

  await t.step('should throw error for missing template', () => {
    assertThrows(
      () => parser.parse(['compose']),
      Error,
      'Template file is required after "compose" command',
    );

    assertThrows(
      () => parser.parse([]),
      Error,
      'Template file is required',
    );
  });

  await t.step('should throw error for missing slot value', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot']),
      Error,
      'Missing value for --slot flag',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '-s']),
      Error,
      'Missing value for -s flag',
    );
  });

  await t.step('should throw error for missing json value', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--json']),
      Error,
      'Missing value for --json flag',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '-j']),
      Error,
      'Missing value for -j flag',
    );
  });

  await t.step('should throw error for missing output value', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--output']),
      Error,
      'Missing value for --output flag',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '-o']),
      Error,
      'Missing value for -o flag',
    );
  });

  await t.step('should throw error for invalid slot format', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot', 'invalid_format']),
      Error,
      'Invalid slot format: invalid_format. Expected format: name=value or name=@file.md',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '--slot', '=value']),
      Error,
      'Empty slot name in: =value',
    );
  });

  await t.step('should throw error for unknown flags', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', '--unknown']),
      Error,
      'Unknown flag: --unknown',
    );

    assertThrows(
      () => parser.parse(['compose', 'template.md', '-x']),
      Error,
      'Unknown flag: -x',
    );
  });

  await t.step('should throw error for unexpected arguments', () => {
    assertThrows(
      () => parser.parse(['compose', 'template.md', 'unexpected']),
      Error,
      'Unexpected argument: unexpected',
    );
  });

  await t.step('should generate help text', async () => {
    const helpText = await parser.getHelpText();

    // Check that help text contains key sections
    assertEquals(helpText.includes('Markdown Slots CLI'), true);
    assertEquals(helpText.includes('USAGE:'), true);
    assertEquals(helpText.includes('ARGUMENTS:'), true);
    assertEquals(helpText.includes('OPTIONS:'), true);
    assertEquals(helpText.includes('EXAMPLES:'), true);
    assertEquals(helpText.includes('SLOT SYNTAX:'), true);
    assertEquals(helpText.includes('JSON CONFIG FORMAT:'), true);

    // Check that all flags are documented
    assertEquals(helpText.includes('--slot, -s'), true);
    assertEquals(helpText.includes('--json, -j'), true);
    assertEquals(helpText.includes('--output, -o'), true);
    assertEquals(helpText.includes('--verbose, -v'), true);
    assertEquals(helpText.includes('--help, -h'), true);

    // Check that examples include both long and short forms
    assertEquals(helpText.includes('-s title="My Document"'), true);
    assertEquals(helpText.includes('--slot title="My Document"'), true);
  });
});
