/**
 * ARHA MCP Server — ARHA Vol.A~E 체계 기반
 * 기존 hisol-unified-mcp server.ts 교체
 *
 * ⚠ MCP stdio safety:
 *   stdout은 JSON-RPC 프로토콜 전용입니다.
 *   라이브러리 어디서든 console.log/info가 호출되면 클라이언트가 즉시 깨집니다.
 *   모든 console 출력을 stderr로 강제 리다이렉트해 안전망을 둡니다.
 *   (MCP SDK 자체는 process.stdout.write를 직접 사용하므로 영향 없음)
 *
 * 운영 안정성 (시니어 P0):
 *   • Handler timeout    — 30초 초과 호출은 클라이언트가 이미 포기. 서버도 풀어준다.
 *   • Graceful shutdown  — SIGINT/SIGTERM 수신 시 모든 세션을 Π에 flush.
 *                          ARHA의 "작별의 예의": 마지막 턴까지 기억으로 남긴다.
 *   • Error sanitization — 내부 에러 메시지를 그대로 client로 흘리면 경로/스택 leak.
 *                          짧고 안전한 메시지만 노출.
 */

// Runtime-level safety net (secondary layer).
// Primary layer: dist/mcp/preload.cjs loaded via node --require flag BEFORE any module.
// ESM note: static `import` is hoisted above all module code, so this redirect
// executes AFTER all imported modules initialize. The --require preloader is the
// only reliable way to patch console before ESM module graph evaluation.
// This line still catches any console.log added to handler functions at runtime.
console.log  = console.error;
console.info = console.error;
console.warn = console.error;

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
import { sessionRegistry } from '../core/session/registry.js';

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

/** Per-call wallclock budget. env: ARHA_HANDLER_TIMEOUT_MS, default 30s. */
const HANDLER_TIMEOUT_MS = Number(process.env.ARHA_HANDLER_TIMEOUT_MS ?? '30000');

const server = new Server(
  {
    name: 'arha-runtime-mcp',
    version: '3.0.0',
    description: 'ARHA Runtime MCP — Vol.A~E 문법체계 기반 감성 AI 시스템',
  },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

/**
 * Race a promise against a timeout. The timer is cleared on either outcome
 * to prevent unref'd timeouts from holding the event loop open.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new McpError(
        ErrorCode.InternalError,
        `ARHA tool '${label}' timed out after ${ms}ms`,
      ));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Convert any thrown value into a sanitized MCP-safe message.
 * - Drops stack traces, file paths, and unbounded payloads.
 * - Re-throws McpError as-is (already shaped by the SDK).
 */
function sanitizeError(err: unknown, toolName: string): McpError {
  if (err instanceof McpError) return err;
  const raw = err instanceof Error ? err.message : String(err);
  // Cap length to avoid runaway error messages flooding the client log.
  const safe = raw.length > 500 ? raw.slice(0, 500) + '…' : raw;
  return new McpError(ErrorCode.InternalError, `[${toolName}] ${safe}`);
}

// ─────────────────────────────────────────
// REQUEST HANDLERS
// ─────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ARHA_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = ARHA_TOOLS.find(t => t.name === name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
  }

  try {
    // tool.handler is typed as ToolHandler: (args: unknown) => Promise<unknown>
    // No casting needed — input validation handled inside the handler via defineHandler.
    const result = await withTimeout(
      Promise.resolve(tool.handler(args ?? {})),
      HANDLER_TIMEOUT_MS,
      name,
    );
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    throw sanitizeError(err, name);
  }
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }));
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));

// ─────────────────────────────────────────
// GRACEFUL SHUTDOWN — 작별의 예의
// ─────────────────────────────────────────

let shuttingDown = false;
function shutdown(signal: string, exitCode = 0): void {
  if (shuttingDown) return;
  shuttingDown = true;

  console.error(`[ARHA MCP] ${signal} received — flushing ${sessionRegistry.list().length} sessions to Π`);
  try {
    sessionRegistry.flushAll();
    sessionRegistry.clear();
  } catch (e) {
    console.error('[ARHA MCP] flushAll error during shutdown:', e);
  }
  console.error('[ARHA MCP] shutdown complete');
  process.exit(exitCode);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Last-line defense: even if the event loop empties, flush before exiting.
// beforeExit fires only when no pending I/O, so it's the safest "natural exit" hook.
process.on('beforeExit', () => {
  if (shuttingDown) return;
  try { sessionRegistry.flushAll(); } catch { /* best effort */ }
});

// Unhandled rejections should NOT crash an MCP server silently — log loudly to stderr.
process.on('unhandledRejection', (reason) => {
  console.error('[ARHA MCP] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[ARHA MCP] uncaughtException:', err);
  shutdown('uncaughtException', 1);
});

// ─────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[ARHA MCP] Server started — Vol.A~E 체계 활성 ` +
    `(timeout=${HANDLER_TIMEOUT_MS}ms, sessions: see arha_status)`,
  );
}

main().catch((err) => {
  console.error('[ARHA MCP] Fatal boot error:', err);
  process.exit(1);
});
