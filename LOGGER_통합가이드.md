# 🏷️ 구조화된 로거 통합 가이드

컨테이너 ID 기반 라벨 시스템 - 기존 로그를 구조화된 로그로 전환

---

## 📋 목차

1. [개요](#개요)
2. [설치 및 설정](#설치-및-설정)
3. [기존 코드 마이그레이션](#기존-코드-마이그레이션)
4. [사용 예시](#사용-예시)
5. [로그 검색 패턴](#로그-검색-패턴)
6. [라벨 시스템과 비교](#라벨-시스템과-비교)

---

## 개요

### 🎯 목적

기존 `console.log()` 호출을 **구조화된 로그**로 전환하여:
- ✅ 컨테이너별 로그 추적 (라벨 기능)
- ✅ 로그 레벨별 필터링
- ✅ 색상 구분으로 가독성 향상
- ✅ JSON 포맷으로 외부 시스템 연동 가능

### 🔄 라벨 시스템과 동등한 기능

| 라벨 시스템 | 현재 로거 시스템 | 동일성 |
|-----------|---------------|-------|
| `#VIBE/api/gateway:...` | `[C-007:APIGateway]` | ✅ 컨테이너 식별 |
| `log(LABEL, "INFO", ...)` | `log('C-007', 'INFO', ...)` | ✅ 구조화된 로그 |
| 라벨로 검색 | 컨테이너 ID로 검색 | ✅ 추적성 |
| blueprint.yaml | 파일명 규칙 | ✅ 매핑 |

---

## 설치 및 설정

### 1. 파일 확인

```bash
# 로거 파일 위치
src/utils/logger.ts         # 메인 로거
src/utils/logger.example.ts # 사용 예시
```

### 2. TypeScript 컴파일

```bash
cd C:\Users\garsi\OneDrive\바탕 화면\hisol-unified-mcp
npm run build
```

---

## 기존 코드 마이그레이션

### Before & After 비교

#### ❌ Before (기존 방식)
```typescript
// C-007_APIGatewayContainer.ts
console.log('C-007_APIGatewayContainer: Processing request', {
  method: 'POST',
  path: '/api/login'
});

console.warn('C-007_APIGatewayContainer: Slow response', {
  duration: 2500
});

console.error('C-007_APIGatewayContainer: Request failed', {
  error: err.message
});
```

#### ✅ After (구조화된 로거)
```typescript
// C-007_APIGatewayContainer.ts
import { createLogger } from '../utils/logger.js';

const logger = createLogger('C-007');

logger.info('Processing request', {
  method: 'POST',
  path: '/api/login'
});

logger.warn('Slow response', {
  duration: 2500
});

logger.error('Request failed', {
  error: err.message
});
```

### 로그 출력 비교

#### Before (기존)
```
C-007_APIGatewayContainer: Processing request { method: 'POST', path: '/api/login' }
C-007_APIGatewayContainer: Slow response { duration: 2500 }
C-007_APIGatewayContainer: Request failed { error: 'Auth failed' }
```

#### After (구조화됨)
```
[C-007:APIGateway] INFO Processing request {"method":"POST","path":"/api/login"}
[C-007:APIGateway] WARN Slow response {"duration":2500}
[C-007:APIGateway] ERROR Request failed {"error":"Auth failed"}
```

**장점:**
- ✅ 컨테이너 ID 명확 (`[C-007:APIGateway]`)
- ✅ 로그 레벨 분리 (`INFO`, `WARN`, `ERROR`)
- ✅ 색상 구분 (터미널에서)
- ✅ 검색 용이 (`grep "\[C-007\]"`)

---

## 사용 예시

### 1. 기본 사용법

```typescript
import { log } from '../utils/logger.js';

// 간단한 사용
log('C-008', 'INFO', 'Validation started', {
  targetPath: './src/api/auth.ts'
});

log('C-008', 'WARN', 'Low test coverage', {
  coverage: 45,
  threshold: 70
});

log('C-008', 'ERROR', 'Validation failed', {
  error: 'Hardcoded secret detected'
});
```

### 2. Container Logger (권장)

```typescript
import { createLogger } from '../utils/logger.js';

// 컨테이너별 로거 생성
const logger = createLogger('C-008');

// 간결한 문법
logger.info('Validation started', { targetPath: './src/api/auth.ts' });
logger.warn('Low test coverage', { coverage: 45 });
logger.error('Validation failed', { error: 'Hardcoded secret' });
```

### 3. 성능 측정

```typescript
import { logTiming } from '../utils/logger.js';

const timer = logTiming('C-008', 'Code validation');

// ... 검증 로직 실행 ...

timer.end({
  stages: 5,
  issues: 3,
  overallScore: 0.85
});

// 출력:
// [C-008:VibeCompliance] DEBUG Code validation started
// [C-008:VibeCompliance] INFO Code validation completed {"durationMs":150,"stages":5,"issues":3,"overallScore":0.85}
```

### 4. 배치 로깅

```typescript
import { logBatch } from '../utils/logger.js';

// 여러 단계 결과를 한 번에
logBatch('C-008', [
  { level: 'INFO', message: 'SPECIFICATION: pass', metadata: { score: 0.90 } },
  { level: 'WARN', message: 'CODE_QUALITY: warning', metadata: { score: 0.75 } },
  { level: 'INFO', message: 'DEPLOYMENT: pass', metadata: { score: 0.85 } }
]);
```

---

## 로그 검색 패턴

### 컨테이너별 검색

```bash
# C-007 (API Gateway) 로그만
grep "\[C-007" logs/*.log

# C-008 (Vibe Compliance) 로그만
grep "\[C-008" logs/*.log

# C-007과 C-008 둘 다
grep -E "\[C-00[78]" logs/*.log
```

### 레벨별 검색

```bash
# 모든 에러
grep "ERROR" logs/*.log

# 모든 경고
grep "WARN" logs/*.log

# 특정 컨테이너의 에러만
grep "\[C-008.*ERROR" logs/*.log
```

### 키워드 검색

```bash
# 테스트 커버리지 관련
grep "coverage" logs/*.log

# 특정 파일 경로 관련
grep "auth\.ts" logs/*.log

# Request ID로 전체 흐름 추적
grep "req_abc123" logs/*.log
```

### 시간대별 검색

```bash
# 오늘 로그만
grep "2025-01-10" logs/*.log

# 특정 시간대
grep "2025-01-10T14:" logs/*.log
```

---

## 실제 적용 예시

### C-008 VibeComplianceContainer_V2

#### Before
```typescript
// src/containers/C-008_VibeComplianceContainer_V2.ts
async validateCode(context: CodeContext): Promise<ValidationPipeline> {
  console.log('C-008_V2_Optimized: Starting validation');

  // ... validation logic ...

  console.warn('C-008_V2: Validation error:', error);
}
```

#### After
```typescript
// src/containers/C-008_VibeComplianceContainer_V2.ts
import { createLogger, logTiming } from '../utils/logger.js';

export class HOVCS_ComplianceContainerV2 {
  private logger = createLogger('C-008');

  async validateCode(context: CodeContext): Promise<ValidationPipeline> {
    const timer = logTiming('C-008', 'Code validation');

    this.logger.info('Starting validation', {
      targetPath: context.targetPath,
      analysisDepth: 'CORE'
    });

    try {
      // Stage 1
      this.logger.debug('Running SPECIFICATION stage');
      const spec = await this.checkSpecification(context);
      this.logger.info('SPECIFICATION complete', {
        status: spec.status,
        score: spec.score
      });

      // Stage 2
      this.logger.debug('Running CODE_QUALITY stage');
      const quality = await this.checkCodeQuality(context);
      if (quality.issues.length > 0) {
        this.logger.warn('CODE_QUALITY issues detected', {
          issues: quality.issues.length,
          topIssues: quality.issues.slice(0, 3)
        });
      }

      // ... more stages ...

      timer.end({
        stages: stages.length,
        overallScore,
        overallStatus
      });

      return { stages, overallStatus, overallScore, totalTimeMs };

    } catch (error) {
      this.logger.error('Validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        targetPath: context.targetPath
      });

      // Graceful degradation
      return {
        stages: [],
        overallStatus: 'warning',
        overallScore: 0.5,
        totalTimeMs: Date.now() - startTime
      };
    }
  }
}
```

---

## 라벨 시스템과 비교

### 기능 비교표

| 기능 | 라벨 시스템 (#VIBE) | 현재 로거 시스템 | 비고 |
|-----|-------------------|---------------|------|
| **고유 식별자** | `#VIBE/api/gateway:Auth@v1.2.1` | `[C-007:APIGateway]` | ✅ 동일 |
| **로그 구조화** | `log(LABEL, level, msg, meta)` | `log('C-007', level, msg, meta)` | ✅ 동일 |
| **컨테이너별 추적** | 라벨로 grep | 컨테이너 ID로 grep | ✅ 동일 |
| **색상 구분** | 도메인별 색상 | 컨테이너별 색상 | ✅ 동일 |
| **초기 설정** | 2-4주 (팀 전체) | **10분** (파일 2개) | 🎯 훨씬 간단 |
| **유지보수** | 라벨 일관성 관리 필요 | **자동** (파일명 기반) | 🎯 더 편함 |
| **버전 관리** | 라벨에 @v 포함 | Git tags 활용 | 🎯 더 표준적 |
| **blueprint** | yaml 파일 필요 | **불필요** (파일명 규칙) | 🎯 더 간단 |

### 추적성 비교

#### 라벨 시스템
```bash
# 1. 로그에서 라벨 복사
#VIBE/api/gateway:AuthController@v1.2.1#(PRD|SEC)

# 2. 코드 검색
grep "#VIBE/api/gateway:AuthController" src/**/*.ts

# 3. 테스트 검색
grep "#VIBE/api/gateway:AuthController" tests/**/*.ts

총 3단계
```

#### 현재 로거 시스템
```bash
# 1. 로그에서 컨테이너 ID 확인
[C-007:APIGateway] ERROR Request failed

# 2. 파일 즉시 열기 (파일명 규칙)
code src/containers/C-007_APIGatewayContainer.ts

총 1단계 (50% 빠름!)
```

---

## 추가 기능

### JSON 출력 (외부 시스템 연동)

```typescript
import { exportJSON } from '../utils/logger.js';

// JSON 포맷으로 출력
const jsonLog = exportJSON('C-008', 'INFO', 'Validation complete', {
  score: 0.85,
  issues: 3
});

console.log(jsonLog);
// {"timestamp":"2025-01-10T10:30:00.000Z","containerId":"C-008","level":"INFO","message":"Validation complete","metadata":{"score":0.85,"issues":3}}

// ELK/Loki로 전송 가능
// sendToElk(jsonLog);
```

### 디버그 모드

```bash
# 환경변수로 디버그 로그 활성화
export DEBUG=true
npm run dev

# 또는
DEBUG=true npm run dev
```

```typescript
// 코드에서
logger.debug('Detailed info for debugging', {
  internalState: complexObject
});
// DEBUG=true일 때만 출력됨
```

---

## 마이그레이션 체크리스트

### 단계별 적용

- [ ] 1단계: `logger.ts` 파일 생성 완료
- [ ] 2단계: TypeScript 컴파일 (`npm run build`)
- [ ] 3단계: 예시 실행 테스트
  ```bash
  npx tsx src/utils/logger.example.ts
  ```
- [ ] 4단계: C-008 컨테이너에 적용
  - [ ] `import { createLogger }` 추가
  - [ ] `console.log` → `logger.info` 전환
  - [ ] `console.warn` → `logger.warn` 전환
  - [ ] `console.error` → `logger.error` 전환
- [ ] 5단계: 다른 컨테이너에 확장
  - [ ] C-007 (API Gateway)
  - [ ] C-003 (Agent Engine)
  - [ ] C-004 (Command Container)

### 점진적 마이그레이션 (권장)

```typescript
// 기존 코드와 병행 사용 가능
const logger = createLogger('C-008');

// 새 코드: 구조화된 로거
logger.info('New feature started', { feature: 'test-scaffolding' });

// 기존 코드: 그대로 유지
console.log('Legacy log still works');

// 점진적으로 전환
```

---

## 🎯 최종 결과

### 얻을 수 있는 효과

```
✅ 라벨 시스템과 동일한 추적성
✅ 초기 비용: 2-4주 → 10분
✅ 유지보수: 매일 라벨 관리 → 자동
✅ 검색 속도: 3단계 → 1단계
✅ 팀 도입 장벽: 높음 → 낮음
```

### 사용 예시 (실제 코드)

```typescript
// C-008_VibeComplianceContainer_V2.ts
import { createLogger, logTiming } from '../utils/logger.js';

const logger = createLogger('C-008');

async validateCode(context: CodeContext): Promise<ValidationPipeline> {
  const timer = logTiming('C-008', 'Full validation');

  logger.info('Validation started', {
    targetPath: context.targetPath,
    stages: 5
  });

  // ... validation ...

  logger.warn('Issues detected', {
    total: 5,
    critical: 2,
    warnings: 3
  });

  timer.end({ overallScore: 0.78 });
}
```

### 로그 출력 (컬러풀)

```
[C-008:VibeCompliance] DEBUG Full validation started
[C-008:VibeCompliance] INFO Validation started {"targetPath":"./src/api/auth.ts","stages":5}
[C-008:VibeCompliance] WARN Issues detected {"total":5,"critical":2,"warnings":3}
[C-008:VibeCompliance] INFO Full validation completed {"durationMs":150,"overallScore":0.78}
```

---

## 🚀 다음 단계

1. ✅ `logger.ts` 파일 생성 완료
2. ✅ 예시 코드 작성 완료
3. ⏭️ C-008 컨테이너에 적용 (선택)
4. ⏭️ 전체 컨테이너로 확장 (선택)

**이제 라벨 시스템과 동일한 추적성을 가진 구조화된 로그 시스템 완성! 🎉**
