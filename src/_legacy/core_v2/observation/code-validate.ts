/**
 * ARHA Vol.E — Κ (Kappa) Diagnostic Layer
 * Code quality validation pipeline. Activated when C ≥ 0.70 (coherence gate).
 *
 * Κ morpheme: "the diagnostic instrument" — applies structural analysis
 * to code artifacts. Gated by ARHA coherence so low-signal turns don't
 * trigger expensive analysis.
 *
 * 4 stages: SPEC → QUALITY → SECURITY → STRUCTURE
 */

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type ValidationStatus = 'pass' | 'warning' | 'fail';
export type KappaGrade = 'A' | 'B+' | 'B' | 'C';

export interface StageResult {
  stage: string;
  status: ValidationStatus;
  score: number;       // 0–1
  issues: string[];
  recommendations: string[];
  durationMs: number;
}

export interface KappaPipeline {
  stages: StageResult[];
  overallStatus: ValidationStatus;
  overallScore: number;
  grade: KappaGrade;
  totalMs: number;
  arhaGate: { C: number | null; passed: boolean };
}

export interface CodeContext {
  code?: string;
  targetPath?: string;
  language?: string;
  testCoverage?: number;
}

// ─────────────────────────────────────────
// ARHA COHERENCE GATE
// ─────────────────────────────────────────

export function checkKappaGate(C: number | null): { passed: boolean; reason: string } {
  if (C === null) return { passed: false, reason: 'C not yet established (turn < 3)' };
  if (C < 0.70)  return { passed: false, reason: `C=${C.toFixed(2)} < 0.70 — coherence insufficient for Κ diagnostic` };
  return { passed: true, reason: `C=${C.toFixed(2)} ≥ 0.70 — gate open` };
}

// ─────────────────────────────────────────
// STAGE 1 — SPEC
// ─────────────────────────────────────────

function stageSpec(ctx: CodeContext): StageResult {
  const t0 = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  if (!ctx.code && !ctx.targetPath) {
    issues.push('코드 또는 경로가 제공되지 않음');
    score -= 0.5;
  }
  if (ctx.testCoverage !== undefined && ctx.testCoverage < 70) {
    issues.push(`테스트 커버리지 ${ctx.testCoverage}% — 권장 기준 70% 미달`);
    score -= 0.2;
  }
  if (!ctx.testCoverage) {
    recommendations.push('프로덕션 코드에 테스트 커버리지 측정 권장');
    score -= 0.1;
  }

  return {
    stage: 'SPEC',
    status: score >= 0.7 ? (issues.length === 0 ? 'pass' : 'warning') : 'fail',
    score: Math.max(0, score),
    issues, recommendations,
    durationMs: Date.now() - t0,
  };
}

// ─────────────────────────────────────────
// STAGE 2 — QUALITY
// ─────────────────────────────────────────

function stageQuality(ctx: CodeContext): StageResult {
  const t0 = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  if (!ctx.code) {
    return { stage: 'QUALITY', status: 'pass', score: 1, issues: [], recommendations: ['코드 미제공 — 건너뜀'], durationMs: Date.now() - t0 };
  }

  const code = ctx.code;

  // async without try-catch
  const asyncCount  = (code.match(/async\s+(?:function|\()/g) ?? []).length;
  const tryCount    = (code.match(/try\s*\{/g) ?? []).length;
  if (asyncCount > tryCount) {
    issues.push(`async 함수 ${asyncCount}개 중 try-catch 블록 ${tryCount}개 — 에러 처리 누락 가능`);
    recommendations.push('async 함수에 try-catch 추가');
    score -= 0.2;
  }

  // potential null access
  const accessCount  = (code.match(/\.\w+\s*\(/g) ?? []).length + (code.match(/\[\w+\]/g) ?? []).length;
  const nullChecks   = (code.match(/(?:!==?\s*null|!==?\s*undefined|\?\.|if\s*\(.*\))/g) ?? []).length;
  if (accessCount > nullChecks * 3) {
    issues.push('잠재적 null/undefined 접근 패턴 감지');
    recommendations.push('속성 접근 전 null 체크 또는 optional chaining(?.) 사용');
    score -= 0.15;
  }

  // cyclomatic complexity
  const decisions = (code.match(/\b(?:if|else if|for|while|case|catch)\b|&&|\|\|/g) ?? []).length;
  const complexity = 1 + decisions;
  if (complexity > 20) {
    issues.push(`순환 복잡도 ${complexity} — 테스트 및 유지보수 어려움`);
    recommendations.push('복잡한 함수를 더 작은 단위로 분리');
    score -= 0.2;
  } else if (complexity > 15) {
    recommendations.push(`순환 복잡도 ${complexity} — 성장하면 리팩토링 고려`);
    score -= 0.05;
  }

  // long functions
  const fnLines = code.split('\n').length;
  if (fnLines > 200) {
    issues.push(`파일 ${fnLines}줄 — 단일 책임 원칙 점검 권장`);
    score -= 0.1;
  }

  return {
    stage: 'QUALITY',
    status: issues.length === 0 ? 'pass' : (score >= 0.7 ? 'warning' : 'fail'),
    score: Math.max(0, score),
    issues, recommendations,
    durationMs: Date.now() - t0,
  };
}

// ─────────────────────────────────────────
// STAGE 3 — SECURITY
// ─────────────────────────────────────────

function stageSecurity(ctx: CodeContext): StageResult {
  const t0 = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  if (!ctx.code) {
    return { stage: 'SECURITY', status: 'pass', score: 1, issues: [], recommendations: ['코드 미제공 — 건너뜀'], durationMs: Date.now() - t0 };
  }

  const code = ctx.code;

  const secretPatterns: [RegExp, string][] = [
    [/password\s*=\s*['"]\w+['"]/i,       '하드코딩된 password 감지 — 환경변수 사용'],
    [/api[_-]?key\s*=\s*['"]\w{10,}['"]/i,'하드코딩된 API key 감지 — 환경변수 사용'],
    [/secret\s*=\s*['"]\w{8,}['"]/i,      '하드코딩된 secret 감지 — 환경변수 사용'],
  ];

  for (const [pattern, msg] of secretPatterns) {
    if (pattern.test(code)) {
      issues.push(msg);
      score -= 0.3;
    }
  }

  if (code.includes('eval(')) {
    issues.push('eval() 사용 감지 — 보안 위험 (코드 인젝션)');
    recommendations.push('eval() 제거, JSON.parse 또는 Function 생성자 검토');
    score -= 0.25;
  }

  if (/SELECT.*\+.*FROM|SELECT.*\$\{/i.test(code) && !/\?|parameterized|prepare/i.test(code)) {
    issues.push('SQL 인젝션 위험 — 문자열 연결로 쿼리 구성 감지');
    recommendations.push('파라미터화된 쿼리 사용');
    score -= 0.3;
  }

  if (/<\s*script|innerHTML\s*=|outerHTML\s*=/i.test(code)) {
    issues.push('XSS 위험 패턴 감지 — innerHTML/script 직접 삽입');
    recommendations.push('textContent 또는 DOMPurify 사용');
    score -= 0.2;
  }

  return {
    stage: 'SECURITY',
    status: issues.length === 0 ? 'pass' : (score >= 0.6 ? 'warning' : 'fail'),
    score: Math.max(0, score),
    issues, recommendations,
    durationMs: Date.now() - t0,
  };
}

// ─────────────────────────────────────────
// STAGE 4 — STRUCTURE
// ─────────────────────────────────────────

function stageStructure(ctx: CodeContext): StageResult {
  const t0 = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  if (!ctx.code) {
    return { stage: 'STRUCTURE', status: 'pass', score: 1, issues: [], recommendations: ['코드 미제공 — 건너뜀'], durationMs: Date.now() - t0 };
  }

  const code = ctx.code;

  // nesting depth
  let maxDepth = 0, cur = 0;
  for (const ch of code) {
    if (ch === '{') { cur++; if (cur > maxDepth) maxDepth = cur; }
    else if (ch === '}') cur--;
  }
  if (maxDepth > 5) {
    issues.push(`중첩 깊이 ${maxDepth}단계 — 가독성·성능 저하`);
    recommendations.push('조기 반환(early return) 또는 로직 추출로 중첩 감소');
    score -= 0.2;
  } else if (maxDepth > 4) {
    recommendations.push(`중첩 ${maxDepth}단계 — 성장 시 리팩토링 고려`);
    score -= 0.05;
  }

  // duplicate lines (rough estimate)
  const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  const seen  = new Map<string, number>();
  let dups = 0;
  for (const l of lines) {
    seen.set(l, (seen.get(l) ?? 0) + 1);
    if ((seen.get(l) ?? 0) === 2) dups++;
  }
  const dupRatio = lines.length > 0 ? dups / lines.length : 0;
  if (dupRatio > 0.2) {
    issues.push(`코드 중복 ${(dupRatio * 100).toFixed(0)}% — 공통 로직 추출 권장`);
    score -= 0.15;
  }

  // nested loops
  if (/for\s*\(.*for\s*\(|while\s*\(.*while\s*\(/.test(code)) {
    recommendations.push('중첩 루프 감지 — O(n²) 복잡도 검토');
    score -= 0.1;
  }

  // sync file I/O
  if (/readFileSync|writeFileSync|existsSync/.test(code)) {
    recommendations.push('동기 파일 I/O (readFileSync 등) — 이벤트 루프 블로킹 주의');
    score -= 0.05;
  }

  return {
    stage: 'STRUCTURE',
    status: issues.length === 0 ? 'pass' : (score >= 0.7 ? 'warning' : 'fail'),
    score: Math.max(0, score),
    issues, recommendations,
    durationMs: Date.now() - t0,
  };
}

// ─────────────────────────────────────────
// GRADE MAPPING
// ─────────────────────────────────────────

function scoreToGrade(score: number): KappaGrade {
  if (score >= 0.85) return 'A';
  if (score >= 0.70) return 'B+';
  if (score >= 0.55) return 'B';
  return 'C';
}

// ─────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────

export function runKappaPipeline(
  ctx: CodeContext,
  currentC: number | null
): KappaPipeline {
  const t0 = Date.now();
  const gate = checkKappaGate(currentC);

  if (!gate.passed) {
    return {
      stages: [],
      overallStatus: 'warning',
      overallScore: 0,
      grade: 'C',
      totalMs: 0,
      arhaGate: { C: currentC, passed: false },
    };
  }

  const stages: StageResult[] = [
    stageSpec(ctx),
    stageQuality(ctx),
    stageSecurity(ctx),
    stageStructure(ctx),
  ];

  const overallScore = stages.reduce((sum, s) => sum + s.score, 0) / stages.length;
  const hasFail      = stages.some(s => s.status === 'fail');
  const overallStatus: ValidationStatus =
    hasFail ? 'fail' : (overallScore >= 0.8 ? 'pass' : 'warning');

  return {
    stages,
    overallStatus,
    overallScore,
    grade: scoreToGrade(overallScore),
    totalMs: Date.now() - t0,
    arhaGate: { C: currentC, passed: true },
  };
}

export function formatKappaSummary(pipeline: KappaPipeline): string {
  if (!pipeline.arhaGate.passed) {
    return `Κ 게이트 미통과: ${pipeline.arhaGate.C !== null ? `C=${pipeline.arhaGate.C.toFixed(2)}` : 'C 미확립'} — 코히런스 0.70 이상 필요`;
  }
  const stageLines = pipeline.stages.map(
    s => `  ${s.stage}: ${s.status.toUpperCase()} (${(s.score * 100).toFixed(0)}%) — 이슈 ${s.issues.length}건`
  ).join('\n');
  return [
    `Κ 진단 결과 — Grade ${pipeline.grade} (${(pipeline.overallScore * 100).toFixed(1)}%) [${pipeline.totalMs}ms]`,
    stageLines,
  ].join('\n');
}
