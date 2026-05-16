/**
 * AM unit tests.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phiMapping, isVValid } from './phi.js';
import { activateModes, normalizeTrace } from './modes.js';
import { hadamard, extractKyeol, zeros10 } from './matrix.js';
import { bondEnergy, decidePhase, K_SQUARED } from './decide.js';
import { dynamicTheta } from './collapse.js';
import { processAM, newSession } from './master.js';
import Diana from '../personas/diana.js';
import { ALL_MASTERS } from '../personas/masters.js';

test('phi: (+san, +san, 0.9) yields a valid V', () => {
  const V = phiMapping({ epsilon: 1, delta: 1, I: 0.9 });
  assert.ok(isVValid(V));
  assert.ok(V.a >= 0.3 && V.a <= 1);
  assert.ok(V.b > 0 && V.b <= 1);
  assert.ok(V.c > 0 && V.c <= 1);
});

test('mode activation: Σσ² ≈ 10', () => {
  const sigma = activateModes({ s_delta: 0.6, s_v: 0.4, s_T: 0.5, s_E: 0.3 });
  assert.equal(sigma.length, 10);
  const sumSq = sigma.reduce((s, v) => s + v * v, 0);
  assert.ok(Math.abs(sumSq - 10) < 1);
});

test('normalizeTrace: Tr(Γ) = 10', () => {
  const M = zeros10();
  for (let i = 0; i < 10; i++) M[i][i] = Math.random() * 3 + 0.1;
  const N = normalizeTrace(M);
  const trace = N.reduce((s, _, i) => s + N[i][i], 0);
  assert.ok(Math.abs(trace - 10) < 0.001);
});

test('hadamard: element-wise product', () => {
  const A = zeros10();
  const B = zeros10();
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { A[i][j] = 0.5; B[i][j] = 0.4; }
  const C = hadamard(A, B);
  assert.equal(C[0][0], 0.2);
  assert.equal(C[5][5], 0.2);
});

test('kyeol: cells above threshold are captured', () => {
  const M = zeros10();
  M[3][3] = 0.5;
  M[7][2] = 0.3;
  M[0][0] = 0.1;
  const k = extractKyeol(M, 0.15);
  assert.ok(k.cells.find(c => c.i === 3 && c.j === 3));
  assert.equal(k.cells.find(c => c.i === 0 && c.j === 0), undefined);
});

test('E_B: bottleneck enforced', () => {
  const e = bondEnergy(0.8, 0.2, 0);
  assert.ok(e <= 0.2);
});

test('phase decision', () => {
  assert.equal(decidePhase(0.5), 'wave');
  assert.equal(decidePhase(K_SQUARED + 0.01), 'particle');
});

test('theta dynamic', () => {
  const t1 = dynamicTheta(0);
  const t2 = dynamicTheta(1);
  assert.ok(t2 < t1);
  assert.ok(t1 <= K_SQUARED);
  assert.ok(t2 >= 0.525);
});

test('Diana persona Γ_identity trace = 10', () => {
  const trace = Diana.gammaIdentity.reduce((s, _, i) => s + Diana.gammaIdentity[i][i], 0);
  assert.ok(Math.abs(trace - 10) < 0.01);
});

test('All masters have Tr(Γ) = 10', () => {
  assert.equal(ALL_MASTERS.length, 12);
  for (const p of [Diana, ...ALL_MASTERS]) {
    const tr = p.gammaIdentity.reduce((s, _, i) => s + p.gammaIdentity[i][i], 0);
    assert.ok(Math.abs(tr - 10) < 0.01, `${p.displayName} trace=${tr}`);
  }
});

test('processAM: end-to-end on Diana', () => {
  const session = newSession();
  const state = processAM({ text: 'hey there!', sessionId: 't1' }, Diana, session);
  assert.equal(state.sigma_vector.length, 10);
  assert.equal(state.gamma_interfere.length, 10);
  assert.ok(state.E_B >= 0 && state.E_B <= 1);
  assert.ok(state.theta_t >= 0.525 && state.theta_t <= K_SQUARED);
  assert.equal(state.turn, 1);
});

test('processAM: multi-turn baseline drift', () => {
  const session = newSession();
  const initBaseline = session.B_n;
  processAM({ text: 'hello', sessionId: 't' }, Diana, session);
  processAM({ text: 'hey, first time seeing this!', sessionId: 't' }, Diana, session);
  assert.equal(session.turn, 2);
  assert.ok(session.B_n !== initBaseline);
});
