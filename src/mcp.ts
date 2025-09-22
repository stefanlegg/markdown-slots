#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Model Context Protocol (MCP) server integration for markdown composition.
 *
 * This module provides an MCP server implementation that exposes markdown composition
 * functionality to AI assistants and other MCP clients. The server provides tools for
 * composing markdown content with slot-based templating.
 *
 * Features:
 * - MCP server with stdio transport
 * - Tools for template-based and file-based composition
 * - Support for all composition options (error handling, caching, etc.)
 * - Graceful shutdown handling
 * - Comprehensive error reporting
 *
 * Available MCP Tools:
 * - `compose_markdown`: Compose from template string with slots
 * - `compose_from_file`: Compose from template file with slots
 * - `detect_slots`: Detect available slots in markdown content
 * - `validate_template`: Validate template syntax
 *
 * @example
 * ```typescript
 * // Start the MCP server
 * const server = new MarkdownSlotsMcpServer();
 * await server.start();
 * ```
 *
 * @module mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { composeMarkdown } from './compose.ts';
import { ContentParser } from './parser.ts';
import { DenoFileSystem } from './filesystem.ts';
import { getVersion } from './version.ts';
import type { ComposeOptions, MarkdownNode, MarkdownSlotSource } from './types.ts';

/**
 * MCP server implementation for markdown-slots.
 * Provides composition tools via the Model Context Protocol.
 */
class MarkdownSlotsMcpServer {
  private server: Server;
  private fs: DenoFileSystem;

  /**
   * Creates a new MCP server instance for markdown-slots.
   * Sets up tool handlers, error handling, and signal listeners.
   */
  constructor() {
    this.fs = new DenoFileSystem();
    this.server = new Server(
      {
        name: 'markdown-slots',
        version: getVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);

    // Process signal handling
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
    for (const signal of signals) {
      Deno.addSignalListener(signal, async () => {
        console.error(`Received ${signal}, shutting down...`);
        await this.server.close();
        Deno.exit(0);
      });
    }
  }

  /**
   * Sets up MCP tool handlers for the server.
   * Registers handlers for list_tools and call_tool requests.
   */
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [
          {
            name: 'compose_markdown',
            description: 'Compose markdown content by filling template slots with content',
            inputSchema: {
              type: 'object',
              properties: {
                template: {
                  type: 'string',
                  description: 'The markdown template content with <!-- outlet: name --> markers',
                },
                slots: {
                  type: 'object',
                  description:
                    'Object mapping slot names to their content (string or {file: "path"})',
                  additionalProperties: {
                    oneOf: [
                      { type: 'string' },
                      {
                        type: 'object',
                        properties: {
                          file: { type: 'string' },
                        },
                        required: ['file'],
                      },
                    ],
                  },
                },
                options: {
                  type: 'object',
                  properties: {
                    resolveFrom: {
                      type: 'string',
                      enum: ['file', 'cwd'],
                      description: 'How to resolve relative file paths (default: cwd)',
                    },
                    onFileError: {
                      type: 'string',
                      enum: ['throw', 'warn-empty', 'ignore'],
                      description: 'How to handle file read errors (default: warn-empty)',
                    },
                    onMissingSlot: {
                      type: 'string',
                      enum: ['throw', 'warn', 'keep'],
                      description: 'How to handle missing slots (default: keep)',
                    },
                    parallel: {
                      type: 'boolean',
                      description: 'Whether to process slots in parallel (default: true)',
                    },
                  },
                },
              },
              required: ['template', 'slots'],
            },
          },
          {
            name: 'compose_from_file',
            description: 'Compose markdown from a template file',
            inputSchema: {
              type: 'object',
              properties: {
                templateFile: {
                  type: 'string',
                  description: 'Path to the markdown template file',
                },
                slots: {
                  type: 'object',
                  description:
                    'Object mapping slot names to their content (string or {file: "path"})',
                  additionalProperties: {
                    oneOf: [
                      { type: 'string' },
                      {
                        type: 'object',
                        properties: {
                          file: { type: 'string' },
                        },
                        required: ['file'],
                      },
                    ],
                  },
                },
                options: {
                  type: 'object',
                  properties: {
                    resolveFrom: {
                      type: 'string',
                      enum: ['file', 'cwd'],
                      description: 'How to resolve relative file paths (default: file)',
                    },
                    onFileError: {
                      type: 'string',
                      enum: ['throw', 'warn-empty', 'ignore'],
                      description: 'How to handle file read errors (default: warn-empty)',
                    },
                    onMissingSlot: {
                      type: 'string',
                      enum: ['throw', 'warn', 'keep'],
                      description: 'How to handle missing slots (default: keep)',
                    },
                    parallel: {
                      type: 'boolean',
                      description: 'Whether to process slots in parallel (default: true)',
                    },
                  },
                },
              },
              required: ['templateFile', 'slots'],
            },
          },
          {
            name: 'list_outlets',
            description: 'List available outlet slots in a markdown template',
            inputSchema: {
              type: 'object',
              properties: {
                template: {
                  type: 'string',
                  description: 'The markdown template content or file path',
                },
                isFile: {
                  type: 'boolean',
                  description: 'Whether template parameter is a file path (default: false)',
                  default: false,
                },
              },
              required: ['template'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, (request) => {
      switch (request.params.name) {
        case 'compose_markdown':
          return this.handleCompose(request.params.arguments);
        case 'compose_from_file':
          return this.handleComposeFromFile(request.params.arguments);
        case 'list_outlets':
          return this.handleListOutlets(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`,
          );
      }
    });
  }

  /**
   * Handles the compose_markdown tool call.
   * @param args Tool arguments containing template, slots, and options
   * @returns MCP tool response with composed markdown or error
   */
  private async handleCompose(args: unknown) {
    try {
      const { template, slots, options = {} } = args as {
        template: string;
        slots: Record<string, unknown>;
        options?: Record<string, unknown>;
      };

      if (!template || typeof template !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: template must be a non-empty string',
            },
          ],
          isError: true,
        };
      }

      if (!slots || typeof slots !== 'object') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: slots must be an object',
            },
          ],
          isError: true,
        };
      }

      // Transform slots to proper MarkdownSlotSource format
      const transformedSlots: Record<string, MarkdownSlotSource> = {};
      for (const [key, value] of Object.entries(slots)) {
        if (typeof value === 'string') {
          transformedSlots[key] = { content: value };
        } else if (value && typeof value === 'object' && 'file' in value) {
          transformedSlots[key] = { file: (value as { file: string }).file };
        } else {
          transformedSlots[key] = value as MarkdownSlotSource;
        }
      }

      const markdownNode: MarkdownNode = {
        content: template,
        slots: transformedSlots,
      };

      const composeOptions: ComposeOptions = {
        resolveFrom: (options.resolveFrom as string) === 'file' ? 'file' : 'cwd',
        onFileError: (options.onFileError as 'throw' | 'warn-empty') || 'warn-empty',
        onMissingSlot: (options.onMissingSlot as 'error' | 'ignore' | 'keep') || 'keep',
        parallel: options.parallel !== false,
      };

      const result = await composeMarkdown(markdownNode, composeOptions);

      return {
        content: [
          {
            type: 'text',
            text: `Composition completed successfully!\n\n**Result:**\n${result.markdown}${
              result.errors?.length
                ? `\n\n**Warnings/Errors:**\n${
                  result.errors.map((e) => `- ${e.message}`).join('\n')
                }`
                : ''
            }`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Composition failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the compose_from_file tool call.
   * @param args Tool arguments containing templateFile, slots, and options
   * @returns MCP tool response with composed markdown or error
   */
  private async handleComposeFromFile(args: unknown) {
    try {
      const { templateFile, slots, options = {} } = args as {
        templateFile: string;
        slots: Record<string, unknown>;
        options?: Record<string, unknown>;
      };

      if (!templateFile || typeof templateFile !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: templateFile must be a non-empty string',
            },
          ],
          isError: true,
        };
      }

      if (!slots || typeof slots !== 'object') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: slots must be an object',
            },
          ],
          isError: true,
        };
      }

      if (!(await this.fs.exists(templateFile))) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: Template file not found: ${templateFile}`,
            },
          ],
          isError: true,
        };
      }

      const templateContent = await this.fs.readFile(templateFile);

      // Transform slots to proper MarkdownSlotSource format
      const transformedSlots: Record<string, MarkdownSlotSource> = {};
      for (const [key, value] of Object.entries(slots)) {
        if (typeof value === 'string') {
          transformedSlots[key] = { content: value };
        } else if (value && typeof value === 'object' && 'file' in value) {
          transformedSlots[key] = { file: (value as { file: string }).file };
        } else {
          transformedSlots[key] = value as MarkdownSlotSource;
        }
      }

      const markdownNode: MarkdownNode = {
        content: templateContent,
        slots: transformedSlots,
      };

      const composeOptions: ComposeOptions = {
        resolveFrom: (options.resolveFrom as string) === 'cwd' ? 'cwd' : 'file',
        onFileError: (options.onFileError as 'throw' | 'warn-empty') || 'warn-empty',
        onMissingSlot: (options.onMissingSlot as 'error' | 'ignore' | 'keep') || 'keep',
        parallel: options.parallel !== false,
      };

      const result = await composeMarkdown(markdownNode, composeOptions);

      return {
        content: [
          {
            type: 'text',
            text:
              `Composition completed successfully!\n\n**Template:** ${templateFile}\n\n**Result:**\n${result.markdown}${
                result.errors?.length
                  ? `\n\n**Warnings/Errors:**\n${
                    result.errors.map((e) => `- ${e.message}`).join('\n')
                  }`
                  : ''
              }`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Composition failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handles the detect_slots tool call.
   * @param args Tool arguments containing template and optional isFile flag
   * @returns MCP tool response with detected outlet names or error
   */
  private async handleListOutlets(args: unknown) {
    try {
      const { template, isFile = false } = args as {
        template: string;
        isFile?: boolean;
      };

      if (!template || typeof template !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: template must be a non-empty string',
            },
          ],
          isError: true,
        };
      }

      let content: string;
      if (isFile) {
        if (!(await this.fs.exists(template))) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Template file not found: ${template}`,
              },
            ],
            isError: true,
          };
        }
        content = await this.fs.readFile(template);
      } else {
        content = template;
      }

      const parser = new ContentParser();
      const outlets = parser.getOutletNames(content);

      const outletList = outlets.length > 0
        ? outlets.map((outlet) => `- ${outlet}`).join('\n')
        : 'No outlets found';

      return {
        content: [
          {
            type: 'text',
            text: `**Outlets found${isFile ? ` in ${template}` : ''}:**\n\n${outletList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list outlets: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Starts the MCP server and begins listening for requests.
   * @returns Promise that resolves when the server is connected and running
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Markdown Slots MCP server running on stdio');
  }
}

// Only run if this is the main module
if (import.meta.main) {
  const server = new MarkdownSlotsMcpServer();
  server.run().catch((error) => {
    console.error('Failed to start MCP server:', error);
    Deno.exit(1);
  });
}
