// C-008 V2 Final Validation Test
// 모든 기능이 실제로 작동하는지 검증

import { HOVCS_ComplianceContainerV2, CodeContext } from './src/containers/C-008_VibeComplianceContainer_V2.js';

// Test Code Sample - 여러 문제를 포함한 실제 코드
const testCode = `
import { db } from './database';
import { auth } from '@auth/core';
import { payment } from '@payment/stripe';

// 문제 1: Async without try-catch
export async function createUser(userData) {
  const user = await db.users.create(userData);
  return user.profile.email;  // 문제 2: Null access
}

// 문제 3: Long function (50+ lines)
export function processPayment(amount, userId, paymentMethod, billingAddress, shippingAddress, discountCode) {
  const apiKey = "sk_live_1234567890";  // 문제 4: Hardcoded secret
  const query = "SELECT * FROM users WHERE id = " + userId;  // 문제 5: SQL injection

  if (amount > 100) {
    if (paymentMethod === 'card') {
      if (billingAddress) {
        if (shippingAddress) {
          if (discountCode) {
            // 문제 6: Deep nesting (5 levels)
            for (let i = 0; i < 100; i++) {
              for (let j = 0; j < 100; j++) {
                // 문제 7: Nested loops (O(n²))
                const result = calculateDiscount(i, j);
              }
            }
          }
        }
      }
    }
  }

  // 문제 8: Magic numbers
  const fee = amount * 0.029 + 0.30;
  const tax = amount * 0.08875;
  const total = amount + fee + tax;

  // 문제 9: Chained array methods
  const items = orders.map(o => o.items).filter(i => i.price > 50);

  return total;
}

// 문제 10: Long parameter list (6 params)
export function calculateShipping(weight, distance, speed, insurance, packaging, priority) {
  return weight * distance * speed;
}

// 문제 11: Duplicated code
function validateEmail(email) {
  return email.includes('@');
}

function validateUsername(username) {
  return username.includes('@');  // Same logic
}

function validateDomain(domain) {
  return domain.includes('@');  // Same logic
}

// 문제 12: High cyclomatic complexity
export function complexFunction(a, b, c, d, e) {
  if (a) {
    if (b) {
      if (c) {
        if (d) {
          if (e) {
            for (let i = 0; i < 10; i++) {
              while (i < 20) {
                switch (i) {
                  case 1:
                  case 2:
                  case 3:
                    return true;
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

export const exportedFunction1 = () => {};
export const exportedFunction2 = () => {};
export const exportedFunction3 = () => {};
export const exportedFunction4 = () => {};
export const exportedFunction5 = () => {};
`;

async function runValidation() {
  console.log('🚀 C-008 V2 최종 검증 시작\n');
  console.log('='.repeat(80));

  const v2 = new HOVCS_ComplianceContainerV2();

  const context: CodeContext = {
    targetPath: './src/api/payment.ts',
    code: testCode,
    language: 'typescript',
    testCoverage: 45,
    performanceBudget: {
      maxLatencyMs: 200,
      maxBundleSizeKb: 50,
      maxMemoryMb: 100
    }
  };

  const result = await v2.validateCode(context);

  console.log('\n📊 검증 결과:\n');
  console.log(`Overall Status: ${result.overallStatus.toUpperCase()}`);
  console.log(`Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
  console.log(`Total Time: ${result.totalTimeMs}ms`);
  console.log('\n' + '='.repeat(80));

  // Stage별 상세 결과
  result.stages.forEach((stage, idx) => {
    console.log(`\n${idx + 1}. ${stage.stage}`);
    console.log(`   Status: ${stage.status.toUpperCase()} (${(stage.score * 100).toFixed(0)}%)`);
    console.log(`   Time: ${stage.executionTimeMs}ms`);

    if (stage.issues.length > 0) {
      console.log(`   Issues (${stage.issues.length}):`);
      stage.issues.forEach(issue => {
        console.log(`     ❌ ${issue}`);
      });
    }

    if (stage.recommendations.length > 0) {
      console.log(`   Recommendations (${stage.recommendations.length}):`);
      stage.recommendations.slice(0, 5).forEach(rec => {
        console.log(`     💡 ${rec.substring(0, 100)}${rec.length > 100 ? '...' : ''}`);
      });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 검증 완료!\n');

  // Feature Coverage Analysis
  console.log('🔍 기능 검증 분석:\n');

  const allIssues = result.stages.flatMap(s => s.issues);
  const allRecs = result.stages.flatMap(s => s.recommendations);

  console.log('탐지된 문제 타입:');
  const detectedIssues = {
    asyncError: allIssues.some(i => i.includes('Async')),
    nullAccess: allIssues.some(i => i.includes('null')),
    hardcodedSecret: allIssues.some(i => i.includes('secret') || i.includes('hardcoded')),
    sqlInjection: allIssues.some(i => i.includes('SQL')),
    deepNesting: allIssues.some(i => i.includes('nesting')),
    nestedLoops: allIssues.some(i => i.includes('Nested loops') || i.includes('O(n²)')),
    complexity: allIssues.some(i => i.includes('complexity')),
    longFunction: allIssues.some(i => i.includes('Long Function')),
    longParams: allIssues.some(i => i.includes('Parameter List')),
    testCoverage: allIssues.some(i => i.includes('coverage') || i.includes('test'))
  };

  Object.entries(detectedIssues).forEach(([key, detected]) => {
    console.log(`  ${detected ? '✅' : '❌'} ${key}`);
  });

  console.log('\n생성된 도움말:');
  const generatedHelp = {
    testTemplate: allRecs.some(r => r.includes('describe(') || r.includes('test template')),
    performanceAdvice: allRecs.some(r => r.includes('performance') || r.includes('complexity')),
    securityAdvice: allRecs.some(r => r.includes('security') || r.includes('environment')),
    refactoringAdvice: allRecs.some(r => r.includes('refactor') || r.includes('Extract')),
    criticalPath: allRecs.some(r => r.includes('Critical') || r.includes('critical'))
  };

  Object.entries(generatedHelp).forEach(([key, generated]) => {
    console.log(`  ${generated ? '✅' : '❌'} ${key}`);
  });

  console.log('\n' + '='.repeat(80));

  // Success criteria
  const successCriteria = {
    'All stages executed': result.stages.length === 5,
    'Detected async errors': detectedIssues.asyncError,
    'Detected security issues': detectedIssues.hardcodedSecret || detectedIssues.sqlInjection,
    'Detected performance issues': detectedIssues.nestedLoops || detectedIssues.complexity,
    'Generated test templates': generatedHelp.testTemplate,
    'Fast execution (<300ms)': result.totalTimeMs < 300,
    'Overall score calculated': result.overallScore > 0 && result.overallScore <= 1
  };

  console.log('\n🎯 성공 기준 검증:\n');
  const passedCriteria = Object.entries(successCriteria).filter(([_, passed]) => passed).length;
  const totalCriteria = Object.keys(successCriteria).length;

  Object.entries(successCriteria).forEach(([criterion, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${criterion}`);
  });

  console.log(`\n최종 점수: ${passedCriteria}/${totalCriteria} (${(passedCriteria/totalCriteria*100).toFixed(0)}%)`);

  if (passedCriteria === totalCriteria) {
    console.log('\n🎉 모든 기능이 정상 작동합니다!');
  } else {
    console.log('\n⚠️  일부 기능에 문제가 있습니다.');
  }
}

runValidation().catch(console.error);
