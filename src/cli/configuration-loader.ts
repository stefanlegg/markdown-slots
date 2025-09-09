/**
 * Configuration loader for the Markdown Slots CLI
 * Handles loading JSON configuration and merging with CLI arguments
 */

import { dirname, resolve } from '@std/path';
import type { CliOptions, JsonConfig, MarkdownNode, MarkdownSlotSource } from '../types.ts';

/**
 * Loads and merges configuration from JSON files and CLI arguments
 */
export class ConfigurationLoader {
  /**
   * Load configuration from CLI options and optional JSON file
   * @param options CLI options containing template, slots, and JSON config path
   * @returns MarkdownNode ready for composition
   * @throws Error if JSON config cannot be loaded or parsed
   */
  async load(options: CliOptions): Promise<MarkdownNode> {
    let jsonConfig: JsonConfig = {};

    // Load JSON configuration if provided
    if (options.json) {
      jsonConfig = await this.loadJsonConfig(options.json);
    }

    // Convert CLI slots to MarkdownSlotSource format
    const cliSlots = await this.parseCliSlots(options.slots, options.json);

    // Merge configurations (CLI takes precedence)
    const mergedSlots = { ...jsonConfig.slots, ...cliSlots };

    // Create the root MarkdownNode
    return {
      file: resolve(options.template),
      slots: mergedSlots,
    };
  }

  /**
   * Load and parse JSON configuration file
   * @param configPath Path to the JSON configuration file
   * @returns Parsed JSON configuration
   * @throws Error if file cannot be read or JSON is invalid
   */
  private async loadJsonConfig(configPath: string): Promise<JsonConfig> {
    try {
      const resolvedPath = resolve(configPath);
      const configContent = await Deno.readTextFile(resolvedPath);
      const config = JSON.parse(configContent) as JsonConfig;

      // Validate the configuration structure
      this.validateJsonConfig(config);

      // Resolve file paths in the JSON config relative to the config file
      if (config.slots) {
        config.slots = await this.resolveJsonSlotPaths(config.slots, dirname(resolvedPath));
      }

      return config;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new Error(`JSON configuration file not found: ${configPath}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file: ${configPath}\n${error.message}`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load JSON configuration: ${message}`);
      }
    }
  }

  /**
   * Validate the structure of JSON configuration
   * @param config The configuration to validate
   * @throws Error if configuration structure is invalid
   */
  private validateJsonConfig(config: JsonConfig): void {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      throw new Error('JSON configuration must be an object');
    }

    if (config.slots !== undefined) {
      if (typeof config.slots !== 'object' || config.slots === null) {
        throw new Error('JSON configuration "slots" must be an object');
      }

      // Validate each slot source
      for (const [name, source] of Object.entries(config.slots)) {
        this.validateSlotSource(source, `slots.${name}`);
      }
    }

    if (config.options !== undefined) {
      if (typeof config.options !== 'object' || config.options === null) {
        throw new Error('JSON configuration "options" must be an object');
      }
    }
  }

  /**
   * Validate a slot source structure
   * @param source The slot source to validate
   * @param path The path in the config for error reporting
   * @throws Error if slot source structure is invalid
   */
  private validateSlotSource(source: MarkdownSlotSource, path: string): void {
    if (typeof source === 'function') {
      // Functions are valid but can't be in JSON
      throw new Error(`Function slot sources are not supported in JSON configuration at ${path}`);
    }

    if (typeof source === 'object' && source !== null) {
      const hasFile = 'file' in source;
      const hasContent = 'content' in source;
      const hasSlots = 'slots' in source;

      if (hasFile && hasContent) {
        throw new Error(`Slot source cannot have both "file" and "content" properties at ${path}`);
      }

      if (!hasFile && !hasContent) {
        throw new Error(`Slot source must have either "file" or "content" property at ${path}`);
      }

      if (hasFile && typeof source.file !== 'string') {
        throw new Error(`Slot source "file" property must be a string at ${path}`);
      }

      if (hasContent && typeof source.content !== 'string') {
        throw new Error(`Slot source "content" property must be a string at ${path}`);
      }

      if (hasSlots) {
        if (typeof source.slots !== 'object' || source.slots === null) {
          throw new Error(`Slot source "slots" property must be an object at ${path}`);
        }

        // Recursively validate nested slots
        for (const [nestedName, nestedSource] of Object.entries(source.slots)) {
          this.validateSlotSource(nestedSource, `${path}.slots.${nestedName}`);
        }
      }
    } else {
      throw new Error(
        `Invalid slot source type at ${path}. Expected object with "file" or "content" property`,
      );
    }
  }

  /**
   * Resolve file paths in JSON slot sources relative to the config file directory
   * @param slots The slots object from JSON config
   * @param configDir Directory containing the JSON config file
   * @returns Slots with resolved file paths
   */
  private async resolveJsonSlotPaths(
    slots: Record<string, MarkdownSlotSource>,
    configDir: string,
  ): Promise<Record<string, MarkdownSlotSource>> {
    const resolvedSlots: Record<string, MarkdownSlotSource> = {};

    for (const [name, source] of Object.entries(slots)) {
      resolvedSlots[name] = await this.resolveSlotSourcePaths(source, configDir);
    }

    return resolvedSlots;
  }

  /**
   * Resolve file paths in a single slot source
   * @param source The slot source to resolve
   * @param configDir Directory to resolve relative paths from
   * @returns Slot source with resolved paths
   */
  private async resolveSlotSourcePaths(
    source: MarkdownSlotSource,
    configDir: string,
  ): Promise<MarkdownSlotSource> {
    if (typeof source === 'function') {
      return source; // Functions don't need path resolution
    }

    if (typeof source === 'object' && source !== null) {
      if ('file' in source) {
        const resolvedFile = resolve(configDir, source.file);
        const result: MarkdownNode = { file: resolvedFile };

        if ('slots' in source && source.slots) {
          result.slots = await this.resolveJsonSlotPaths(source.slots, configDir);
        }

        return result;
      } else if ('content' in source) {
        const result: MarkdownNode = { content: source.content };

        if ('slots' in source && source.slots) {
          result.slots = await this.resolveJsonSlotPaths(source.slots, configDir);
        }

        return result;
      }
    }

    return source;
  }

  /**
   * Parse CLI slot arguments and convert to MarkdownSlotSource format
   * @param slots Raw slot values from CLI arguments
   * @param jsonConfigPath Optional path to JSON config for relative path resolution
   * @returns Parsed slot sources
   */
  private parseCliSlots(
    slots: Record<string, string>,
    jsonConfigPath?: string,
  ): Record<string, MarkdownSlotSource> {
    const result: Record<string, MarkdownSlotSource> = {};

    // Determine base directory for relative path resolution
    const baseDir = jsonConfigPath ? dirname(resolve(jsonConfigPath)) : Deno.cwd();

    for (const [name, value] of Object.entries(slots)) {
      if (value.startsWith('@')) {
        // File reference - remove @ prefix and resolve path
        const filepath = value.slice(1);
        const resolvedPath = resolve(baseDir, filepath);
        result[name] = { file: resolvedPath };
      } else {
        // Literal content
        result[name] = { content: value };
      }
    }

    return result;
  }
}
