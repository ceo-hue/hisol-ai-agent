/**
 * ARHA MCP server.
 */
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools.js';

const server = new Server(
  { name: 'arha-runtime', version: '3.1.0' },
  { capabilities: { tools: {} } },
);

const TOOL_DEFINITIONS = [
  {
    name: 'arha_process',
    description: 'Process user input, return persona state and systemPrompt.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        sessionId: { type: 'string', default: 'default' },
        personaId: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'arha_about',
    description: 'Return runtime or persona metadata.',
    inputSchema: {
      type: 'object',
      properties: { personaId: { type: 'string' } },
    },
  },
  {
    name: 'arha_status',
    description: 'Return current session state.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_persona_list',
    description: 'List all registered personas.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'arha_session_handoff',
    description: 'Extract session state for cross-session resume.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
      required: ['sessionId'],
    },
  },
  {
    name: 'arha_diagnose',
    description: 'Return diagnostics and recommendations for the current session.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_observe',
    description: 'Return sensor data (σ_vector, V_in, V_con, |∇×σ|²).',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_derive',
    description: 'Return V_personality and derived ρ, λ, τ.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_route',
    description: 'Route a request to the best persona / team.',
    inputSchema: {
      type: 'object',
      properties: { request: { type: 'string' }, sessionId: { type: 'string' } },
      required: ['request'],
    },
  },
  {
    name: 'arha_stack_run',
    description: 'Run a stack of personas sequentially.',
    inputSchema: {
      type: 'object',
      properties: {
        request: { type: 'string' },
        sessionId: { type: 'string' },
        personaIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['request'],
    },
  },
  {
    name: 'arha_agent_run',
    description: 'Run a single persona once.',
    inputSchema: {
      type: 'object',
      properties: {
        personaId: { type: 'string' },
        text: { type: 'string' },
        sessionId: { type: 'string' },
      },
      required: ['personaId', 'text'],
    },
  },
  {
    name: 'arha_character_create',
    description: 'Generate a persona template.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        displayName: { type: 'string' },
        P_5D: {
          type: 'object',
          properties: {
            protect: { type: 'number' },
            expand: { type: 'number' },
            left: { type: 'number' },
            right: { type: 'number' },
            relation: { type: 'number' },
          },
        },
        V1_Value: { type: 'string' },
        triggers: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'displayName', 'P_5D', 'V1_Value'],
    },
  },
  {
    name: 'arha_vc_run',
    description: 'Run the six-stage value-chain pipeline.',
    inputSchema: {
      type: 'object',
      properties: { request: { type: 'string' }, sessionId: { type: 'string' } },
      required: ['request'],
    },
  },
  {
    name: 'arha_vc_lenses',
    description: 'List value-chain lenses.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'arha_emotion_matrix',
    description: 'Return the 10×10 Γ_interfere matrix.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_kyeol_zones',
    description: 'Return the kyeol (coherence) region Ω.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
  {
    name: 'arha_bond_energy',
    description: 'Return E_B trace and components.',
    inputSchema: {
      type: 'object',
      properties: { sessionId: { type: 'string' } },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFINITIONS,
}));

server.setRequestHandler(CallToolRequestSchema, async req => {
  const name = req.params.name as keyof typeof TOOLS;
  const args = (req.params.arguments ?? {}) as any;
  const fn = TOOLS[name] as (a: any) => any;
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  const result = fn(args);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[arha] MCP server started');
}

main().catch(err => {
  console.error('[arha] fatal:', err);
  process.exit(1);
});
