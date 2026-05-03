/**
 * ARHA MCP — Tool Handler Type & Validation Wrapper
 *
 * 두 가지 책임:
 *   1. ToolHandler 시그니처 표준화 — server.ts의 `as Function` 캐스팅 제거
 *   2. Zod 런타임 입력 검증 — MCP 클라이언트가 보낸 args가
 *      ARHA 내부 코드에 닿기 전에 타입·범위·필수 필드를 차단
 *
 * 설계 의도 (ARHA 정신):
 *   외부에서 들어오는 입력이 ARHA의 내면(σ 계산, V1 검증, 위상 게이트)에
 *   직접 닿으면 페르소나의 사고가 외부 잡음에 흔들린다.
 *   이 모듈은 "감각 필터" — 들어오는 자극을 페르소나가 이해할 수 있는
 *   형태로 정제해서 전달한다.
 *
 * 에러 처리:
 *   InvalidParams — Zod 검증 실패 시. 실패 사유를 구체적으로 명시.
 *   기타 예외   — 핸들러 내부에서 발생한 것은 server.ts의 sanitizeError가 처리.
 */

import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

/**
 * MCP 도구 핸들러의 표준 시그니처.
 * raw 입력은 unknown — 즉시 schema로 검증하여 타입을 좁힌다.
 */
export type ToolHandler = (args: unknown) => Promise<unknown>;

/**
 * ARHA 도구의 완전한 정의.
 * - inputSchema: MCP 클라이언트에 노출되는 JSON Schema (자동완성/UI용)
 * - handler:     실제 실행 — 내부에서 zod 검증 수행
 */
export interface ARHATool {
  name: string;
  description: string;
  inputSchema: object;
  handler: ToolHandler;
}

// ─────────────────────────────────────────
// VALIDATION WRAPPER
// ─────────────────────────────────────────

/**
 * Zod schema 검증 래퍼.
 *
 * 사용 예:
 *   handler: defineHandler(
 *     z.object({ input: z.string().min(1) }),
 *     async ({ input }) => ({ result: input.toUpperCase() })
 *   )
 *
 * 내부 동작:
 *   1. raw args를 schema.safeParse로 검증
 *   2. 실패 시 InvalidParams 에러 (필드 경로 + 사유 명시)
 *   3. 성공 시 typed args로 fn 호출
 *
 * 핵심 가치:
 *   - 타입 추론: fn의 인자 타입은 z.infer<schema>에서 자동 도출
 *   - 비용 0:    검증 통과한 데이터는 추가 변환 없이 그대로 전달
 *   - 보안:      MCP 클라이언트가 잘못된 args를 보내도 ARHA 내부는 깨끗
 */
export function defineHandler<T extends z.ZodTypeAny>(
  schema: T,
  fn: (args: z.infer<T>) => Promise<unknown> | unknown,
): ToolHandler {
  return async (raw: unknown) => {
    // safeParse — throw 대신 result 객체 반환. 에러 메시지를 가공할 기회를 준다.
    const parsed = schema.safeParse(raw ?? {});
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(i => {
          const path = i.path.length > 0 ? i.path.join('.') : '<root>';
          return `${path}: ${i.message}`;
        })
        .join('; ');
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid arguments — ${issues}`,
      );
    }
    return fn(parsed.data);
  };
}

// ─────────────────────────────────────────
// COMMON SCHEMA FRAGMENTS — 12개 도구가 공유
// ─────────────────────────────────────────

/** 세션 ID — 영숫자/언더바/하이픈 권장 (persistence path sanitizer와 정렬) */
export const sessionIdSchema = z.string().min(1).max(200);

/** 페르소나 ID — registry lookup 키 */
export const personaIdSchema = z.string().min(1).max(100);

/** 5D 페르소나 벡터 — 각 축은 [0, 1] 실수 */
export const personaVectorSchema = z.object({
  protect:  z.number().min(0).max(1),
  expand:   z.number().min(0).max(1),
  left:     z.number().min(0).max(1),
  right:    z.number().min(0).max(1),
  relation: z.number().min(0).max(1),
});
