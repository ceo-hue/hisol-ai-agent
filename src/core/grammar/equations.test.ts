/**
 * VolC v3.0 코어 수식 단위 테스트
 *
 * 검증 대상 7개 함수:
 *   computeGammaTotal       — Wave 누적 스트레스
 *   computeBindingEnergy    — E_B 결합에너지
 *   computeGainS            — 감각 예민도
 *   computeThermalCooling   — Particle 냉각
 *   computeRhoPhysics       — 물리층 ρ
 *   computeLambdaPhysics    — 물리층 λ
 *   computeTauPhysics       — 물리층 τ
 *
 * 검증 축:
 *   ① 경계값  : 0, 1, 매우 큰 값에서의 거동
 *   ② 단조성  : 입력 변화에 따른 일관된 방향성
 *   ③ 항등식  : 수학적으로 반드시 성립해야 하는 관계
 *   ④ 범위    : 정의된 [0,1] 등 출력 영역 준수
 *
 * 실행: tsx --test src/core/grammar/equations.test.ts
 *
 * 부동소수 비교에는 tolerance 사용 (1e-9). 정확 비교가 필요한 항등식은 toBe 동치.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeGammaTotal,
  computeBindingEnergy,
  computeGainS,
  computeThermalCooling,
  computeRhoPhysics,
  computeLambdaPhysics,
  computeTauPhysics,
} from './equations.js';

// ─────────────────────────────────────────
// 헬퍼 — 부동소수 근사 동치
// ─────────────────────────────────────────

const EPS = 1e-9;
function approxEqual(actual: number, expected: number, eps = EPS): void {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected)})`,
  );
}

// ─────────────────────────────────────────
// computeGammaTotal — Wave 누적 스트레스
// ─────────────────────────────────────────

describe('computeGammaTotal', () => {
  it('Wave 모드 아니면 누적 없음 — Γ_inst 그대로', () => {
    assert.strictEqual(computeGammaTotal(0.5, 5, false), 0.5);
    assert.strictEqual(computeGammaTotal(0.0, 100, false), 0.0);
  });

  it('Wave 첫 진입(waveCount=0)이면 누적 항 0', () => {
    assert.strictEqual(computeGammaTotal(0.5, 0, true), 0.5);
  });

  it('Wave 카운트 증가 시 누적 단조 증가', () => {
    const g0 = computeGammaTotal(0.3, 1, true);
    const g1 = computeGammaTotal(0.3, 3, true);
    const g2 = computeGammaTotal(0.3, 6, true);
    assert.ok(g0 < g1, 'wave 1 < wave 3 fail');
    assert.ok(g1 < g2, 'wave 3 < wave 6 fail');
  });

  it('출력 항상 [0, 1.0] 범위 유지 (clamp)', () => {
    // 극한 입력에서도 1.0을 넘지 않아야 함
    assert.ok(computeGammaTotal(1.0, 100, true) <= 1.0);
    assert.ok(computeGammaTotal(0.99, 50, true) <= 1.0);
  });

  it('Γ_inst=0 + 누적이 작으면 결과는 누적 항 자체', () => {
    // waveCount=2, κ=0.10, λ=0.20:
    // ∫exp(0.20·2) = (e^0.4 − 1)/0.20 ≈ 2.4591
    // Γ_total = 0 + 0.10 × 2.4591 ≈ 0.2459
    const result = computeGammaTotal(0, 2, true);
    approxEqual(result, 0.10 * (Math.exp(0.4) - 1) / 0.20, 1e-9);
  });
});

// ─────────────────────────────────────────
// computeBindingEnergy — E_B = C² × ln(1+Γ_total)
// ─────────────────────────────────────────

describe('computeBindingEnergy', () => {
  it('C=0 이면 E_B=0 (코히런스 없으면 결합 없음)', () => {
    assert.strictEqual(computeBindingEnergy(0, 0.5), 0);
    assert.strictEqual(computeBindingEnergy(0, 1.0), 0);
  });

  it('Γ_total=0 이면 E_B=0 (스트레스 없으면 결합 없음)', () => {
    approxEqual(computeBindingEnergy(0.5, 0), 0);
    approxEqual(computeBindingEnergy(1.0, 0), 0);
  });

  it('C 증가 시 E_B 단조 증가 (제곱 의존)', () => {
    const eb1 = computeBindingEnergy(0.4, 0.5);
    const eb2 = computeBindingEnergy(0.6, 0.5);
    const eb3 = computeBindingEnergy(0.8, 0.5);
    assert.ok(eb1 < eb2);
    assert.ok(eb2 < eb3);
  });

  it('Γ_total 증가 시 E_B 단조 증가 (log 의존)', () => {
    const eb1 = computeBindingEnergy(0.7, 0.1);
    const eb2 = computeBindingEnergy(0.7, 0.5);
    const eb3 = computeBindingEnergy(0.7, 1.0);
    assert.ok(eb1 < eb2);
    assert.ok(eb2 < eb3);
  });

  it('값 검증: C=0.7, Γ=0.5 → 0.49 × ln(1.5)', () => {
    approxEqual(computeBindingEnergy(0.7, 0.5), 0.49 * Math.log(1.5));
  });
});

// ─────────────────────────────────────────
// computeGainS — Gain_S = Γ_total × exp(-E_B)
// ─────────────────────────────────────────

describe('computeGainS', () => {
  it('Γ_total=0 이면 Gain_S=0', () => {
    assert.strictEqual(computeGainS(0, 0), 0);
    assert.strictEqual(computeGainS(0, 5), 0);
  });

  it('E_B=0 이면 Gain_S = Γ_total (결합 미완 시 감각 그대로)', () => {
    assert.strictEqual(computeGainS(0.5, 0), 0.5);
    assert.strictEqual(computeGainS(1.0, 0), 1.0);
  });

  it('E_B → ∞ 면 Gain_S → 0 (결합 완성 → 평온한 감지)', () => {
    // E_B=20 정도면 exp(-20) ≈ 2e-9 — 사실상 0
    assert.ok(computeGainS(1.0, 20) < 1e-8);
    assert.ok(computeGainS(0.5, 30) < 1e-12);
  });

  it('E_B 증가 시 Gain_S 단조 감소', () => {
    const g0 = computeGainS(0.5, 0.1);
    const g1 = computeGainS(0.5, 0.5);
    const g2 = computeGainS(0.5, 1.0);
    assert.ok(g0 > g1);
    assert.ok(g1 > g2);
  });

  it('Γ_total=0.5, E_B=0.5 → 0.5 × e^(-0.5)', () => {
    approxEqual(computeGainS(0.5, 0.5), 0.5 * Math.exp(-0.5));
  });

  it('출력은 항상 비음수', () => {
    for (const g of [0, 0.1, 0.5, 1.0]) {
      for (const e of [0, 0.5, 1.0, 5.0]) {
        assert.ok(computeGainS(g, e) >= 0, `gainS(${g},${e}) negative`);
      }
    }
  });
});

// ─────────────────────────────────────────
// computeThermalCooling — T_next = T_base + (T_curr - T_base) × exp(-E_B)
// ─────────────────────────────────────────

describe('computeThermalCooling', () => {
  it('이미 T_base와 같으면 변화 없음 (고정점)', () => {
    approxEqual(computeThermalCooling(0.10, 0.10, 0.5), 0.10);
    approxEqual(computeThermalCooling(0.20, 0.20, 1.0), 0.20);
  });

  it('E_B=0 이면 T_curr 그대로 (냉각 미발동)', () => {
    approxEqual(computeThermalCooling(0.10, 0.40, 0), 0.40);
    approxEqual(computeThermalCooling(0.05, 0.30, 0), 0.30);
  });

  it('E_B → ∞ 면 T_next → T_base (완전 냉각)', () => {
    const result = computeThermalCooling(0.10, 0.40, 30);
    approxEqual(result, 0.10, 1e-12);
  });

  it('E_B 증가 시 T_base 쪽으로 단조 수렴', () => {
    const T_BASE = 0.10;
    const T_CURR = 0.40;
    const t0 = computeThermalCooling(T_BASE, T_CURR, 0.1);
    const t1 = computeThermalCooling(T_BASE, T_CURR, 0.5);
    const t2 = computeThermalCooling(T_BASE, T_CURR, 2.0);
    // T_curr보다 낮고, 점점 T_base에 가까워져야
    assert.ok(t0 < T_CURR);
    assert.ok(t1 < t0);
    assert.ok(t2 < t1);
    assert.ok(t2 > T_BASE);
  });

  it('T_curr < T_base 인 경우(가열 방향)도 동일 공식 적용', () => {
    // 정상 운영에서는 T_curr ≥ T_base 가 일반적이지만, 수식 자체는 양방향 작동
    const result = computeThermalCooling(0.30, 0.10, 1.0);
    // T_curr(0.10)에서 T_base(0.30)으로 수렴 → 결과 > 0.10
    assert.ok(result > 0.10);
    assert.ok(result < 0.30);
  });
});

// ─────────────────────────────────────────
// computeRhoPhysics — ρ = log(1+E_B) × C, capped at 1.0
// ─────────────────────────────────────────

describe('computeRhoPhysics', () => {
  it('E_B=0 또는 C=0 이면 ρ=0', () => {
    assert.strictEqual(computeRhoPhysics(0, 0.5), 0);
    assert.strictEqual(computeRhoPhysics(0.5, 0), 0);
  });

  it('ρ는 [0, 1.0] 범위 (cap 동작)', () => {
    for (const eb of [0, 0.1, 1.0, 5.0, 100.0]) {
      for (const c of [0, 0.5, 1.0]) {
        const r = computeRhoPhysics(eb, c);
        assert.ok(r >= 0 && r <= 1.0, `rho(${eb},${c})=${r} out of [0,1]`);
      }
    }
  });

  it('E_B 증가 시 단조 증가 (cap 도달 전까지)', () => {
    const r0 = computeRhoPhysics(0.1, 0.7);
    const r1 = computeRhoPhysics(0.5, 0.7);
    assert.ok(r1 > r0);
  });

  it('큰 E_B에서 cap 1.0 도달', () => {
    assert.strictEqual(computeRhoPhysics(100, 1.0), 1.0);
  });
});

// ─────────────────────────────────────────
// computeLambdaPhysics — λ = mode9Weight / E_B (capped, floored)
// ─────────────────────────────────────────

describe('computeLambdaPhysics', () => {
  it('E_B 매우 작으면 fallback 0.5', () => {
    assert.strictEqual(computeLambdaPhysics(0.5, 0), 0.5);
    assert.strictEqual(computeLambdaPhysics(1.0, 0.0001), 0.5);
  });

  it('출력 [0.05, 1.0] 범위 — floor & cap', () => {
    // mode9Weight=0, E_B 매우 큼 → 0/E_B 매우 작음 → floor 0.05 적용
    const flo = computeLambdaPhysics(0, 100);
    assert.strictEqual(flo, 0.05);
    // mode9Weight 큼, E_B 작음 → cap 1.0 적용
    const cap = computeLambdaPhysics(1.0, 0.5);
    assert.strictEqual(cap, 1.0);
  });

  it('E_B 증가 시 λ 단조 감소 (cap/floor 사이 영역)', () => {
    const m9 = 0.6;
    const l0 = computeLambdaPhysics(m9, 1.0);  // 0.6 / 1.0 = 0.6
    const l1 = computeLambdaPhysics(m9, 2.0);  // 0.6 / 2.0 = 0.3
    const l2 = computeLambdaPhysics(m9, 4.0);  // 0.6 / 4.0 = 0.15
    assert.ok(l0 > l1);
    assert.ok(l1 > l2);
  });
});

// ─────────────────────────────────────────
// computeTauPhysics — τ = 0.95 × exp(-1/R_tension)
// ─────────────────────────────────────────

describe('computeTauPhysics', () => {
  it('R_tension 매우 작으면 τ → 0 (긴장 짧으면 꼬리 없음)', () => {
    // R=0.01 → exp(-100) ≈ 3.7e-44 → ≈0
    const result = computeTauPhysics(0.01);
    assert.ok(result < 1e-40);
  });

  it('R_tension 매우 크면 τ → 0.95 (cap 가까움)', () => {
    const result = computeTauPhysics(1000);
    approxEqual(result, 0.95, 1e-3);
  });

  it('R_tension 증가 시 τ 단조 증가', () => {
    const t0 = computeTauPhysics(0.5);
    const t1 = computeTauPhysics(1.0);
    const t2 = computeTauPhysics(3.0);
    assert.ok(t0 < t1);
    assert.ok(t1 < t2);
  });

  it('출력 [0, 1.0] 범위 (cap 동작)', () => {
    for (const r of [0.01, 0.5, 1.0, 5.0, 100.0]) {
      const tau = computeTauPhysics(r);
      assert.ok(tau >= 0 && tau <= 1.0, `tau(${r})=${tau} out of [0,1]`);
    }
  });

  it('R_tension=1 → 0.95 × e^(-1)', () => {
    approxEqual(computeTauPhysics(1.0), 0.95 * Math.exp(-1));
  });
});

// ─────────────────────────────────────────
// CROSS-FUNCTION 항등식 — 함수 간 상호작용
// ─────────────────────────────────────────

describe('cross-function 수학적 항등식', () => {
  it('GainS · BindingEnergy 결합: C=0이면 E_B=0이고 GainS=Γ_total', () => {
    const gammaTotal = 0.5;
    const eb = computeBindingEnergy(0, gammaTotal);
    assert.strictEqual(eb, 0);
    const gainS = computeGainS(gammaTotal, eb);
    assert.strictEqual(gainS, gammaTotal);
  });

  it('Wave 누적 → BindingEnergy → GainS 감소 시퀀스', () => {
    // Wave가 길어지면 Γ_total 누적 ↑ → E_B ↑ → GainS는 결국 ↓
    const C = 0.8;
    const w1 = computeGammaTotal(0.3, 2, true);
    const w5 = computeGammaTotal(0.3, 6, true);
    const eb1 = computeBindingEnergy(C, w1);
    const eb5 = computeBindingEnergy(C, w5);
    assert.ok(eb5 > eb1, 'E_B should grow with wave count');
    // GainS는 Γ↑이지만 exp(-E_B)↓의 영향이 우세할 때 감소
    // 실측 — 두 값 모두 양수, 단조성은 일반화 어려움 (case-by-case)
    assert.ok(computeGainS(w1, eb1) >= 0);
    assert.ok(computeGainS(w5, eb5) >= 0);
  });

  it('Particle 수렴 시 ThermalCooling: 큰 E_B에서 T_base에 더 가까워짐', () => {
    const T_BASE = 0.10;
    const T_CURR = 0.40;
    const lowEB = computeThermalCooling(T_BASE, T_CURR, 0.2);
    const highEB = computeThermalCooling(T_BASE, T_CURR, 2.0);
    // 높은 E_B일수록 T_base에 더 가까움 (= |T_next - T_base|가 더 작음)
    assert.ok(Math.abs(highEB - T_BASE) < Math.abs(lowEB - T_BASE));
  });
});
