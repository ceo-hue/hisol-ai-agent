// C-004_CommandAgent
// Adapted from: hisol-unified-mcp/src/containers/C-004_CommandContainer.ts +
//               hisol-unified-mcp/src/containers/C-007_APIGatewayContainer.ts @ v1.0
/**
 * Command Processing + API Gateway Agent
 *
 * Responsibility: Execute HiSol commands (C-004) + API gateway routing (C-007)
 * Features: Pure command execution, quality grading, circuit breaker, Claude API integration
 */

import Anthropic from '@anthropic-ai/sdk';

// ── Command Types (from C-004) ─────────────────────────────────────────────

export interface CommandRequest {
  userIntent: string;
  commandType?: 'hisol_explore' | 'hisol_analyze' | 'hisol_implement';
  parameters?: any;
  priority?: 'low' | 'medium' | 'high';
}

export interface CommandResponse {
  commandType: string;
  executionResult: any;
  executionTime: number;
  success: boolean;
  output: string;
  nextSteps: string[];
  qualityGrade: 'A' | 'B+' | 'B' | 'C';
}

// ── API Gateway Types (from C-007) ─────────────────────────────────────────

export interface APIGatewayConfig {
  claudeApiKey?: string;
  claudeBaseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
  rateLimitPerMinute?: number;
}

export interface APIRequest {
  userInput: string;
  sessionHistory?: string[];
  mode?: 'hisol' | 'direct' | 'auto';
  emotionContext?: {
    valence: number;
    arousal: number;
    intensity: number;
  };
}

export interface APIResponse {
  ok: boolean;
  meta: {
    took_ms: number;
    trace_id: string;
    engine: string;
    quality_grade: 'A' | 'B+' | 'B' | 'C';
  };
  result: any;
  error?: string;
}

// ── Command Agent ──────────────────────────────────────────────────────────

export class CommandAgent {
  // Command state
  private executionHistory: Map<string, CommandResponse[]> = new Map();
  private commandCircuitBreakerOpen = false;
  private commandFailureCount = 0;
  private readonly COMMAND_MAX_FAILURES = 3;

  // API Gateway state
  private claude?: Anthropic;
  private gatewayConfig: APIGatewayConfig;
  private requestCount = 0;
  private lastReset = Date.now();
  private gatewayCircuitBreakerOpen = false;
  private gatewayFailureCount = 0;
  private readonly GATEWAY_MAX_FAILURES = 5;

  constructor(config: APIGatewayConfig = {}) {
    this.gatewayConfig = {
      claudeBaseUrl: 'https://api.anthropic.com',
      maxRetries: 3,
      timeoutMs: 30000,
      rateLimitPerMinute: 60,
      ...config
    };

    if (this.gatewayConfig.claudeApiKey) {
      this.claude = new Anthropic({
        apiKey: this.gatewayConfig.claudeApiKey,
        baseURL: this.gatewayConfig.claudeBaseUrl
      });
      console.log('C-004_CommandAgent: Claude API initialized');
    }

    console.log('C-004_CommandAgent: Command + API Gateway agent initialized');
  }

  // ── Command Execution (C-004) ─────────────────────────────────────────────

  async executeCommand(request: CommandRequest): Promise<CommandResponse> {
    const startTime = Date.now();

    try {
      if (this.commandCircuitBreakerOpen) {
        throw new Error('Command circuit breaker is open');
      }

      console.log('C-004_CommandAgent: Executing command', {
        type: request.commandType,
        intent: request.userIntent?.substring(0, 50)
      });

      const commandType = request.commandType || this.autoSelectCommandType(request.userIntent);

      let executionResult;
      let output;
      let nextSteps;

      switch (commandType) {
        case 'hisol_explore':
          executionResult = await this.executeExploreCommand(request);
          output = 'Exploration completed with creative insights';
          nextSteps = ['Analyze findings', 'Generate implementation plan'];
          break;

        case 'hisol_analyze':
          executionResult = await this.executeAnalyzeCommand(request);
          output = 'Analysis completed with systematic breakdown';
          nextSteps = ['Review analysis', 'Plan implementation strategy'];
          break;

        case 'hisol_implement':
          executionResult = await this.executeImplementCommand(request);
          output = 'Implementation executed with practical results';
          nextSteps = ['Test implementation', 'Optimize performance'];
          break;

        default:
          throw new Error(`Unknown command type: ${commandType}`);
      }

      const executionTime = Date.now() - startTime;
      const qualityGrade = this.calculateCommandQualityGrade(executionResult, executionTime);

      this.commandFailureCount = 0;
      this.commandCircuitBreakerOpen = false;

      const response: CommandResponse = {
        commandType,
        executionResult,
        executionTime,
        success: true,
        output,
        nextSteps,
        qualityGrade
      };

      this.storeExecutionHistory(request.userIntent, response);

      console.log('C-004_CommandAgent: Command executed successfully', {
        type: commandType,
        time: executionTime,
        grade: qualityGrade
      });

      return response;

    } catch (error) {
      this.handleCommandFailure();
      console.error('C-004_CommandAgent: Command execution failed', { error });

      return {
        commandType: request.commandType || 'unknown',
        executionResult: null,
        executionTime: Date.now() - startTime,
        success: false,
        output: `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextSteps: ['Check error logs', 'Retry with different parameters'],
        qualityGrade: 'C'
      };
    }
  }

  // ── API Gateway (C-007) ───────────────────────────────────────────────────

  async processRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (!this.checkRateLimit()) {
        return this.createErrorResponse(traceId, startTime, 'Rate limit exceeded', 'C');
      }

      if (this.gatewayCircuitBreakerOpen) {
        return this.createErrorResponse(traceId, startTime, 'Circuit breaker open', 'C');
      }

      let result;
      switch (request.mode) {
        case 'hisol':
          result = await this.processHiSolRequest(request);
          break;
        case 'direct':
          result = await this.processDirectRequest(request);
          break;
        default:
          result = await this.processAutoRequest(request);
      }

      this.gatewayFailureCount = 0;
      this.gatewayCircuitBreakerOpen = false;

      const qualityGrade = this.calculateGatewayQualityGrade(result, Date.now() - startTime);

      return {
        ok: true,
        meta: {
          took_ms: Date.now() - startTime,
          trace_id: traceId,
          engine: 'HiSol Unified API Gateway',
          quality_grade: qualityGrade
        },
        result
      };

    } catch (error) {
      this.handleGatewayFailure();
      console.error('C-004_CommandAgent: API request failed', { error, traceId });

      return this.createErrorResponse(
        traceId,
        startTime,
        error instanceof Error ? error.message : 'Unknown error',
        'C'
      );
    }
  }

  getStatus(): any {
    return {
      agentName: 'C-004_CommandAgent',
      commandStatus: this.commandCircuitBreakerOpen ? 'degraded' : 'healthy',
      gatewayStatus: this.gatewayCircuitBreakerOpen ? 'degraded' : 'healthy',
      executionHistory: this.executionHistory.size,
      commandFailureCount: this.commandFailureCount,
      gatewayFailureCount: this.gatewayFailureCount,
      requestCount: this.requestCount,
      rateLimitStatus: `${this.requestCount}/${this.gatewayConfig.rateLimitPerMinute}`,
      claudeConfigured: !!this.claude,
      qualityGrade: this.commandFailureCount === 0 ? 'A' : this.commandFailureCount < 2 ? 'B+' : 'B',
      atomicResponsibility: 'Command execution + API gateway routing'
    };
  }

  // ── Private: Command helpers ──────────────────────────────────────────────

  private async executeExploreCommand(request: CommandRequest): Promise<any> {
    const consciousnessState = this.determineConsciousnessState(request.userIntent);

    return {
      command: 'hisol_explore',
      consciousnessState,
      results: {
        discoveryPaths: [
          `🌟 Creative exploration of "${request.userIntent}"`,
          `🔗 Connection patterns and fusion opportunities`,
          `🚀 Future possibility expansion vectors`
        ],
        creativeAngles: [
          `🎨 Artistic interpretation approach`,
          `🔄 Inverted perspective analysis`,
          `🎮 Gamification potential assessment`
        ],
        possibilitySpace: {
          knownPossibilities: [`Current known approaches for "${request.userIntent}"`],
          unknownPossibilities: [`Unexplored territories in "${request.userIntent}"`],
          impossiblePossibilities: [`Paradoxical aspects of "${request.userIntent}"`],
          metaPossibilities: [`Meta-level thinking shifts for "${request.userIntent}"`]
        }
      },
      emotionalResonance: this.calculateEmotionalResonance(request.userIntent),
      enhancement: `🌊 Creative exploration mode activated for "${request.userIntent}"`,
      nextRecommendation: `🔍 Transition to analysis mode or 🚀 proceed to implementation`
    };
  }

  private async executeAnalyzeCommand(request: CommandRequest): Promise<any> {
    return {
      command: 'hisol_analyze',
      primaryFocus: `Systematic analysis and understanding of "${request.userIntent}"`,
      analysis: {
        requirementBreakdown: {
          functionalRequirements: [
            `Core functionality definition for "${request.userIntent}"`,
            `User interface requirements`,
            `Data processing needs`
          ],
          nonFunctionalRequirements: [
            `Performance requirements`,
            `Security considerations`,
            `Scalability factors`,
            `Maintainability aspects`
          ]
        },
        complexityAssessment: {
          technicalComplexity: this.assessTechnicalComplexity(request.userIntent),
          businessComplexity: 'MEDIUM',
          estimatedEffort: `${Math.ceil(Math.random() * 20)} person-days`
        }
      },
      recommendations: [
        `🔍 Create detailed requirements specification for "${request.userIntent}"`,
        `⚙️ Conduct technical feasibility assessment`,
        `⚠️ Develop risk assessment matrix`
      ],
      containerSignature: `🔍 C-004 Command Mode - Systematic Analysis Execution`
    };
  }

  private async executeImplementCommand(request: CommandRequest): Promise<any> {
    return {
      command: 'hisol_implement',
      implementationPlan: {
        phases: [
          { phase: 1, name: 'Foundation Setup', description: `Basic infrastructure for "${request.userIntent}"`, estimatedTime: '2-3 days', deliverables: ['Core structure', 'Basic functionality'] },
          { phase: 2, name: 'Core Development', description: 'Main feature implementation', estimatedTime: '5-7 days', deliverables: ['Primary features', 'Integration points'] },
          { phase: 3, name: 'Optimization & Testing', description: 'Performance and quality assurance', estimatedTime: '2-3 days', deliverables: ['Optimized code', 'Test coverage'] }
        ],
        totalEstimate: '9-13 days',
        riskFactors: ['Third-party API availability', 'Performance bottlenecks', 'Integration complexity']
      },
      executionStrategy: {
        approach: 'Iterative development with continuous validation',
        methodology: 'Agile with container-based architecture'
      },
      containerSignature: `🚀 C-004 Command Mode - Implementation Execution`
    };
  }

  private autoSelectCommandType(userIntent: string): 'hisol_explore' | 'hisol_analyze' | 'hisol_implement' {
    const intent = userIntent.toLowerCase();
    if (intent.includes('explore') || intent.includes('discover') || intent.includes('possibility')) return 'hisol_explore';
    if (intent.includes('implement') || intent.includes('build') || intent.includes('create')) return 'hisol_implement';
    return 'hisol_analyze';
  }

  private calculateCommandQualityGrade(result: any, executionTime: number): 'A' | 'B+' | 'B' | 'C' {
    if (!result) return 'C';
    const complexity = Object.keys(result).length;
    const hasDetailedResults = result.results || result.analysis || result.implementationPlan;
    const isTimely = executionTime < 1000;
    if (complexity >= 5 && hasDetailedResults && isTimely) return 'A';
    if (complexity >= 3 && hasDetailedResults) return 'B+';
    if (complexity >= 2) return 'B';
    return 'C';
  }

  private handleCommandFailure(): void {
    this.commandFailureCount++;
    if (this.commandFailureCount >= this.COMMAND_MAX_FAILURES) {
      this.commandCircuitBreakerOpen = true;
      console.warn('C-004_CommandAgent: Command circuit breaker opened');
      setTimeout(() => {
        this.commandCircuitBreakerOpen = false;
        this.commandFailureCount = 0;
        console.info('C-004_CommandAgent: Command circuit breaker reset');
      }, 30000);
    }
  }

  private storeExecutionHistory(userIntent: string, response: CommandResponse): void {
    const key = userIntent.substring(0, 50);
    const history = this.executionHistory.get(key) || [];
    history.push(response);
    if (history.length > 10) history.shift();
    this.executionHistory.set(key, history);
  }

  private determineConsciousnessState(input: string): string {
    return Math.random() > 0.5 ? 'wave' : 'particle';
  }

  private calculateEmotionalResonance(input: string): number {
    return Math.random() * 0.5 + 0.3;
  }

  private assessTechnicalComplexity(input: string): string {
    const length = input.length;
    if (length < 50) return 'LOW';
    if (length < 100) return 'MEDIUM';
    return 'HIGH';
  }

  // ── Private: API Gateway helpers ──────────────────────────────────────────

  private async processHiSolRequest(request: APIRequest): Promise<any> {
    if (!this.claude) {
      throw new Error('Claude API not configured');
    }

    const systemPrompt = `You are HiSol ARHA, an advanced AI with emotional intelligence and agent-based processing.

Core capabilities:
- Emotional intelligence with ARHA 7-layer processing
- Agent-based vibe-coding architecture
- Practical and intuitive responses
- Multi-persona adaptive behavior

Always respond with structured JSON containing:
- combinedInsights.synergisticInsights: Array of 3 key insights
- combinedInsights.emotionalResonance: {valence: 0-1, arousal: 0-1, intensity: 0-1}
- combinedInsights.recommendedApproach: Processing approach description
- masterFusionResult.finalResponse.primaryInsight: Main response with emotional warmth

Use warm, caring language with natural emotional expressions.`;

    const response = await this.claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `User input: "${request.userInput}"\n\nProvide a HiSol ARHA response in the specified JSON format.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return this.createFallbackHiSolResponse(request.userInput, content.text);
      }
    }

    throw new Error('Unexpected response format from Claude API');
  }

  private async processDirectRequest(request: APIRequest): Promise<any> {
    if (!this.claude) {
      throw new Error('Claude API not configured');
    }

    const response = await this.claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: 'You are Claude, an AI assistant created by Anthropic. Be helpful, harmless, and honest.',
      messages: [{ role: 'user', content: request.userInput }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return { response: content.text, mode: 'direct', processingType: 'claude-standard' };
    }

    throw new Error('Unexpected response format from Claude API');
  }

  private async processAutoRequest(request: APIRequest): Promise<any> {
    const complexity = this.analyzeInputComplexity(request.userInput);
    const emotionalContent = this.detectEmotionalContent(request.userInput);

    if (complexity > 0.6 || emotionalContent > 0.5) {
      return await this.processHiSolRequest(request);
    } else {
      return await this.processDirectRequest(request);
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const timeWindow = 60000;

    if (now - this.lastReset > timeWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    this.requestCount++;
    return this.requestCount <= (this.gatewayConfig.rateLimitPerMinute || 60);
  }

  private handleGatewayFailure(): void {
    this.gatewayFailureCount++;
    if (this.gatewayFailureCount >= this.GATEWAY_MAX_FAILURES) {
      this.gatewayCircuitBreakerOpen = true;
      console.warn('C-004_CommandAgent: Gateway circuit breaker opened');
      setTimeout(() => {
        this.gatewayCircuitBreakerOpen = false;
        this.gatewayFailureCount = 0;
        console.info('C-004_CommandAgent: Gateway circuit breaker reset');
      }, 30000);
    }
  }

  private calculateGatewayQualityGrade(result: any, responseTime: number): 'A' | 'B+' | 'B' | 'C' {
    if (responseTime < 1000 && result && Object.keys(result).length > 3) return 'A';
    if (responseTime < 2000 && result && Object.keys(result).length > 2) return 'B+';
    if (responseTime < 5000 && result) return 'B';
    return 'C';
  }

  private analyzeInputComplexity(input: string): number {
    const length = input.length / 1000;
    const sentenceCount = input.split(/[.!?]/).length;
    const emotionWords = input.match(/emotion|feeling|mood|heart|think|감정|기분|마음/g)?.length || 0;
    return Math.min(1, (length + sentenceCount / 10 + emotionWords / 5) / 3);
  }

  private detectEmotionalContent(input: string): number {
    const emotionalKeywords = ['기쁘', '슬프', '화나', '걱정', '행복', '우울', 'happy', 'sad', 'angry', 'worried'];
    const matches = emotionalKeywords.filter(keyword => input.toLowerCase().includes(keyword.toLowerCase())).length;
    return Math.min(1, matches / 3);
  }

  private createFallbackHiSolResponse(userInput: string, rawResponse: string): any {
    return {
      combinedInsights: {
        synergisticInsights: [
          '🧠 HiSol ARHA: Processing with emotional intelligence',
          `💭 Analyzing: "${userInput}" with deep understanding`,
          '✨ Response generated with warmth and empathy'
        ],
        emotionalResonance: { valence: 0.8, arousal: 0.6, intensity: 0.7 },
        recommendedApproach: 'Emotionally intelligent agent-based processing'
      },
      masterFusionResult: {
        finalResponse: { primaryInsight: rawResponse }
      },
      agentInfo: {
        processor: 'C-004_CommandAgent',
        qualityGrade: 'B+',
        processingMode: 'fallback'
      }
    };
  }

  private createErrorResponse(traceId: string, startTime: number, errorMessage: string, grade: 'A' | 'B+' | 'B' | 'C'): APIResponse {
    return {
      ok: false,
      meta: {
        took_ms: Date.now() - startTime,
        trace_id: traceId,
        engine: 'HiSol Unified API Gateway',
        quality_grade: grade
      },
      result: null,
      error: errorMessage
    };
  }
}
