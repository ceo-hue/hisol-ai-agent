/**
 * Signal extraction: text → V_in / V_con → s → σ_vector + σ scalar
 * Hint lists are language-agnostic substrings; works for KO and EN inputs.
 */
import { VInSensor, VConSensor, SignalVector, SigmaVector } from './types.js';
import { activateModes } from './modes.js';

const POS_HINTS = [
  'love', 'great', 'happy', 'nice', 'good', 'thanks', 'awesome', 'glad',
  '좋아', '사랑', '기쁘', '행복', '즐거', '신나', '재밌', '따뜻', '괜찮', '응원', '고마', '예쁘',
];
const NEG_HINTS = [
  'hate', 'sad', 'tired', 'sorry', 'hurt', 'worried', 'scared', 'awful',
  '싫어', '슬프', '우울', '힘들', '아프', '괴로', '미안', '죄송', '걱정', '두렵', '무서', '지쳐',
];
const HARD_HINTS = [
  'must', 'have to', 'required', 'decide', 'certain',
  '해야', '반드시', '명령', '결정', '확실', '단호', '강제', '필수',
];
const SOFT_HINTS = [
  'maybe', 'perhaps', 'kinda', 'somewhat', 'might',
  '혹시', '아마', '같아', '그런가',
];
const URGENT = [
  'urgent', 'now', 'asap', '!', '?!',
  '급해', '빨리', '지금', '당장',
];

function countHints(text: string, list: string[]): number {
  const lower = text.toLowerCase();
  let c = 0;
  for (const h of list) {
    const occ = lower.split(h.toLowerCase()).length - 1;
    c += occ;
  }
  return c;
}

export function extractVIn(text: string, baseline: number, prevDelta: number): VInSensor {
  const len = text.length;
  const pos = countHints(text, POS_HINTS);
  const neg = countHints(text, NEG_HINTS);
  const hard = countHints(text, HARD_HINTS);
  const soft = countHints(text, SOFT_HINTS);
  const urg = countHints(text, URGENT);

  const signal = Math.min(1, (pos + neg) / Math.max(1, len / 20) + urg * 0.1);
  const delta = signal - baseline;
  const v = delta - prevDelta;

  const textureRaw = (soft - hard) / Math.max(1, soft + hard);
  const texture = Math.max(-1, Math.min(1, textureRaw));

  const tokens = text.split(/\s+/).filter(Boolean);
  const unique = new Set(tokens).size;
  const entropy = Math.min(1, unique / Math.max(1, tokens.length));

  return { pattern: { B: baseline, delta, v }, texture, entropy };
}

export function extractVCon(text: string): VConSensor {
  const len = text.length;
  const hasPast =     /remember|past|ago|yesterday|기억|예전|전에|어제|옛|과거/i.test(text);
  const hasNow =      /now|today|immediately|지금|당장|이번|오늘|방금/i.test(text);
  const hasAbstract = /meaning|essence|value|why|의미|존재|본질|가치|이유|왜/i.test(text);
  const hasConcrete = /\d|code|bug|file|how|when|where|코드|버그|파일|어떻게|언제|어디/i.test(text);

  const tau = hasPast ? 0.85 : hasNow ? 0.25 : 0.55;
  const lambda = hasAbstract ? 0.80 : hasConcrete ? 0.30 : 0.55;
  const rho = Math.min(1, len / 200);

  return { tau, lambda, rho };
}

export function buildSignal(V_in: VInSensor, v_max = 1.0): SignalVector {
  return {
    s_delta: Math.max(0, Math.min(1, Math.abs(V_in.pattern.delta) / Math.max(0.01, V_in.pattern.B + 0.5))),
    s_v:     Math.max(0, Math.min(1, Math.abs(V_in.pattern.v) / v_max)),
    s_T:     V_in.texture,
    s_E:     V_in.entropy,
  };
}

export function intersectSigma(V_in: VInSensor, V_con: VConSensor): number {
  const signal = Math.abs(V_in.pattern.delta) + V_in.pattern.B;
  const context = (V_con.rho + V_con.lambda + V_con.tau) / 3;
  return Math.max(0, Math.min(1, signal * 0.5 + context * 0.5));
}

/** |∇×σ|² — signal tension (variance + neighbor cross) */
export function curlSquared(sigma_vector: SigmaVector): number {
  const mean = sigma_vector.reduce((a, v) => a + v, 0) / 10;
  const variance = sigma_vector.reduce((a, v) => a + (v - mean) ** 2, 0) / 10;
  let cross = 0;
  for (let i = 0; i < 9; i++) cross += (sigma_vector[i + 1] - sigma_vector[i]) ** 2;
  cross /= 9;
  return Math.max(0, Math.min(2, variance + cross));
}

export { activateModes };
