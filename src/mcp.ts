#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * MCP Server entry point for markdown-slots
 * Provides composition functionality via Model Context Protocol
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
import type { ComposeOptions, MarkdownNode, MarkdownSlotSource } from './types.ts';

class MarkdownSlotsMcpServer {
  private server: Server;
  private fs: DenoFileSystem;

  constructor() {
    this.fs = new DenoFileSystem();
    this.server = new Server(
      {
        name: 'markdown-slots',
        version: '0.1.3',
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
