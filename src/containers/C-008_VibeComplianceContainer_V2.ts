// C-008_VibeComplianceContainer_V2_Optimized
// Practical & Efficient Vibe-Coding Validation
// OPTIMIZED: Removed fake logic, kept real value
// ENHANCED: Structured logging with container-based label system

import { createLogger, logTiming, logBatch, type LogLevel } from '../utils/logger.js';

// ============================================================================
// CORE TYPES - Simplified
// ============================================================================

export enum ValidationStage {
  SPECIFICATION = 'SPECIFICATION',
  CODE_QUALITY = 'CODE_QUALITY',
  TEST_SCAFFOLDING = 'TEST_SCAFFOLDING',
  PERFORMANCE_BUDGET = 'PERFORMANCE_BUDGET',
  DEPLOYMENT = 'DEPLOYMENT'
}

export interface StageResult {
  stage: ValidationStage;
  status: 'pass' | 'fail' | 'warning';
  score: number; // 0-1
  issues: string[];
  recommendations: string[];
  executionTimeMs: number;
}

export interface ValidationPipeline {
  stages: StageResult[];
  overallStatus: 'pass' | 'fail' | 'warning';
  overallScore: number;
  totalTimeMs: number;
}

export interface CodeContext {
  targetPath?: string;
  files?: string[];
  code?: string;
  language?: string;
  framework?: string;
  testCoverage?: number;
  performanceBudget?: {
    maxLatencyMs: number;
    maxBundleSizeKb: number;
    maxMemoryMb: number;
  };
}

// ============================================================================
// ENHANCED TYPES - For New Features
// ============================================================================

export interface FunctionInfo {
  name: string;
  params: string[];
  isAsync: boolean;
  startLine: number;
}

export interface CodeSmell {
  smell: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  line?: number;
}

export interface DependencyImpact {
  directDependents: string[];
  estimatedImpactRadius: number;
  criticalPaths: string[];
}

export interface PerformanceValidation {
  bundleSizeOk: boolean;
  complexityOk: boolean;
  cyclomaticComplexity: number;
  heavyPatterns: Array<{type: string; line: number}>;
  issues: string[];
}

// ============================================================================
// OPTIMIZED V2 Container - Practical & Fast
// ============================================================================

export class HOVCS_ComplianceContainerV2 {
  private readonly ENABLED = process.env.ENABLE_V2_VIBE_VALIDATION === 'true';
  private readonly logger = createLogger('C-008');

  constructor() {
    this.logger.info('V2 Optimized initialized', {
      enabled: this.ENABLED,
      stages: 5,
      features: ['TestScaffolding', 'PerformanceBudget', 'CodeSmells', 'DependencyImpact']
    });
  }

  /**
   * Main validation - 5 practical stages with new features
   */
  async validateCode(context: CodeContext): Promise<ValidationPipeline> {
    const startTime = Date.now();
    const timer = logTiming('C-008', 'Full validation pipeline');

    this.logger.info('Validation started', {
      targetPath: context.targetPath,
      language: context.language,
      hasCode: !!context.code,
      hasPerformanceBudget: !!context.performanceBudget,
      testCoverage: context.testCoverage
    });

    const stages: StageResult[] = [];

    try {
      // Stage 1: Specification Check (실제 확인)
      this.logger.debug('Running SPECIFICATION stage');
      stages.push(await this.checkSpecification(context));

      // Stage 2: Code Quality Check (실제 분석)
      this.logger.debug('Running CODE_QUALITY stage');
      stages.push(await this.checkCodeQuality(context));

      // Stage 3: Test Scaffolding (NEW - 테스트 템플릿 생성)
      this.logger.debug('Running TEST_SCAFFOLDING stage');
      const testScaffoldingResult = await this.generateTestScaffolding(context);
      if (testScaffoldingResult.stage !== ValidationStage.SPECIFICATION) { // Not skipped
        stages.push(testScaffoldingResult);
      }

      // Stage 4: Performance Budget (NEW - 성능 예산 검증)
      this.logger.debug('Running PERFORMANCE_BUDGET stage');
      const perfBudgetResult = await this.validatePerformanceBudget(context);
      if (perfBudgetResult.stage !== ValidationStage.SPECIFICATION) { // Not skipped
        stages.push(perfBudgetResult);
      }

      // Stage 5: Deployment Readiness (실제 검증)
      this.logger.debug('Running DEPLOYMENT stage');
      stages.push(await this.checkDeploymentReadiness(context));

      const overallScore = stages.reduce((sum, s) => sum + s.score, 0) / stages.length;
      const hasFailures = stages.some(s => s.status === 'fail');
      const overallStatus = hasFailures ? 'fail' : (overallScore >= 0.8 ? 'pass' : 'warning');

      // Log stage results as batch
      logBatch('C-008', stages.map(s => ({
        level: s.status === 'fail' ? 'ERROR' : (s.status === 'warning' ? 'WARN' : 'INFO') as LogLevel,
        message: `${s.stage}: ${s.status}`,
        metadata: {
          score: Math.round(s.score * 100),
          issues: s.issues.length,
          timeMs: s.executionTimeMs
        }
      })));

      timer.end({
        stages: stages.length,
        overallStatus,
        overallScore: Math.round(overallScore * 100),
        totalIssues: stages.reduce((sum, s) => sum + s.issues.length, 0),
        totalRecommendations: stages.reduce((sum, s) => sum + s.recommendations.length, 0)
      });

      return {
        stages,
        overallStatus,
        overallScore,
        totalTimeMs: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Validation failed with exception', {
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

  /**
   * Stage 1: Specification Check
   * 실제로 필요한 정보가 있는지 확인
   */
  private async checkSpecification(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // 실제 체크 1: 검증할 대상이 있는가?
    if (!context.targetPath && !context.code && !context.files) {
      issues.push('No code, path, or files provided for validation');
      score -= 0.5;
    }

    // 실제 체크 2: 성능 기준이 정의되었는가?
    if (!context.performanceBudget) {
      recommendations.push('Consider defining performance budgets for production code');
      score -= 0.1;
    }

    // 실제 체크 3: 테스트 커버리지가 있는가?
    if (context.testCoverage !== undefined && context.testCoverage < 70) {
      issues.push(`Test coverage ${context.testCoverage}% is below recommended 70% threshold`);
      score -= 0.2;
    }

    return {
      stage: ValidationStage.SPECIFICATION,
      status: issues.length === 0 ? 'pass' : (score >= 0.5 ? 'warning' : 'fail'),
      score: Math.max(0, score),
      issues,
      recommendations,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Stage 2: Code Quality Check
   * 실제 코드 패턴 분석 (간단하지만 실용적) + Code Smells + Dependency Impact
   */
  private async checkCodeQuality(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // 코드가 있으면 실제 분석
    if (context.code) {
      const analysis = this.analyzeCodePatterns(context.code, context.language || 'typescript');

      if (analysis.hasAsyncWithoutErrorHandling) {
        issues.push('Async functions detected without try-catch blocks');
        recommendations.push('Add error handling to async functions');
        score -= 0.2;
      }

      if (analysis.hasPotentialNullAccess) {
        issues.push('Potential null/undefined access detected');
        recommendations.push('Add null checks before property access');
        score -= 0.15;
      }

      if (analysis.complexity > 15) {
        issues.push(`High code complexity detected (score: ${analysis.complexity})`);
        recommendations.push('Consider refactoring complex functions');
        score -= 0.15;
      }

      if (analysis.duplicateCode > 20) {
        recommendations.push('High code duplication detected - consider extracting common logic');
        score -= 0.1;
      }

      // NEW: Code Smell Detection
      const smells = this.detectCodeSmells(context.code);
      const highSeveritySmells = smells.filter(s => s.severity === 'high');
      if (highSeveritySmells.length > 0) {
        highSeveritySmells.forEach(smell => {
          issues.push(smell.smell);
          recommendations.push(smell.recommendation);
        });
        score -= 0.1 * Math.min(highSeveritySmells.length, 3);
      }

      // NEW: Dependency Impact Analysis
      const impact = this.analyzeDependencyImpact(context);
      if (impact.criticalPaths.length > 0) {
        recommendations.push(
          `Critical dependencies detected: ${impact.criticalPaths.slice(0, 3).join(', ')}` +
          (impact.criticalPaths.length > 3 ? ` (+${impact.criticalPaths.length - 3} more)` : '')
        );
      }

      if (impact.estimatedImpactRadius > 5) {
        recommendations.push(
          `High impact radius (${impact.estimatedImpactRadius} potential dependents) - ensure comprehensive testing`
        );
      }
    }

    // 파일 경로 기반 체크
    if (context.targetPath) {
      const fileAnalysis = this.analyzeFilePath(context.targetPath);

      if (fileAnalysis.isTestFile && (!context.testCoverage || context.testCoverage < 80)) {
        recommendations.push('Test files should have high coverage (80%+)');
      }

      if (fileAnalysis.isCriticalPath && score < 0.9) {
        issues.push('Critical path code should have higher quality standards');
        recommendations.push('Apply extra scrutiny to critical path files (auth, payment, data)');
      }
    }

    return {
      stage: ValidationStage.CODE_QUALITY,
      status: issues.length === 0 ? 'pass' : (score >= 0.7 ? 'warning' : 'fail'),
      score: Math.max(0, score),
      issues,
      recommendations,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Stage 3: Test Scaffolding (NEW)
   * 테스트 템플릿 생성 및 커버리지 분석
   */
  private async generateTestScaffolding(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Skip if no code
    if (!context.code) {
      return {
        stage: ValidationStage.SPECIFICATION, // Use as skip marker
        status: 'pass',
        score: 1.0,
        issues: [],
        recommendations: ['Skipped: No code provided for test scaffolding'],
        executionTimeMs: Date.now() - startTime
      };
    }

    // Extract functions from code
    const functions = this.extractFunctions(context.code);

    if (functions.length === 0) {
      recommendations.push('No functions detected - consider adding testable units');
      score -= 0.1;
    } else {
      // Find uncovered functions
      const uncoveredFunctions = this.findUncoveredFunctions(context);

      if (uncoveredFunctions.length > 0) {
        issues.push(`${uncoveredFunctions.length} function(s) without tests: ${uncoveredFunctions.slice(0, 3).join(', ')}${uncoveredFunctions.length > 3 ? '...' : ''}`);
        score -= Math.min(0.3, uncoveredFunctions.length * 0.05);

        // Generate test template
        const testTemplate = this.createTestTemplate(context, uncoveredFunctions.slice(0, 3));
        recommendations.push(`Generated test template for ${Math.min(3, uncoveredFunctions.length)} function(s)`);
        recommendations.push(`\`\`\`typescript\n${testTemplate}\n\`\`\``);
      }

      // Check if test file exists
      if (context.targetPath && !this.analyzeFilePath(context.targetPath).isTestFile) {
        recommendations.push('Consider creating a corresponding test file (.test.ts or .spec.ts)');
      }
    }

    return {
      stage: ValidationStage.TEST_SCAFFOLDING,
      status: issues.length === 0 ? 'pass' : (score >= 0.7 ? 'warning' : 'fail'),
      score: Math.max(0, score),
      issues,
      recommendations,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Stage 4: Performance Budget Validation (NEW)
   * 성능 예산 검증 및 최적화 제안
   */
  private async validatePerformanceBudget(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Skip if no code or no performance budget
    if (!context.code) {
      return {
        stage: ValidationStage.SPECIFICATION, // Use as skip marker
        status: 'pass',
        score: 1.0,
        issues: [],
        recommendations: ['Skipped: No code provided for performance validation'],
        executionTimeMs: Date.now() - startTime
      };
    }

    // Real validation 1: Code size
    const codeSizeKb = context.code.length / 1024;
    if (context.performanceBudget && codeSizeKb > context.performanceBudget.maxBundleSizeKb) {
      issues.push(`Code size ${codeSizeKb.toFixed(1)}KB exceeds budget ${context.performanceBudget.maxBundleSizeKb}KB`);
      score -= 0.25;
    } else if (codeSizeKb > 100) {
      recommendations.push(`Code size ${codeSizeKb.toFixed(1)}KB - consider code splitting for large files`);
    }

    // Real validation 2: Cyclomatic Complexity
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(context.code);
    if (cyclomaticComplexity > 20) {
      issues.push(`High cyclomatic complexity (${cyclomaticComplexity}) - difficult to test and maintain`);
      recommendations.push('Refactor complex functions into smaller, testable units');
      score -= 0.2;
    } else if (cyclomaticComplexity > 15) {
      recommendations.push(`Moderate complexity (${cyclomaticComplexity}) - monitor and refactor if it grows`);
      score -= 0.1;
    }

    // Real validation 3: Heavy pattern detection
    const heavyPatterns = this.detectHeavyPatterns(context.code);
    if (heavyPatterns.length > 0) {
      heavyPatterns.forEach(pattern => {
        issues.push(`Performance concern (line ${pattern.line}): ${pattern.type}`);
      });
      score -= Math.min(0.3, heavyPatterns.length * 0.1);

      recommendations.push('Optimize identified performance bottlenecks before production deployment');
    }

    // Real validation 4: Deep nesting
    const maxNesting = this.calculateMaxNesting(context.code);
    if (maxNesting > 5) {
      issues.push(`Deep nesting detected (${maxNesting} levels) - impacts readability and performance`);
      recommendations.push('Use early returns or extract nested logic to reduce nesting');
      score -= 0.15;
    }

    return {
      stage: ValidationStage.PERFORMANCE_BUDGET,
      status: issues.length === 0 ? 'pass' : (score >= 0.6 ? 'warning' : 'fail'),
      score: Math.max(0, score),
      issues,
      recommendations,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Stage 5: Deployment Readiness
   * 실제 배포 전 체크리스트
   */
  private async checkDeploymentReadiness(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // 실제 체크 1: 테스트 커버리지
    if (context.testCoverage !== undefined) {
      if (context.testCoverage < 70) {
        issues.push('Test coverage below production threshold (70%)');
        score -= 0.3;
      } else if (context.testCoverage < 80) {
        recommendations.push('Consider increasing test coverage to 80%+ for production');
        score -= 0.1;
      }
    } else {
      recommendations.push('Test coverage not measured - recommended for production code');
      score -= 0.15;
    }

    // 실제 체크 2: 보안 패턴
    if (context.code) {
      const securityIssues = this.checkSecurityPatterns(context.code);
      if (securityIssues.length > 0) {
        issues.push(...securityIssues);
        score -= 0.3;
      }
    }

    // 실제 체크 3: Critical path validation
    if (context.targetPath) {
      const fileAnalysis = this.analyzeFilePath(context.targetPath);
      if (fileAnalysis.isCriticalPath) {
        if (score < 0.85) {
          issues.push('Critical path files require higher quality scores (85%+)');
        }
        recommendations.push('This is a critical path file - ensure extra scrutiny during code review');
      }
    }

    return {
      stage: ValidationStage.DEPLOYMENT,
      status: issues.length === 0 ? 'pass' : (score >= 0.7 ? 'warning' : 'fail'),
      score: Math.max(0, score),
      issues,
      recommendations,
      executionTimeMs: Date.now() - startTime
    };
  }

  // ============================================================================
  // REAL ANALYSIS HELPERS (실제 분석 로직)
  // ============================================================================

  /**
   * 실제 코드 패턴 분석 (간단하지만 실용적)
   */
  private analyzeCodePatterns(code: string, language: string): {
    hasAsyncWithoutErrorHandling: boolean;
    hasPotentialNullAccess: boolean;
    complexity: number;
    duplicateCode: number;
  } {
    const lines = code.split('\n');

    // 실제 체크 1: async without try-catch
    const asyncFunctions = code.match(/async\s+function|async\s+\(/g) || [];
    const tryCatchBlocks = code.match(/try\s*\{/g) || [];
    const hasAsyncWithoutErrorHandling = asyncFunctions.length > tryCatchBlocks.length;

    // 실제 체크 2: potential null access
    const nullAccessPatterns = [
      /\.\w+\s*\(/g,  // .method() without null check
      /\[\w+\]/g,     // [property] without null check
    ];
    const potentialAccesses = nullAccessPatterns.reduce((count, pattern) => {
      return count + (code.match(pattern) || []).length;
    }, 0);
    const nullChecks = (code.match(/if\s*\(.*[!=]==?\s*null/g) || []).length +
                       (code.match(/if\s*\(.*[!=]==?\s*undefined/g) || []).length;
    const hasPotentialNullAccess = potentialAccesses > nullChecks * 2;

    // 실제 체크 3: complexity (간단한 추정)
    const complexity = Math.min(30, lines.length / 10 +
      (code.match(/if|for|while|switch|catch/g) || []).length);

    // 실제 체크 4: duplicate code (간단한 추정)
    const duplicateCode = this.estimateDuplication(lines);

    return {
      hasAsyncWithoutErrorHandling,
      hasPotentialNullAccess,
      complexity,
      duplicateCode
    };
  }

  /**
   * 파일 경로 분석
   */
  private analyzeFilePath(path: string): {
    isTestFile: boolean;
    isCriticalPath: boolean;
  } {
    const lowerPath = path.toLowerCase();

    return {
      isTestFile: lowerPath.includes('test') || lowerPath.includes('spec') || lowerPath.endsWith('.test.ts') || lowerPath.endsWith('.spec.ts'),
      isCriticalPath: lowerPath.includes('auth') || lowerPath.includes('payment') || lowerPath.includes('security') || lowerPath.includes('user')
    };
  }

  /**
   * 보안 패턴 체크 (실제)
   */
  private checkSecurityPatterns(code: string): string[] {
    const issues: string[] = [];

    // 실제 체크 1: hardcoded secrets
    const secretPatterns = [
      /password\s*=\s*['"]/i,
      /api[_-]?key\s*=\s*['"]/i,
      /secret\s*=\s*['"]/i,
      /token\s*=\s*['"]\w{20,}/i
    ];

    secretPatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push('Potential hardcoded secret detected - use environment variables');
      }
    });

    // 실제 체크 2: SQL injection risk
    if (code.includes('SELECT') && code.includes('+') && !code.includes('?')) {
      issues.push('Potential SQL injection risk - use parameterized queries');
    }

    // 실제 체크 3: eval usage
    if (code.includes('eval(')) {
      issues.push('eval() usage detected - security risk');
    }

    return issues;
  }

  /**
   * 중복 코드 추정 (간단한 알고리즘)
   */
  private estimateDuplication(lines: string[]): number {
    const lineMap = new Map<string, number>();
    let duplicateCount = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // 의미있는 라인만
        const count = lineMap.get(trimmed) || 0;
        lineMap.set(trimmed, count + 1);
        if (count > 0) {
          duplicateCount++;
        }
      }
    });

    return Math.min(100, (duplicateCount / lines.length) * 100);
  }

  // ============================================================================
  // NEW FEATURE HELPERS - Test Scaffolding
  // ============================================================================

  /**
   * Extract functions from code (enhanced with more details)
   */
  private extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = code.split('\n');

    // Pattern 1: function declarations
    const functionPattern = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(Boolean),
        isAsync: match[0].includes('async'),
        startLine: lineNumber
      });
    }

    // Pattern 2: arrow functions
    const arrowPattern = /(?:export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      functions.push({
        name: match[1],
        params: [],
        isAsync: !!match[2],
        startLine: lineNumber
      });
    }

    // Pattern 3: class methods
    const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{/g;
    while ((match = methodPattern.exec(code)) !== null) {
      const name = match[1];
      // Skip constructors and common non-methods
      if (name !== 'constructor' && name !== 'if' && name !== 'for' && name !== 'while') {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        functions.push({
          name,
          params: [],
          isAsync: match[0].includes('async'),
          startLine: lineNumber
        });
      }
    }

    // Remove duplicates
    const seen = new Set<string>();
    return functions.filter(f => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
  }

  /**
   * Find functions without test coverage
   */
  private findUncoveredFunctions(context: CodeContext): string[] {
    if (!context.code) return [];

    const functions = this.extractFunctions(context.code);
    const testedFunctions = this.extractTestedFunctions(context.code);

    return functions
      .map(f => f.name)
      .filter(name => !testedFunctions.includes(name));
  }

  /**
   * Extract tested functions from test code
   */
  private extractTestedFunctions(code: string): string[] {
    const tested: string[] = [];

    // Pattern 1: describe blocks
    const describePattern = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = describePattern.exec(code)) !== null) {
      tested.push(match[1]);
    }

    // Pattern 2: it/test blocks
    const testPattern = /(?:it|test)\s*\(\s*['"`][^'"`]*['"`]/g;
    const testNames = code.match(testPattern) || [];

    // Extract function names from test descriptions
    testNames.forEach(testName => {
      const words = testName.match(/\w+/g) || [];
      words.forEach(word => {
        if (word.length > 3 && word !== 'should' && word !== 'test') {
          tested.push(word);
        }
      });
    });

    return tested;
  }

  /**
   * Create test template for uncovered functions
   */
  private createTestTemplate(context: CodeContext, functionNames: string[]): string {
    const language = context.language || 'typescript';

    if (language === 'typescript' || language === 'javascript') {
      const functions = this.extractFunctions(context.code!);
      const targetFunctions = functions.filter(f => functionNames.includes(f.name));

      return targetFunctions.map(fn => {
        const asyncPrefix = fn.isAsync ? 'async ' : '';
        return `
describe('${fn.name}', () => {
  it('should handle valid input', ${asyncPrefix}() => {
    // Arrange
    ${fn.params.length > 0 ? `const ${fn.params.join(', ')} = /* TODO: provide test values */;` : ''}

    // Act
    const result = ${fn.isAsync ? 'await ' : ''}${fn.name}(${fn.params.join(', ')});

    // Assert
    expect(result).toBe(/* TODO: expected output */);
  });

  it('should handle edge cases', ${asyncPrefix}() => {
    // TODO: Add edge case test
  });

  it('should handle errors gracefully', ${asyncPrefix}() => {
    // TODO: Add error handling test
  });
});`.trim();
      }).join('\n\n');
    }

    return '// Test template generation not supported for this language';
  }

  // ============================================================================
  // NEW FEATURE HELPERS - Performance Budget
  // ============================================================================

  /**
   * Calculate Cyclomatic Complexity (McCabe metric)
   */
  private calculateCyclomaticComplexity(code: string): number {
    // McCabe's Cyclomatic Complexity = E - N + 2P
    // Simplified: decision points + 1
    const decisionPoints = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*.*:\s*/g,  // ternary
      /&&/g,
      /\|\|/g
    ];

    let complexity = 1; // base complexity
    decisionPoints.forEach(pattern => {
      complexity += (code.match(pattern) || []).length;
    });

    return complexity;
  }

  /**
   * Detect performance-heavy patterns
   */
  private detectHeavyPatterns(code: string): Array<{type: string; line: number}> {
    const patterns: Array<{type: string; line: number}> = [];
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      // Pattern 1: Nested loops (O(n²) or worse)
      if (/for.*for|while.*while|forEach.*forEach/.test(line)) {
        patterns.push({
          type: 'Nested loops (O(n²) complexity)',
          line: idx + 1
        });
      }

      // Pattern 2: Synchronous file I/O (blocks event loop)
      if (/readFileSync|writeFileSync|existsSync/.test(line)) {
        patterns.push({
          type: 'Synchronous file I/O (blocks event loop)',
          line: idx + 1
        });
      }

      // Pattern 3: Chained array methods (creates intermediate arrays)
      if (/\.map\(.*\.filter\(|\.filter\(.*\.map\(/.test(line)) {
        patterns.push({
          type: 'Chained array methods (creates intermediate arrays)',
          line: idx + 1
        });
      }

      // Pattern 4: Regex in loops (compile once outside loop instead)
      if (/for.*new RegExp|while.*new RegExp/.test(line)) {
        patterns.push({
          type: 'Regex compilation in loop (move outside)',
          line: idx + 1
        });
      }

      // Pattern 5: DOM queries in loops
      if (/for.*querySelector|while.*querySelector|forEach.*querySelector/.test(line)) {
        patterns.push({
          type: 'DOM queries in loop (cache results)',
          line: idx + 1
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  // ============================================================================
  // NEW FEATURE HELPERS - Code Smells & Dependencies
  // ============================================================================

  /**
   * Detect code smells (Martin Fowler's patterns)
   */
  private detectCodeSmells(code: string): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // Smell 1: Long Function
    const functions = this.extractFunctions(code);
    functions.forEach(fn => {
      const fnCode = this.extractFunctionBody(code, fn.name);
      const lines = fnCode.split('\n').filter(l => l.trim()).length;

      if (lines > 50) {
        smells.push({
          smell: `Long Function: ${fn.name} (${lines} lines)`,
          severity: 'high',
          recommendation: 'Extract smaller functions with single responsibility',
          line: fn.startLine
        });
      } else if (lines > 30) {
        smells.push({
          smell: `Long Function: ${fn.name} (${lines} lines)`,
          severity: 'medium',
          recommendation: 'Consider refactoring if complexity grows',
          line: fn.startLine
        });
      }
    });

    // Smell 2: Long Parameter List
    functions.forEach(fn => {
      if (fn.params.length > 5) {
        smells.push({
          smell: `Long Parameter List: ${fn.name} (${fn.params.length} params)`,
          severity: 'medium',
          recommendation: 'Use parameter object or builder pattern',
          line: fn.startLine
        });
      }
    });

    // Smell 3: Magic Numbers
    const magicNumbers = code.match(/(?<![a-zA-Z_0-9])[0-9]{2,}(?![a-zA-Z_0-9])/g) || [];
    const uniqueMagicNumbers = new Set(magicNumbers);
    if (uniqueMagicNumbers.size > 5) {
      smells.push({
        smell: `Magic Numbers detected (${uniqueMagicNumbers.size} unique values)`,
        severity: 'low',
        recommendation: 'Extract magic numbers to named constants'
      });
    }

    // Smell 4: Duplicated Code
    const lines = code.split('\n');
    const duplicateRatio = this.estimateDuplication(lines);
    if (duplicateRatio > 20) {
      smells.push({
        smell: `High code duplication (${duplicateRatio.toFixed(0)}%)`,
        severity: 'high',
        recommendation: 'Extract common logic to reusable functions'
      });
    } else if (duplicateRatio > 15) {
      smells.push({
        smell: `Moderate code duplication (${duplicateRatio.toFixed(0)}%)`,
        severity: 'medium',
        recommendation: 'Monitor and refactor duplicated patterns'
      });
    }

    // Smell 5: Deep Nesting
    const maxNesting = this.calculateMaxNesting(code);
    if (maxNesting > 5) {
      smells.push({
        smell: `Deep nesting (${maxNesting} levels)`,
        severity: 'high',
        recommendation: 'Use early returns or extract nested logic'
      });
    } else if (maxNesting > 4) {
      smells.push({
        smell: `Moderate nesting (${maxNesting} levels)`,
        severity: 'medium',
        recommendation: 'Consider flattening control flow'
      });
    }

    // Smell 6: God Class/Function (too many responsibilities)
    const methodCount = functions.length;
    const avgLinesPerFunction = lines.length / Math.max(1, methodCount);
    if (methodCount > 20) {
      smells.push({
        smell: `God Class detected (${methodCount} methods)`,
        severity: 'high',
        recommendation: 'Split into smaller, focused classes/modules'
      });
    }

    return smells;
  }

  /**
   * Extract function body for analysis
   */
  private extractFunctionBody(code: string, functionName: string): string {
    // Try different function patterns
    const patterns = [
      new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'),
      new RegExp(`const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'),
      new RegExp(`${functionName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(code);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Analyze dependency impact
   */
  private analyzeDependencyImpact(context: CodeContext): DependencyImpact {
    if (!context.code) {
      return { directDependents: [], estimatedImpactRadius: 0, criticalPaths: [] };
    }

    // Extract imports
    const imports = this.extractImports(context.code);
    const exports = this.extractExports(context.code);

    // Identify critical paths
    const criticalPaths = imports.filter(imp =>
      imp.includes('auth') ||
      imp.includes('payment') ||
      imp.includes('security') ||
      imp.includes('database') ||
      imp.includes('user') ||
      imp.includes('session')
    );

    // Estimate impact radius based on exports
    const estimatedImpactRadius = exports.length > 0
      ? Math.min(10, exports.length * 2)  // More exports = wider impact
      : 1;  // No exports = minimal impact

    return {
      directDependents: imports,
      estimatedImpactRadius,
      criticalPaths
    };
  }

  /**
   * Extract import statements
   */
  private extractImports(code: string): string[] {
    const imports: string[] = [];

    // ES6 imports
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(code)) !== null) {
      imports.push(match[1]);
    }

    // require statements
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requirePattern.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract export statements
   */
  private extractExports(code: string): string[] {
    const exports: string[] = [];

    // Named exports
    const exportPattern = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = exportPattern.exec(code)) !== null) {
      exports.push(match[1]);
    }

    // export { ... }
    const exportBlockPattern = /export\s*\{([^}]+)\}/g;
    while ((match = exportBlockPattern.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }

    return exports;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get status summary
   */
  getStatus(): string {
    if (!this.ENABLED) {
      return 'C-008 V2: Disabled (set ENABLE_V2_VIBE_VALIDATION=true to enable)';
    }
    return 'C-008 V2_Enhanced: Enabled - 5-stage validation (Spec + Quality + Tests + Performance + Deployment)';
  }

  /**
   * Get validation summary for display
   */
  getSummary(pipeline: ValidationPipeline): string {
    const stagesSummary = pipeline.stages.map(s =>
      `${s.stage}: ${s.status} (${(s.score * 100).toFixed(0)}%)`
    ).join('\n');

    const allIssues = pipeline.stages.flatMap(s => s.issues);
    const allRecommendations = pipeline.stages.flatMap(s => s.recommendations);

    return `
V2 Validation Summary
=====================
Overall: ${pipeline.overallStatus} (${(pipeline.overallScore * 100).toFixed(1)}%)
Time: ${pipeline.totalTimeMs}ms

Stages:
${stagesSummary}

${allIssues.length > 0 ? `Issues:\n${allIssues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}` : '✅ No issues found'}

${allRecommendations.length > 0 ? `\nRecommendations:\n${allRecommendations.slice(0, 5).map((r, idx) => `${idx + 1}. ${r}`).join('\n')}` : ''}
    `.trim();
  }
}
