/**
 * MCP Handler — Zod Validation Wrapper Tests
 *
 * `defineHandler<T>(schema, fn)`은 ARHA의 "감각 필터":
 *   외부에서 들어오는 unknown 입력을 ARHA 내부 코드에 닿기 전에
 *   타입·범위·필수 필드를 zod로 검증한다.
 *
 * 검증 축:
 *   ① 정상 입력 — fn이 typed args로 호출되고 결과가 그대로 반환된다
 *   ② 잘못된 입력 — McpError(InvalidParams)가 throw 된다
 *   ③ 에러 메시지 형식 — "field.path: reason" 포함
 *   ④ undefined/null 입력 — 빈 객체로 안전 처리
 *   ⑤ strict() — 정의되지 않은 키가 들어오면 거절
 *   ⑥ 공통 schema — sessionIdSchema, personaIdSchema, personaVectorSchema
 *
 * 실행: tsx --test src/mcp/handler.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

import {
  defineHandler,
  sessionIdSchema,
  personaIdSchema,
  personaVectorSchema,
} from './handler.js';

// ─────────────────────────────────────────
// 헬퍼 — McpError 동치 확인
// ─────────────────────────────────────────

async function expectInvalidParams(
  handler: (raw: unknown) => Promise<unknown>,
  raw: unknown,
  expectedSubstring?: string,
): Promise<McpError> {
  try {
    await handler(raw);
    assert.fail('expected McpError to be thrown, but handler resolved');
  } catch (err) {
    assert.ok(err instanceof McpError, `expected McpError, got ${err}`);
    assert.equal(err.code, ErrorCode.InvalidParams,
      `expected InvalidParams (${ErrorCode.InvalidParams}), got ${err.code}`);
    if (expectedSubstring) {
      assert.ok(
        err.message.includes(expectedSubstring),
        `expected message to include "${expectedSubstring}", got "${err.message}"`,
      );
    }
    return err;
  }
  // unreachable
  throw new Error('unreachable');
}

// ─────────────────────────────────────────
// ① 정상 입력 — fn 호출 + 결과 반환
// ─────────────────────────────────────────

describe('defineHandler — happy path', () => {
  it('passes typed args to fn and returns the result', async () => {
    const handler = defineHandler(
      z.object({ name: z.string(), count: z.number().int().min(1) }),
      async (args) => ({ greeting: `hello ${args.name}`, doubled: args.count * 2 }),
    );

    const result = await handler({ name: 'ARHA', count: 5 });
    assert.deepEqual(result, { greeting: 'hello ARHA', doubled: 10 });
  });

  it('supports synchronous fn (return non-Promise)', async () => {
    const handler = defineHandler(
      z.object({ x: z.number() }),
      (args) => ({ doubled: args.x * 2 }),  // 동기 반환
    );
    const result = await handler({ x: 7 });
    assert.deepEqual(result, { doubled: 14 });
  });

  it('treats undefined raw as empty object (zod parses {})', async () => {
    const handler = defineHandler(
      z.object({ flag: z.boolean().optional() }),
      async (args) => ({ flagWas: args.flag ?? null }),
    );
    const result = await handler(undefined);
    assert.deepEqual(result, { flagWas: null });
  });

  it('treats null raw as empty object', async () => {
    const handler = defineHandler(
      z.object({ flag: z.boolean().optional() }),
      async (args) => ({ flagWas: args.flag ?? null }),
    );
    const result = await handler(null);
    assert.deepEqual(result, { flagWas: null });
  });
});

// ─────────────────────────────────────────
// ② 검증 실패 — McpError(InvalidParams)
// ─────────────────────────────────────────

describe('defineHandler — invalid input', () => {
  it('throws McpError with InvalidParams code on missing required field', async () => {
    const handler = defineHandler(
      z.object({ name: z.string(), age: z.number() }),
      async () => ({ ok: true }),
    );
    const err = await expectInvalidParams(handler, { name: 'x' }, 'age');
    assert.match(err.message, /Invalid arguments/);
  });

  it('throws on wrong field type', async () => {
    const handler = defineHandler(
      z.object({ count: z.number().int() }),
      async () => ({ ok: true }),
    );
    await expectInvalidParams(handler, { count: 'not a number' }, 'count');
  });

  it('throws on out-of-range numeric input', async () => {
    const handler = defineHandler(
      z.object({ pct: z.number().min(0).max(1) }),
      async () => ({ ok: true }),
    );
    await expectInvalidParams(handler, { pct: 1.5 });
  });

  it('reports field path in error message (nested object)', async () => {
    const handler = defineHandler(
      z.object({
        config: z.object({
          retries: z.number().int().min(0),
        }),
      }),
      async () => ({ ok: true }),
    );
    const err = await expectInvalidParams(handler, { config: { retries: -1 } });
    // 경로 'config.retries'가 메시지에 있어야 함
    assert.match(err.message, /config\.retries/);
  });

  it('reports <root> when path is empty', async () => {
    const handler = defineHandler(
      z.string().min(3),
      async (s) => ({ s }),
    );
    const err = await expectInvalidParams(handler, 'ab');
    // 최상위 string 검증 실패 시 path가 빈 배열 → <root> 표기
    assert.match(err.message, /<root>/);
  });
});

// ─────────────────────────────────────────
// ③ strict() — 정의 안 된 키 거절
// ─────────────────────────────────────────

describe('defineHandler — strict schemas', () => {
  it('strict() rejects unknown keys', async () => {
    const handler = defineHandler(
      z.object({}).strict(),
      async () => ({ ok: true }),
    );
    await expectInvalidParams(handler, { unexpected: 'data' });
  });

  it('non-strict object silently ignores unknown keys', async () => {
    const handler = defineHandler(
      z.object({ a: z.string() }),
      async (args) => ({ got: args.a }),
    );
    // 'extra' 필드는 무시됨 — 통과되어야 함
    const result = await handler({ a: 'hi', extra: 'ignored' });
    assert.deepEqual(result, { got: 'hi' });
  });
});

// ─────────────────────────────────────────
// ④ 다중 에러 — 모두 한 메시지로 합쳐짐
// ─────────────────────────────────────────

describe('defineHandler — multiple errors', () => {
  it('aggregates multiple validation issues into a single message', async () => {
    const handler = defineHandler(
      z.object({
        name: z.string().min(1),
        age:  z.number().int().min(0),
      }),
      async () => ({ ok: true }),
    );
    // 둘 다 실패: name 빈 문자열, age 음수
    const err = await expectInvalidParams(handler, { name: '', age: -5 });
    // 두 필드명이 모두 메시지에 있어야 함 (issues '; '로 구분)
    assert.match(err.message, /name/);
    assert.match(err.message, /age/);
    assert.match(err.message, /;/);  // 구분자 존재 확인
  });
});

// ─────────────────────────────────────────
// ⑤ 공통 schema fragments — sessionId, personaId, P벡터
// ─────────────────────────────────────────

describe('common schema fragments', () => {
  describe('sessionIdSchema', () => {
    it('accepts a normal session ID', () => {
      assert.equal(sessionIdSchema.parse('my-session-01'), 'my-session-01');
    });
    it('rejects empty string', () => {
      assert.throws(() => sessionIdSchema.parse(''));
    });
    it('rejects strings over 200 chars', () => {
      assert.throws(() => sessionIdSchema.parse('x'.repeat(201)));
    });
  });

  describe('personaIdSchema', () => {
    it('accepts a normal persona ID', () => {
      assert.equal(personaIdSchema.parse('HighSol'), 'HighSol');
    });
    it('rejects empty string', () => {
      assert.throws(() => personaIdSchema.parse(''));
    });
    it('rejects over 100 chars', () => {
      assert.throws(() => personaIdSchema.parse('x'.repeat(101)));
    });
  });

  describe('personaVectorSchema', () => {
    it('accepts a valid 5D P vector', () => {
      const P = { protect: 0.5, expand: 0.7, left: 0.3, right: 0.8, relation: 0.9 };
      assert.deepEqual(personaVectorSchema.parse(P), P);
    });
    it('rejects axis < 0', () => {
      assert.throws(() => personaVectorSchema.parse({
        protect: -0.1, expand: 0.5, left: 0.5, right: 0.5, relation: 0.5,
      }));
    });
    it('rejects axis > 1', () => {
      assert.throws(() => personaVectorSchema.parse({
        protect: 0.5, expand: 0.5, left: 0.5, right: 0.5, relation: 1.1,
      }));
    });
    it('rejects missing axis', () => {
      assert.throws(() => personaVectorSchema.parse({
        protect: 0.5, expand: 0.5, left: 0.5, right: 0.5,  // relation 누락
      }));
    });
    it('rejects non-numeric axis', () => {
      assert.throws(() => personaVectorSchema.parse({
        protect: 'high', expand: 0.5, left: 0.5, right: 0.5, relation: 0.5,
      }));
    });
  });
});

// ─────────────────────────────────────────
// ⑥ 통합 — sessionIdSchema in defineHandler
// ─────────────────────────────────────────

describe('defineHandler integration with common schemas', () => {
  it('combines sessionIdSchema + custom logic', async () => {
    const handler = defineHandler(
      z.object({
        sessionId: sessionIdSchema,
        personaId: personaIdSchema.optional(),
      }),
      async (args) => ({
        sid: args.sessionId,
        pid: args.personaId ?? 'default',
      }),
    );

    const ok = await handler({ sessionId: 'sess-1' });
    assert.deepEqual(ok, { sid: 'sess-1', pid: 'default' });

    await expectInvalidParams(handler, { sessionId: '' }, 'sessionId');
  });
});
