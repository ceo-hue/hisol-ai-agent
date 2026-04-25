// ARHA Logger Usage Examples — Vol.A~E Layer Names

import { log, createLogger, logTiming, logBatch } from './logger.js';

export function example1_BasicLogging() {
  log('Gateway', 'INFO',  'Processing API request',  { method: 'POST', path: '/v1/arha/process' });
  log('Gateway', 'WARN',  'Slow response detected',  { durationMs: 2500, threshold: 1000 });
  log('Gateway', 'ERROR', 'API request failed',      { error: 'Claude API timeout' });
}

export function example2_LayerLogger() {
  const logger = createLogger('Vol.E');
  logger.info('Κ validation started',   { targetPath: './src/api/gateway.ts', depth: 'CORE' });
  logger.warn('Low coherence gate',     { C: 0.55, required: 0.70 });
  logger.info('Κ validation complete',  { grade: 'B+', score: 0.78 });
}

export function example3_PerformanceTiming() {
  const timer = logTiming('Vol.E', 'Κ diagnostic pipeline');
  timer.end({ stages: 4, issues: 2, grade: 'B+' });
}

export function example4_BatchLogging() {
  logBatch('Vol.E', [
    { level: 'INFO', message: 'SPEC: pass',      metadata: { score: 0.90 } },
    { level: 'WARN', message: 'QUALITY: warning',metadata: { score: 0.75, issues: 3 } },
    { level: 'INFO', message: 'SECURITY: pass',  metadata: { score: 1.00 } },
    { level: 'WARN', message: 'STRUCTURE: warning', metadata: { score: 0.70 } },
  ]);
}

export async function example5_GatewayFlow() {
  const logger = createLogger('Gateway');
  logger.info('Request received',  { sessionId: 'sess_abc', input: '오늘 좀 힘들어...' });
  const t = logTiming('Gateway', 'ARHA process + Claude call');
  await new Promise(r => setTimeout(r, 50));
  t.end({ phase: 'Wave', grade: 'A', C: 0.92 });
  logger.info('Response sent', { statusCode: 200, qualityGrade: 'A' });
}

export function example6_UpsilonObserve() {
  const logger = createLogger('Vol.E');
  logger.info('Υ observation complete', {
    turns: 8, coherenceDir: 'rising', phaseLabel: 'Mostly Particle',
    dominantEngine: 'Xi_C', stressLabel: 'Calm',
  });
}

export async function example7_MultiLayerTrace() {
  const sid = 'sess_xyz789';
  log('MCP',         'INFO', 'Tool call received',         { tool: 'arha_process', sid });
  log('Vol.D',       'INFO', 'Turn pipeline started',      { turn: 5, sid });
  log('Vol.B',       'INFO', 'σ computed',                 { curlSq: 0.42, C: 0.88, sid });
  log('Vol.E',       'INFO', 'Skill dispatch',             { active: ['S_FOUNDATION_LISTEN'], sid });
  log('Persistence', 'INFO', 'Session saved',              { snapshots: 5, history: 10, sid });
  log('Gateway',     'INFO', 'Response delivered',         { grade: 'A', phase: 'Particle', sid });
}

export async function runAllExamples() {
  example1_BasicLogging();
  example2_LayerLogger();
  example3_PerformanceTiming();
  example4_BatchLogging();
  await example5_GatewayFlow();
  example6_UpsilonObserve();
  await example7_MultiLayerTrace();
  console.log('\n=== All Examples Complete ===');
  console.log('Grep: [ARHA:Gateway] | [ARHA:Vol.E] | [ARHA:Persistence]');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
