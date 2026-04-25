/**
 * ARHA MCP Server — ARHA Vol.A~E 체계 기반
 * 기존 hisol-unified-mcp server.ts 교체
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

import { ARHA_TOOLS } from './tools.js';

const server = new Server(
  {
    name: 'arha-runtime-mcp',
    version: '3.0.0',
    description: 'ARHA Runtime MCP — Vol.A~E 문법체계 기반 감성 AI 시스템',
  },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ARHA_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// Call tool
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = ARHA_TOOLS.find(t => t.name === name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
  }

  try {
    const result = await (tool.handler as Function)(args ?? {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new McpError(ErrorCode.InternalError, `ARHA error: ${message}`);
  }
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }));
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[ARHA MCP] Server started — Vol.A~E 체계 활성');
}

main().catch(console.error);
