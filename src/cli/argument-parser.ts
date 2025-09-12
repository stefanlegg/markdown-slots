/**
 * Command-line argument parser for the Markdown Slots CLI
 */

import type { CliOptions } from '../types.ts';

/**
 * Parses command-line arguments into structured CLI options
 */
export class ArgumentParser {
  /**
   * Parse command-line arguments into CliOptions
   * @param args Array of command-line arguments
   * @returns Parsed CLI options
   * @throws Error if required arguments are missing or invalid
   */
  parse(args: string[]): CliOptions {
    const options: CliOptions = {
      template: '',
      slots: {},
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      switch (arg) {
        case 'compose':
          // Next argument should be the template file
          i++;
          if (i >= args.length) {
            throw new Error('Template file is required after "compose" command');
          }
          options.template = args[i];
          break;

        case '--slot':
        case '-s':
          i++;
          if (i >= args.length) {
            throw new Error(`Missing value for ${arg} flag`);
          }
          this.parseSlotArgument(args[i], options);
          break;

        case '--json':
        case '-j':
          i++;
          if (i >= args.length) {
            throw new Error(`Missing value for ${arg} flag`);
          }
          options.json = args[i];
          break;

        case '--output':
        case '-o':
          i++;
          if (i >= args.length) {
            throw new Error(`Missing value for ${arg} flag`);
          }
          options.output = args[i];
          break;

        case '--verbose':
        case '-v':
          options.verbose = true;
          break;

        case '--help':
        case '-h':
          options.help = true;
          break;

        default:
          // If we haven't seen the compose command yet and this doesn't start with -,
          // treat it as the template file
          if (!options.template && !arg.startsWith('-')) {
            options.template = arg;
          } else if (arg.startsWith('-')) {
            throw new Error(`Unknown flag: ${arg}`);
          } else {
            throw new Error(`Unexpected argument: ${arg}`);
          }
          break;
      }

      i++;
    }

    // Validate required arguments
    if (options.help) {
      return options; // Help doesn't require template
    }

    if (!options.template) {
      throw new Error(
        'Template file is required. Use: markdown-slots compose <template> or markdown-slots <template>',
      );
    }

    return options;
  }

  /**
   * Parse a slot argument in the format "name=value" or "name=@file.md"
   * @param slotArg The slot argument string
   * @param options The CLI options to update
   * @throws Error if the slot argument format is invalid
   */
  private parseSlotArgument(slotArg: string, options: CliOptions): void {
    const equalIndex = slotArg.indexOf('=');
    if (equalIndex === -1) {
      throw new Error(
        `Invalid slot format: ${slotArg}. Expected format: name=value or name=@file.md`,
      );
    }

    const name = slotArg.substring(0, equalIndex);
    const value = slotArg.substring(equalIndex + 1);

    if (!name) {
      throw new Error(`Empty slot name in: ${slotArg}`);
    }

    if (!this.isValidSlotName(name)) {
      throw new Error(
        `Invalid slot name: ${name}. Slot names must contain only alphanumeric characters and underscores`,
      );
    }

    // Store the raw value - the configuration loader will handle @file.md syntax
    options.slots[name] = value;
  }

  /**
   * Validate that a slot name contains only valid characters
   * @param name The slot name to validate
   * @returns True if the name is valid
   */
  private isValidSlotName(name: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(name);
  }

  /**
   * Generate help text for the CLI
   * @returns Formatted help text
   */
  getHelpText(): string {
    return `
Markdown Slots CLI - Compose Markdown files using slot/outlet patterns

USAGE:
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli compose <template> [options]
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli <template> [options]

ARGUMENTS:
  <template>    Path to the template Markdown file

OPTIONS:
  --slot, -s <name=value>     Fill a slot with inline content
  --slot, -s <name=@file.md>  Fill a slot with file content
  --json, -j <config.json>    Load slot configuration from JSON file
  --output, -o <file.md>      Write output to file instead of stdout
  --verbose, -v               Enable verbose output
  --help, -h                  Show this help message

EXAMPLES:
  # Basic composition with inline slots (long flags)
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot title="My Document" --slot author="John Doe"

  # Basic composition with inline slots (short flags)
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md -s title="My Document" -s author="John Doe"

  # Using file-based slots
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --slot content=@content.md --slot footer=@footer.md

  # JSON configuration
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json

  # Output to file
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md -s title="Test" -o result.md

  # Verbose output for debugging
  deno run -R -W jsr:@stefanlegg/markdown-slots/cli template.md --json config.json --verbose

JSR USAGE NOTE:
  When running from JSR, Deno caches the downloaded module. To get the latest version:
  deno run --reload -R -W jsr:@stefanlegg/markdown-slots/cli --help

SLOT SYNTAX:
  name=value      Use 'value' as literal content for slot 'name'
  name=@file.md   Use contents of 'file.md' for slot 'name'

JSON CONFIG FORMAT:
  {
    "slots": {
      "title": { "content": "My Document Title" },
      "content": { "file": "./content.md" },
      "nested": {
        "file": "./nested-template.md",
        "slots": {
          "section": { "file": "./section.md" }
        }
      }
    },
    "options": {
      "resolveFrom": "file",
      "onMissingSlot": "ignore"
    }
  }
`.trim();
  }
}
