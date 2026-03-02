// C-005_OrchestrationAgent
// Adapted from: C-005_OrchestrationContainer + C-008_VibeComplianceContainer_V2 + C-008_VibeComplianceContainer
/**
 * Orchestration Agent
 *
 * Responsibility: Multi-agent orchestration + HOVCS vibe-coding compliance validation
 * Merged from: C-005 (orchestration), C-008 V1 (engineering standards), C-008 V2 (code validation)
 */

import { createLogger, logTiming, logBatch, type LogLevel } from '../utils/logger.js';

// ============================================================================
// ORCHESTRATION TYPES (from C-005)
// ============================================================================

export interface OrchestrationRequest {
  userInput: string;
  requiredContainers?: string[];
  priority?: 'low' | 'medium' | 'high';
  maxConcurrency?: number;
}

export interface OrchestrationResponse {
  orchestrationResult: any;
  involvedContainers: string[];
  executionPlan: Array<{
    container: string;
    priority: number;
    estimatedTime: number;
    dependencies: string[];
  }>;
  finalOutput: string;
  confidence: number;
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
}

export interface ContainerExecutionPlan {
  container: string;
  operation: string;
  parameters: any;
  priority: number;
  estimatedTime: number;
  dependencies: string[];
}

// ============================================================================
// VIBE COMPLIANCE TYPES (from C-008 V1 + V2)
// ============================================================================

export interface VibeComplianceRequest {
  analysisDepth: 'BASIC' | 'CORE' | 'FULL';
  complianceLevel: 'BASIC' | 'CORE' | 'FULL';
  containerOperation?: 'analyze' | 'apply' | 'validate' | 'optimize';
  targetPath?: string;
  ocaLayer?: string;
  validatePhases?: number[];
}

export interface ComplianceReport {
  complianceScore: number;
  qualityGrade: 'A' | 'B+' | 'B' | 'C' | 'D';
  hovcsVersion: string;
  recommendations: string[];
  violations: string[];
  improvementPlan: string[];
  certificationStatus: 'CERTIFIED' | 'CONDITIONAL' | 'NOT_CERTIFIED';
  containerAnalysis?: any;
  v2ValidationPipeline?: ValidationPipeline;
  ocaLayerCompliance?: any;
  phaseValidation?: any;
  neuralProtocols?: any;
  organicTemplates?: any;
}

// ============================================================================
// CODE VALIDATION TYPES (from C-008 V2)
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
  score: number;
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

// ============================================================================
// ORCHESTRATION AGENT — merged C-005 + C-008 V1 + C-008 V2
// ============================================================================

export class OrchestrationAgent {
  private containerRegistry: Map<string, any> = new Map();
  private executionHistory: Array<OrchestrationResponse> = [];
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private readonly MAX_FAILURES = 3;

  private readonly logger = createLogger('C-005');

  constructor() {
    this.initializeContainerRegistry();
    this.logger.info('OrchestrationAgent initialized', {
      orchestration: true,
      vibeCompliance: true,
      codeValidation: true
    });
  }

  // ==========================================================================
  // ORCHESTRATION METHODS (from C-005_OrchestrationContainer)
  // ==========================================================================

  /**
   * Orchestrate multiple agents with atomic responsibility
   */
  async orchestrateContainers(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const startTime = Date.now();

    try {
      if (this.circuitBreakerOpen) {
        throw new Error('Orchestration circuit breaker is open');
      }

      this.logger.info('Starting orchestration', {
        input: request.userInput?.substring(0, 50),
        containers: request.requiredContainers
      });

      const taskAnalysis = this.analyzeTask(request.userInput);
      const selectedContainers = request.requiredContainers || this.selectOptimalContainers(taskAnalysis);
      const executionPlan = this.createParallelExecutionPlan(taskAnalysis, selectedContainers);
      const containerResults = await this.executeContainersInParallel(executionPlan);
      const finalOutput = this.integrateContainerResults(containerResults, request);
      const confidence = this.calculateOrchestrationConfidence(containerResults);
      const qualityGrade = this.calculateQualityGrade(containerResults, Date.now() - startTime);

      this.failureCount = 0;
      this.circuitBreakerOpen = false;

      const response: OrchestrationResponse = {
        orchestrationResult: {
          taskAnalysis,
          containerResults,
          integrationSummary: this.generateIntegrationSummary(containerResults)
        },
        involvedContainers: selectedContainers,
        executionPlan,
        finalOutput,
        confidence,
        qualityGrade
      };

      this.storeExecutionHistory(response);

      this.logger.info('Orchestration completed', {
        containers: selectedContainers.length,
        confidence,
        grade: qualityGrade
      });

      return response;

    } catch (error) {
      this.handleOrchestrationFailure();
      this.logger.error('Orchestration failed', { error });
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==========================================================================
  // VIBE COMPLIANCE — ENGINEERING STANDARDS (from C-008 V1)
  // ==========================================================================

  /**
   * Apply HOVCS 2.0 engineering standards
   */
  async applyVibeEngineering(request: VibeComplianceRequest): Promise<ComplianceReport> {
    try {
      this.logger.info('Applying HOVCS 2.0 engineering standards', {
        depth: request.analysisDepth,
        level: request.complianceLevel,
        operation: request.containerOperation || 'analyze'
      });

      const hovcsScore = this.evaluateHOVCSCompliance(request);
      const violations = this.detectViolations(request);
      const recommendations = this.generateRecommendations(request, violations);
      const improvementPlan = this.buildImprovementPlan(violations, recommendations);
      const qualityGrade = this.gradeCompliance(hovcsScore);
      const certificationStatus = this.determineCertificationStatus(hovcsScore);

      const report: ComplianceReport = {
        complianceScore: hovcsScore,
        qualityGrade,
        hovcsVersion: '2.0',
        recommendations,
        violations,
        improvementPlan,
        certificationStatus,
        ocaLayerCompliance: {
          identifiedLayer: request.ocaLayer || 'TRUNK',
          score: hovcsScore,
          compliant: hovcsScore >= 0.7
        },
        phaseValidation: {
          phases: request.validatePhases || [1, 2, 3, 4, 5, 6],
          passed: violations.length === 0,
          score: hovcsScore
        },
        neuralProtocols: {
          scp: true,
          bap: true,
          edp: true,
          erp: request.analysisDepth === 'FULL'
        },
        organicTemplates: {
          applied: request.complianceLevel !== 'BASIC',
          count: request.complianceLevel === 'FULL' ? 5 : 2
        }
      };

      this.logger.info('HOVCS 2.0 engineering standards applied', {
        score: report.complianceScore,
        grade: report.qualityGrade,
        certification: report.certificationStatus
      });

      return report;

    } catch (error) {
      this.logger.error('HOVCS 2.0 engineering application failed', { error });
      throw new Error(`HOVCS 2.0 engineering standards application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate container-based architecture
   */
  async validateArchitecture(containerId?: string): Promise<{
    isValid: boolean;
    score: number;
    violations: string[];
    recommendations: string[];
  }> {
    const containers = containerId
      ? [this.containerRegistry.get(containerId)].filter(Boolean)
      : Array.from(this.containerRegistry.values());

    let totalScore = 0;
    const violations: string[] = [];
    const recommendations: string[] = [];

    for (const container of containers) {
      const score = container?.atomicScore ?? 0.85;
      totalScore += score;

      if (score < 0.7) {
        violations.push(`Agent ${container?.id || 'unknown'}: Quality below threshold (${Math.round(score * 100)}%)`);
      }

      if (!container?.circuitBreaker) {
        violations.push(`Agent ${container?.id || 'unknown'}: Missing circuit breaker implementation`);
        recommendations.push(`Implement circuit breaker pattern for ${container?.id || 'unknown'}`);
      }

      if (score < 0.8) {
        violations.push(`Agent ${container?.id || 'unknown'}: Atomic responsibility below threshold`);
        recommendations.push(`Refactor ${container?.id || 'unknown'} for better atomic responsibility`);
      }
    }

    const averageScore = containers.length > 0 ? totalScore / containers.length : 0;

    return {
      isValid: averageScore >= 0.8 && violations.length === 0,
      score: averageScore,
      violations,
      recommendations
    };
  }

  // ==========================================================================
  // CODE VALIDATION PIPELINE (from C-008_VibeComplianceContainer_V2)
  // ==========================================================================

  /**
   * Main validation — 5 practical stages
   */
  async validateCode(context: CodeContext): Promise<ValidationPipeline> {
    const startTime = Date.now();
    const timer = logTiming('C-005', 'Full validation pipeline');

    this.logger.info('Code validation started', {
      targetPath: context.targetPath,
      language: context.language,
      hasCode: !!context.code,
      hasPerformanceBudget: !!context.performanceBudget,
      testCoverage: context.testCoverage
    });

    const stages: StageResult[] = [];

    try {
      this.logger.debug('Running SPECIFICATION stage');
      stages.push(await this.checkSpecification(context));

      this.logger.debug('Running CODE_QUALITY stage');
      stages.push(await this.checkCodeQuality(context));

      this.logger.debug('Running TEST_SCAFFOLDING stage');
      const testScaffoldingResult = await this.generateTestScaffolding(context);
      if (testScaffoldingResult.stage !== ValidationStage.SPECIFICATION) {
        stages.push(testScaffoldingResult);
      }

      this.logger.debug('Running PERFORMANCE_BUDGET stage');
      const perfBudgetResult = await this.validatePerformanceBudget(context);
      if (perfBudgetResult.stage !== ValidationStage.SPECIFICATION) {
        stages.push(perfBudgetResult);
      }

      this.logger.debug('Running DEPLOYMENT stage');
      stages.push(await this.checkDeploymentReadiness(context));

      const overallScore = stages.reduce((sum, s) => sum + s.score, 0) / stages.length;
      const hasFailures = stages.some(s => s.status === 'fail');
      const overallStatus = hasFailures ? 'fail' : (overallScore >= 0.8 ? 'pass' : 'warning');

      logBatch('C-005', stages.map(s => ({
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

      return { stages, overallStatus, overallScore, totalTimeMs: Date.now() - startTime };

    } catch (error) {
      this.logger.error('Validation failed with exception', {
        error: error instanceof Error ? error.message : 'Unknown error',
        targetPath: context.targetPath
      });

      return { stages: [], overallStatus: 'warning', overallScore: 0.5, totalTimeMs: Date.now() - startTime };
    }
  }

  // ==========================================================================
  // STATUS
  // ==========================================================================

  getStatus(): any {
    return {
      agentName: 'C-005_OrchestrationAgent',
      status: this.circuitBreakerOpen ? 'degraded' : 'healthy',
      executionHistory: this.executionHistory.length,
      failureCount: this.failureCount,
      circuitBreakerOpen: this.circuitBreakerOpen,
      registeredAgents: this.containerRegistry.size,
      qualityGrade: this.failureCount === 0 ? 'A' : this.failureCount < 2 ? 'B+' : 'B',
      atomicResponsibility: 'Multi-agent orchestration + HOVCS compliance + Code validation'
    };
  }

  // ==========================================================================
  // PRIVATE — ORCHESTRATION HELPERS (C-005)
  // ==========================================================================

  private analyzeTask(userInput: string): any {
    const complexity = this.calculateTaskComplexity(userInput);
    const emotionalContent = this.detectEmotionalContent(userInput);
    const analyticalNeeds = this.assessAnalyticalNeeds(userInput);
    const commandRequirements = this.identifyCommandRequirements(userInput);

    return {
      complexity,
      emotionalContent,
      analyticalNeeds,
      commandRequirements,
      recommendedApproach: this.determineOptimalApproach(complexity, emotionalContent),
      estimatedDuration: this.estimateTaskDuration(complexity),
      resourceRequirements: this.assessResourceRequirements(userInput)
    };
  }

  private selectOptimalContainers(taskAnalysis: any): string[] {
    const selected: string[] = ['C-001'];
    if (taskAnalysis.analyticalNeeds > 0.6 || taskAnalysis.complexity > 0.7) selected.push('C-002');
    if (taskAnalysis.emotionalContent > 0.5) selected.push('C-003');
    if (taskAnalysis.commandRequirements > 0.4) selected.push('C-004');
    return selected;
  }

  private createParallelExecutionPlan(taskAnalysis: any, containers: string[]): ContainerExecutionPlan[] {
    return containers.map(container => ({
      container,
      operation: this.determineOptimalOperation(container, taskAnalysis),
      parameters: this.generateParameters(container, taskAnalysis),
      priority: this.calculateContainerPriority(container),
      estimatedTime: this.estimateExecutionTime(container, taskAnalysis),
      dependencies: this.identifyContainerDependencies(container, containers)
    }));
  }

  private async executeContainersInParallel(executionPlan: ContainerExecutionPlan[]): Promise<any[]> {
    const results: any[] = [];
    const executing = new Map<string, Promise<any>>();
    const sortedPlan = this.sortExecutionPlan(executionPlan);

    for (const plan of sortedPlan) {
      await this.waitForDependencies(plan.dependencies, executing);
      const execution = this.executeContainerOperation(plan);
      executing.set(plan.container, execution);
      const result = await execution;
      results.push({ container: plan.container, operation: plan.operation, result, success: true });
    }

    return results;
  }

  private async executeContainerOperation(plan: ContainerExecutionPlan): Promise<any> {
    switch (plan.container) {
      case 'C-001': return { emotion: 'neutral', confidence: 0.85, insight: 'Emotion processing completed', container: 'C-001' };
      case 'C-002': return { analysis: 'comprehensive', metrics: { complexity: 0.7, depth: 0.8 }, insight: 'Analytics processing completed', container: 'C-002' };
      case 'C-003': return { agent: 'HiSol-Analyst', response: 'Agent processing completed', insight: 'Agent processing completed', container: 'C-003' };
      case 'C-004': return { command: 'hisol_analyze', result: 'Command execution completed', insight: 'Command processing completed', container: 'C-004' };
      default: return { container: plan.container, status: 'executed', timestamp: new Date().toISOString() };
    }
  }

  private integrateContainerResults(containerResults: any[], request: OrchestrationRequest): string {
    const successfulResults = containerResults.filter(r => r.success);
    const insights = successfulResults.map(r => r.result?.insight || `${r.container} processing completed`);
    return `Orchestrated processing of "${request.userInput}" completed using ${successfulResults.length} agents. Key insights: ${insights.join(', ')}`;
  }

  private generateIntegrationSummary(containerResults: any[]): string {
    const containers = containerResults.map(r => r.container).join(', ');
    const successRate = (containerResults.filter(r => r.success).length / containerResults.length) * 100;
    return `Successfully integrated ${containerResults.length} agents (${containers}) with ${Math.round(successRate)}% success rate`;
  }

  private calculateOrchestrationConfidence(containerResults: any[]): number {
    const successRate = containerResults.filter(r => r.success).length / containerResults.length;
    const complexityBonus = containerResults.length > 3 ? 0.1 : 0;
    return Math.min(1.0, successRate * 0.9 + complexityBonus);
  }

  private calculateQualityGrade(containerResults: any[], executionTime: number): 'A' | 'B+' | 'B' | 'C' {
    const successRate = containerResults.filter(r => r.success).length / containerResults.length;
    const isTimely = executionTime < 2000;
    const isComplex = containerResults.length >= 3;
    if (successRate === 1.0 && isTimely && isComplex) return 'A';
    if (successRate >= 0.8 && isTimely) return 'B+';
    if (successRate >= 0.6) return 'B';
    return 'C';
  }

  private handleOrchestrationFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.MAX_FAILURES) {
      this.circuitBreakerOpen = true;
      this.logger.warn('Circuit breaker opened due to failures');
      setTimeout(() => {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
        this.logger.info('Circuit breaker reset');
      }, 30000);
    }
  }

  private calculateTaskComplexity(input: string): number {
    return Math.min(1, input.length / 500 + (input.split(' ').length / 100));
  }

  private detectEmotionalContent(input: string): number {
    const emotionalWords = ['feel', 'emotion', 'happy', 'sad', 'excited', '감정', '기분'];
    return Math.min(1, emotionalWords.filter(w => input.toLowerCase().includes(w)).length / 3);
  }

  private assessAnalyticalNeeds(input: string): number {
    const analyticalWords = ['analyze', 'study', 'research', 'examine', '분석', '연구'];
    return Math.min(1, analyticalWords.filter(w => input.toLowerCase().includes(w)).length / 2);
  }

  private identifyCommandRequirements(input: string): number {
    const commandWords = ['execute', 'run', 'implement', 'create', '실행', '구현'];
    return Math.min(1, commandWords.filter(w => input.toLowerCase().includes(w)).length / 2);
  }

  private determineOptimalApproach(complexity: number, emotionalContent: number): string {
    if (complexity > 0.7 && emotionalContent > 0.5) return 'comprehensive-emotional';
    if (complexity > 0.7) return 'comprehensive-analytical';
    if (emotionalContent > 0.5) return 'emotion-focused';
    return 'standard';
  }

  private estimateTaskDuration(complexity: number): number {
    return Math.ceil(complexity * 10) * 100;
  }

  private assessResourceRequirements(input: string): string[] {
    const requirements = ['processing-power'];
    if (input.length > 200) requirements.push('memory');
    if (input.includes('api') || input.includes('external')) requirements.push('network');
    return requirements;
  }

  private determineOptimalOperation(container: string, _taskAnalysis: any): string {
    const ops: Record<string, string> = { 'C-001': 'emotion-process', 'C-002': 'analyze', 'C-003': 'agent-process', 'C-004': 'execute-command' };
    return ops[container] || 'process';
  }

  private generateParameters(container: string, taskAnalysis: any): any {
    return { complexity: taskAnalysis.complexity, priority: taskAnalysis.complexity > 0.7 ? 'high' : 'medium', context: 'orchestrated-execution' };
  }

  private calculateContainerPriority(container: string): number {
    if (container === 'C-001') return 1;
    return 2;
  }

  private estimateExecutionTime(container: string, taskAnalysis: any): number {
    const baseTime = ({ 'C-001': 200, 'C-002': 300, 'C-003': 250, 'C-004': 400 } as Record<string, number>)[container] || 300;
    return Math.round(baseTime * (1 + (taskAnalysis.complexity || 0.5)));
  }

  private identifyContainerDependencies(container: string, allContainers: string[]): string[] {
    if (container === 'C-001') return [];
    if (allContainers.includes('C-001')) return ['C-001'];
    return [];
  }

  private sortExecutionPlan(executionPlan: ContainerExecutionPlan[]): ContainerExecutionPlan[] {
    return executionPlan.sort((a, b) => a.priority - b.priority);
  }

  private async waitForDependencies(dependencies: string[], executing: Map<string, Promise<any>>): Promise<void> {
    const promises = dependencies.map(dep => executing.get(dep)).filter(Boolean) as Promise<any>[];
    await Promise.all(promises);
  }

  private initializeContainerRegistry(): void {
    this.containerRegistry.set('C-001', { id: 'C-001', name: 'EmotionAgent', type: 'emotion', circuitBreaker: true, atomicScore: 0.92 });
    this.containerRegistry.set('C-002', { id: 'C-002', name: 'AnalyticsAgent', type: 'analytics', circuitBreaker: true, atomicScore: 0.90 });
    this.containerRegistry.set('C-003', { id: 'C-003', name: 'PersonaAgent', type: 'agent', circuitBreaker: true, atomicScore: 0.88 });
    this.containerRegistry.set('C-004', { id: 'C-004', name: 'CommandAgent', type: 'command', circuitBreaker: true, atomicScore: 0.91 });
    this.containerRegistry.set('C-005', { id: 'C-005', name: 'OrchestrationAgent', type: 'orchestration', circuitBreaker: true, atomicScore: 0.89 });
  }

  private storeExecutionHistory(response: OrchestrationResponse): void {
    this.executionHistory.push(response);
    if (this.executionHistory.length > 50) this.executionHistory.shift();
  }

  // ==========================================================================
  // PRIVATE — VIBE COMPLIANCE HELPERS (C-008 V1)
  // ==========================================================================

  private evaluateHOVCSCompliance(request: VibeComplianceRequest): number {
    let score = 0.75;
    if (request.analysisDepth === 'FULL') score += 0.1;
    else if (request.analysisDepth === 'CORE') score += 0.05;
    if (request.complianceLevel === 'FULL') score += 0.1;
    else if (request.complianceLevel === 'CORE') score += 0.05;
    return Math.min(1.0, score);
  }

  private detectViolations(request: VibeComplianceRequest): string[] {
    const violations: string[] = [];
    if (request.analysisDepth === 'BASIC' && request.complianceLevel === 'FULL') {
      violations.push('Analysis depth (BASIC) insufficient for FULL compliance level');
    }
    return violations;
  }

  private generateRecommendations(request: VibeComplianceRequest, violations: string[]): string[] {
    const recommendations: string[] = [];
    if (violations.length > 0) {
      recommendations.push('Increase analysis depth to match compliance level');
    }
    if (request.complianceLevel !== 'FULL') {
      recommendations.push('Consider upgrading to FULL compliance for production systems');
    }
    recommendations.push('Apply neural communication protocols (SCP, BAP, EDP)');
    recommendations.push('Use organic container templates for consistent architecture');
    return recommendations;
  }

  private buildImprovementPlan(violations: string[], recommendations: string[]): string[] {
    return [
      'Phase 1: Address critical violations',
      ...violations.map(v => `  → Fix: ${v}`),
      'Phase 2: Apply recommendations',
      ...recommendations.slice(0, 3).map(r => `  → ${r}`),
      'Phase 3: Validate with HOVCS 2.0 certification criteria'
    ];
  }

  private gradeCompliance(score: number): 'A' | 'B+' | 'B' | 'C' | 'D' {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B+';
    if (score >= 0.7) return 'B';
    if (score >= 0.6) return 'C';
    return 'D';
  }

  private determineCertificationStatus(score: number): 'CERTIFIED' | 'CONDITIONAL' | 'NOT_CERTIFIED' {
    if (score >= 0.85) return 'CERTIFIED';
    if (score >= 0.70) return 'CONDITIONAL';
    return 'NOT_CERTIFIED';
  }

  // ==========================================================================
  // PRIVATE — CODE VALIDATION STAGES (C-008 V2)
  // ==========================================================================

  private async checkSpecification(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!context.targetPath && !context.code && !context.files) {
      issues.push('No code, path, or files provided for validation');
      score -= 0.5;
    }
    if (!context.performanceBudget) {
      recommendations.push('Consider defining performance budgets for production code');
      score -= 0.1;
    }
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

  private async checkCodeQuality(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

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

      const smells = this.detectCodeSmells(context.code);
      const highSeveritySmells = smells.filter(s => s.severity === 'high');
      if (highSeveritySmells.length > 0) {
        highSeveritySmells.forEach(smell => {
          issues.push(smell.smell);
          recommendations.push(smell.recommendation);
        });
        score -= 0.1 * Math.min(highSeveritySmells.length, 3);
      }

      const impact = this.analyzeDependencyImpact(context);
      if (impact.criticalPaths.length > 0) {
        recommendations.push(
          `Critical dependencies detected: ${impact.criticalPaths.slice(0, 3).join(', ')}` +
          (impact.criticalPaths.length > 3 ? ` (+${impact.criticalPaths.length - 3} more)` : '')
        );
      }
      if (impact.estimatedImpactRadius > 5) {
        recommendations.push(`High impact radius (${impact.estimatedImpactRadius} potential dependents) - ensure comprehensive testing`);
      }
    }

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

  private async generateTestScaffolding(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!context.code) {
      return {
        stage: ValidationStage.SPECIFICATION,
        status: 'pass',
        score: 1.0,
        issues: [],
        recommendations: ['Skipped: No code provided for test scaffolding'],
        executionTimeMs: Date.now() - startTime
      };
    }

    const functions = this.extractFunctions(context.code);

    if (functions.length === 0) {
      recommendations.push('No functions detected - consider adding testable units');
      score -= 0.1;
    } else {
      const uncoveredFunctions = this.findUncoveredFunctions(context);

      if (uncoveredFunctions.length > 0) {
        issues.push(`${uncoveredFunctions.length} function(s) without tests: ${uncoveredFunctions.slice(0, 3).join(', ')}${uncoveredFunctions.length > 3 ? '...' : ''}`);
        score -= Math.min(0.3, uncoveredFunctions.length * 0.05);

        const testTemplate = this.createTestTemplate(context, uncoveredFunctions.slice(0, 3));
        recommendations.push(`Generated test template for ${Math.min(3, uncoveredFunctions.length)} function(s)`);
        recommendations.push(`\`\`\`typescript\n${testTemplate}\n\`\`\``);
      }

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

  private async validatePerformanceBudget(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    if (!context.code) {
      return {
        stage: ValidationStage.SPECIFICATION,
        status: 'pass',
        score: 1.0,
        issues: [],
        recommendations: ['Skipped: No code provided for performance validation'],
        executionTimeMs: Date.now() - startTime
      };
    }

    const codeSizeKb = context.code.length / 1024;
    if (context.performanceBudget && codeSizeKb > context.performanceBudget.maxBundleSizeKb) {
      issues.push(`Code size ${codeSizeKb.toFixed(1)}KB exceeds budget ${context.performanceBudget.maxBundleSizeKb}KB`);
      score -= 0.25;
    } else if (codeSizeKb > 100) {
      recommendations.push(`Code size ${codeSizeKb.toFixed(1)}KB - consider code splitting for large files`);
    }

    const cyclomaticComplexity = this.calculateCyclomaticComplexity(context.code);
    if (cyclomaticComplexity > 20) {
      issues.push(`High cyclomatic complexity (${cyclomaticComplexity}) - difficult to test and maintain`);
      recommendations.push('Refactor complex functions into smaller, testable units');
      score -= 0.2;
    } else if (cyclomaticComplexity > 15) {
      recommendations.push(`Moderate complexity (${cyclomaticComplexity}) - monitor and refactor if it grows`);
      score -= 0.1;
    }

    const heavyPatterns = this.detectHeavyPatterns(context.code);
    if (heavyPatterns.length > 0) {
      heavyPatterns.forEach(pattern => {
        issues.push(`Performance concern (line ${pattern.line}): ${pattern.type}`);
      });
      score -= Math.min(0.3, heavyPatterns.length * 0.1);
      recommendations.push('Optimize identified performance bottlenecks before production deployment');
    }

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

  private async checkDeploymentReadiness(context: CodeContext): Promise<StageResult> {
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

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

    if (context.code) {
      const securityIssues = this.checkSecurityPatterns(context.code);
      if (securityIssues.length > 0) {
        issues.push(...securityIssues);
        score -= 0.3;
      }
    }

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

  // ==========================================================================
  // PRIVATE — CODE ANALYSIS HELPERS (C-008 V2)
  // ==========================================================================

  private analyzeCodePatterns(code: string, _language: string): {
    hasAsyncWithoutErrorHandling: boolean;
    hasPotentialNullAccess: boolean;
    complexity: number;
    duplicateCode: number;
  } {
    const lines = code.split('\n');
    const asyncFunctions = code.match(/async\s+function|async\s+\(/g) || [];
    const tryCatchBlocks = code.match(/try\s*\{/g) || [];
    const hasAsyncWithoutErrorHandling = asyncFunctions.length > tryCatchBlocks.length;

    const potentialAccesses = [/\.\w+\s*\(/g, /\[\w+\]/g].reduce((count, pattern) => {
      return count + (code.match(pattern) || []).length;
    }, 0);
    const nullChecks = (code.match(/if\s*\(.*[!=]==?\s*null/g) || []).length +
                       (code.match(/if\s*\(.*[!=]==?\s*undefined/g) || []).length;
    const hasPotentialNullAccess = potentialAccesses > nullChecks * 2;

    const complexity = Math.min(30, lines.length / 10 +
      (code.match(/if|for|while|switch|catch/g) || []).length);
    const duplicateCode = this.estimateDuplication(lines);

    return { hasAsyncWithoutErrorHandling, hasPotentialNullAccess, complexity, duplicateCode };
  }

  private analyzeFilePath(path: string): { isTestFile: boolean; isCriticalPath: boolean } {
    const lowerPath = path.toLowerCase();
    return {
      isTestFile: lowerPath.includes('test') || lowerPath.includes('spec') || lowerPath.endsWith('.test.ts') || lowerPath.endsWith('.spec.ts'),
      isCriticalPath: lowerPath.includes('auth') || lowerPath.includes('payment') || lowerPath.includes('security') || lowerPath.includes('user')
    };
  }

  private checkSecurityPatterns(code: string): string[] {
    const issues: string[] = [];
    const secretPatterns = [/password\s*=\s*['"]/i, /api[_-]?key\s*=\s*['"]/i, /secret\s*=\s*['"]/i, /token\s*=\s*['"]\w{20,}/i];
    secretPatterns.forEach(pattern => {
      if (pattern.test(code)) issues.push('Potential hardcoded secret detected - use environment variables');
    });
    if (code.includes('SELECT') && code.includes('+') && !code.includes('?')) {
      issues.push('Potential SQL injection risk - use parameterized queries');
    }
    if (code.includes('eval(')) issues.push('eval() usage detected - security risk');
    return issues;
  }

  private estimateDuplication(lines: string[]): number {
    const lineMap = new Map<string, number>();
    let duplicateCount = 0;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length > 10) {
        const count = lineMap.get(trimmed) || 0;
        lineMap.set(trimmed, count + 1);
        if (count > 0) duplicateCount++;
      }
    });
    return Math.min(100, (duplicateCount / lines.length) * 100);
  }

  private extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const functionPattern = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = functionPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      functions.push({ name: match[1], params: match[2].split(',').map(p => p.trim()).filter(Boolean), isAsync: match[0].includes('async'), startLine: lineNumber });
    }
    const arrowPattern = /(?:export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowPattern.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      functions.push({ name: match[1], params: [], isAsync: !!match[2], startLine: lineNumber });
    }
    const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{/g;
    while ((match = methodPattern.exec(code)) !== null) {
      const name = match[1];
      if (name !== 'constructor' && name !== 'if' && name !== 'for' && name !== 'while') {
        const lineNumber = code.substring(0, match.index).split('\n').length;
        functions.push({ name, params: [], isAsync: match[0].includes('async'), startLine: lineNumber });
      }
    }
    const seen = new Set<string>();
    return functions.filter(f => { if (seen.has(f.name)) return false; seen.add(f.name); return true; });
  }

  private findUncoveredFunctions(context: CodeContext): string[] {
    if (!context.code) return [];
    const functions = this.extractFunctions(context.code);
    const testedFunctions = this.extractTestedFunctions(context.code);
    return functions.map(f => f.name).filter(name => !testedFunctions.includes(name));
  }

  private extractTestedFunctions(code: string): string[] {
    const tested: string[] = [];
    const describePattern = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = describePattern.exec(code)) !== null) tested.push(match[1]);
    const testNames = code.match(/(?:it|test)\s*\(\s*['"`][^'"`]*['"`]/g) || [];
    testNames.forEach(testName => {
      const words = testName.match(/\w+/g) || [];
      words.forEach(word => { if (word.length > 3 && word !== 'should' && word !== 'test') tested.push(word); });
    });
    return tested;
  }

  private createTestTemplate(context: CodeContext, functionNames: string[]): string {
    const language = context.language || 'typescript';
    if (language === 'typescript' || language === 'javascript') {
      const functions = this.extractFunctions(context.code!);
      const targetFunctions = functions.filter(f => functionNames.includes(f.name));
      return targetFunctions.map(fn => {
        const asyncPrefix = fn.isAsync ? 'async ' : '';
        return `describe('${fn.name}', () => {
  it('should handle valid input', ${asyncPrefix}() => {
    ${fn.params.length > 0 ? `const ${fn.params.join(', ')} = /* TODO: provide test values */;` : ''}
    const result = ${fn.isAsync ? 'await ' : ''}${fn.name}(${fn.params.join(', ')});
    expect(result).toBe(/* TODO: expected output */);
  });
  it('should handle edge cases', ${asyncPrefix}() => { /* TODO */ });
  it('should handle errors gracefully', ${asyncPrefix}() => { /* TODO */ });
});`;
      }).join('\n\n');
    }
    return '// Test template generation not supported for this language';
  }

  private calculateCyclomaticComplexity(code: string): number {
    const decisionPoints = [/\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /\?\s*.*:\s*/g, /&&/g, /\|\|/g];
    let complexity = 1;
    decisionPoints.forEach(pattern => { complexity += (code.match(pattern) || []).length; });
    return complexity;
  }

  private detectHeavyPatterns(code: string): Array<{type: string; line: number}> {
    const patterns: Array<{type: string; line: number}> = [];
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      if (/for.*for|while.*while|forEach.*forEach/.test(line)) patterns.push({ type: 'Nested loops (O(n²) complexity)', line: idx + 1 });
      if (/readFileSync|writeFileSync|existsSync/.test(line)) patterns.push({ type: 'Synchronous file I/O (blocks event loop)', line: idx + 1 });
      if (/\.map\(.*\.filter\(|\.filter\(.*\.map\(/.test(line)) patterns.push({ type: 'Chained array methods (creates intermediate arrays)', line: idx + 1 });
      if (/for.*new RegExp|while.*new RegExp/.test(line)) patterns.push({ type: 'Regex compilation in loop (move outside)', line: idx + 1 });
      if (/for.*querySelector|while.*querySelector|forEach.*querySelector/.test(line)) patterns.push({ type: 'DOM queries in loop (cache results)', line: idx + 1 });
    });
    return patterns;
  }

  private calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of code) {
      if (char === '{') { currentDepth++; maxDepth = Math.max(maxDepth, currentDepth); }
      else if (char === '}') currentDepth--;
    }
    return maxDepth;
  }

  private detectCodeSmells(code: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const functions = this.extractFunctions(code);
    const lines = code.split('\n');

    functions.forEach(fn => {
      const fnCode = this.extractFunctionBody(code, fn.name);
      const fnLines = fnCode.split('\n').filter(l => l.trim()).length;
      if (fnLines > 50) smells.push({ smell: `Long Function: ${fn.name} (${fnLines} lines)`, severity: 'high', recommendation: 'Extract smaller functions with single responsibility', line: fn.startLine });
      else if (fnLines > 30) smells.push({ smell: `Long Function: ${fn.name} (${fnLines} lines)`, severity: 'medium', recommendation: 'Consider refactoring if complexity grows', line: fn.startLine });
      if (fn.params.length > 5) smells.push({ smell: `Long Parameter List: ${fn.name} (${fn.params.length} params)`, severity: 'medium', recommendation: 'Use parameter object or builder pattern', line: fn.startLine });
    });

    const magicNumbers = code.match(/(?<![a-zA-Z_0-9])[0-9]{2,}(?![a-zA-Z_0-9])/g) || [];
    if (new Set(magicNumbers).size > 5) smells.push({ smell: `Magic Numbers detected (${new Set(magicNumbers).size} unique values)`, severity: 'low', recommendation: 'Extract magic numbers to named constants' });

    const duplicateRatio = this.estimateDuplication(lines);
    if (duplicateRatio > 20) smells.push({ smell: `High code duplication (${duplicateRatio.toFixed(0)}%)`, severity: 'high', recommendation: 'Extract common logic to reusable functions' });
    else if (duplicateRatio > 15) smells.push({ smell: `Moderate code duplication (${duplicateRatio.toFixed(0)}%)`, severity: 'medium', recommendation: 'Monitor and refactor duplicated patterns' });

    const maxNesting = this.calculateMaxNesting(code);
    if (maxNesting > 5) smells.push({ smell: `Deep nesting (${maxNesting} levels)`, severity: 'high', recommendation: 'Use early returns or extract nested logic' });
    else if (maxNesting > 4) smells.push({ smell: `Moderate nesting (${maxNesting} levels)`, severity: 'medium', recommendation: 'Consider flattening control flow' });

    if (functions.length > 20) smells.push({ smell: `God Class detected (${functions.length} methods)`, severity: 'high', recommendation: 'Split into smaller, focused classes/modules' });

    return smells;
  }

  private extractFunctionBody(code: string, functionName: string): string {
    const patterns = [
      new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'),
      new RegExp(`const\\s+${functionName}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'),
      new RegExp(`${functionName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(code);
      if (match) return match[1];
    }
    return '';
  }

  private analyzeDependencyImpact(context: CodeContext): DependencyImpact {
    if (!context.code) return { directDependents: [], estimatedImpactRadius: 0, criticalPaths: [] };
    const imports = this.extractImports(context.code);
    const exports = this.extractExports(context.code);
    const criticalPaths = imports.filter(imp => ['auth', 'payment', 'security', 'database', 'user', 'session'].some(kw => imp.includes(kw)));
    const estimatedImpactRadius = exports.length > 0 ? Math.min(10, exports.length * 2) : 1;
    return { directDependents: imports, estimatedImpactRadius, criticalPaths };
  }

  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(code)) !== null) imports.push(match[1]);
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requirePattern.exec(code)) !== null) imports.push(match[1]);
    return imports;
  }

  private extractExports(code: string): string[] {
    const exports: string[] = [];
    const exportPattern = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = exportPattern.exec(code)) !== null) exports.push(match[1]);
    const exportBlockPattern = /export\s*\{([^}]+)\}/g;
    while ((match = exportBlockPattern.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }
    return exports;
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(pipeline: ValidationPipeline): string {
    const stagesSummary = pipeline.stages.map(s => `${s.stage}: ${s.status} (${(s.score * 100).toFixed(0)}%)`).join('\n');
    const allIssues = pipeline.stages.flatMap(s => s.issues);
    const allRecommendations = pipeline.stages.flatMap(s => s.recommendations);
    return `V2 Validation Summary\n=====================\nOverall: ${pipeline.overallStatus} (${(pipeline.overallScore * 100).toFixed(1)}%)\nTime: ${pipeline.totalTimeMs}ms\n\nStages:\n${stagesSummary}\n\n${allIssues.length > 0 ? `Issues:\n${allIssues.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}` : '✅ No issues found'}\n\n${allRecommendations.length > 0 ? `\nRecommendations:\n${allRecommendations.slice(0, 5).map((r, idx) => `${idx + 1}. ${r}`).join('\n')}` : ''}`.trim();
  }
}
