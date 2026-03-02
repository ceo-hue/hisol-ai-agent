// C-007_APIGatewayContainer
/**
 * API Gateway Container with LLM Integration
 *
 * Responsibility: Handle external API calls and LLM routing
 * Features: Claude API integration, monitoring, circuit breaker
 */

import Anthropic from '@anthropic-ai/sdk';

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

export class APIGatewayContainer {
  private claude?: Anthropic;
  private config: APIGatewayConfig;
  private requestCount = 0;
  private lastReset = Date.now();
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private readonly MAX_FAILURES = 5;

  constructor(config: APIGatewayConfig = {}) {
    this.config = {
      claudeBaseUrl: 'https://api.anthropic.com',
      maxRetries: 3,
      timeoutMs: 30000,
      rateLimitPerMinute: 60,
      ...config
    };

    if (this.config.claudeApiKey) {
      this.claude = new Anthropic({
        apiKey: this.config.claudeApiKey,
        baseURL: this.config.claudeBaseUrl
      });
      console.log('C-007_APIGatewayContainer: Claude API initialized');
    }
  }

  /**
   * Process API request with circuit breaker and monitoring
   */
  async processRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Rate limiting check
      if (!this.checkRateLimit()) {
        return this.createErrorResponse(traceId, startTime, 'Rate limit exceeded', 'C');
      }

      // Circuit breaker check
      if (this.circuitBreakerOpen) {
        return this.createErrorResponse(traceId, startTime, 'Circuit breaker open', 'C');
      }

      // Route request based on mode
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

      // Reset failure count on success
      this.failureCount = 0;
      this.circuitBreakerOpen = false;

      const qualityGrade = this.calculateQualityGrade(result, Date.now() - startTime);

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
      this.handleFailure();
      console.error('C-007_APIGatewayContainer: Request failed', { error, traceId });

      return this.createErrorResponse(
        traceId,
        startTime,
        error instanceof Error ? error.message : 'Unknown error',
        'C'
      );
    }
  }

  /**
   * Process HiSol-enhanced request with emotional intelligence
   */
  private async processHiSolRequest(request: APIRequest): Promise<any> {
    if (!this.claude) {
      throw new Error('Claude API not configured');
    }

    const systemPrompt = `You are HiSol ARHA, an advanced AI with emotional intelligence and container-based processing.

Core capabilities:
- Emotional intelligence with ARHA 7-layer processing
- Container-based vibe-coding architecture
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

  /**
   * Process direct Claude request without HiSol processing
   */
  private async processDirectRequest(request: APIRequest): Promise<any> {
    if (!this.claude) {
      throw new Error('Claude API not configured');
    }

    const response = await this.claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: 'You are Claude, an AI assistant created by Anthropic. Be helpful, harmless, and honest.',
      messages: [{
        role: 'user',
        content: request.userInput
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return {
        response: content.text,
        mode: 'direct',
        processingType: 'claude-standard'
      };
    }

    throw new Error('Unexpected response format from Claude API');
  }

  /**
   * Auto-select processing mode based on input complexity
   */
  private async processAutoRequest(request: APIRequest): Promise<any> {
    const complexity = this.analyzeComplexity(request.userInput);
    const emotionalContent = this.detectEmotionalContent(request.userInput);

    if (complexity > 0.6 || emotionalContent > 0.5) {
      return await this.processHiSolRequest(request);
    } else {
      return await this.processDirectRequest(request);
    }
  }

  /**
   * Rate limiting implementation
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute

    if (now - this.lastReset > timeWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    this.requestCount++;
    return this.requestCount <= (this.config.rateLimitPerMinute || 60);
  }

  /**
   * Circuit breaker failure handling
   */
  private handleFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.MAX_FAILURES) {
      this.circuitBreakerOpen = true;
      console.warn('C-007_APIGatewayContainer: Circuit breaker opened due to failures');

      // Auto-reset after 30 seconds
      setTimeout(() => {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
        console.info('C-007_APIGatewayContainer: Circuit breaker reset');
      }, 30000);
    }
  }

  /**
   * Calculate response quality grade
   */
  private calculateQualityGrade(result: any, responseTime: number): 'A' | 'B+' | 'B' | 'C' {
    if (responseTime < 1000 && result && Object.keys(result).length > 3) return 'A';
    if (responseTime < 2000 && result && Object.keys(result).length > 2) return 'B+';
    if (responseTime < 5000 && result) return 'B';
    return 'C';
  }

  /**
   * Analyze input complexity
   */
  private analyzeComplexity(input: string): number {
    const length = input.length / 1000;
    const sentenceCount = input.split(/[.!?]/).length;
    const emotionWords = input.match(/emotion|feeling|mood|heart|think|감정|기분|마음/g)?.length || 0;

    return Math.min(1, (length + sentenceCount / 10 + emotionWords / 5) / 3);
  }

  /**
   * Detect emotional content
   */
  private detectEmotionalContent(input: string): number {
    const emotionalKeywords = [
      '기쁘', '슬프', '화나', '걱정', '행복', '우울', 'happy', 'sad', 'angry', 'worried'
    ];

    const matches = emotionalKeywords.filter(keyword =>
      input.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    return Math.min(1, matches / 3);
  }

  /**
   * Create fallback HiSol response
   */
  private createFallbackHiSolResponse(userInput: string, rawResponse: string): any {
    return {
      combinedInsights: {
        synergisticInsights: [
          "🧠 HiSol ARHA: Processing with emotional intelligence",
          `💭 Analyzing: "${userInput}" with deep understanding`,
          "✨ Response generated with warmth and empathy"
        ],
        emotionalResonance: {
          valence: 0.8,
          arousal: 0.6,
          intensity: 0.7
        },
        recommendedApproach: "Emotionally intelligent container-based processing"
      },
      masterFusionResult: {
        finalResponse: {
          primaryInsight: rawResponse
        }
      },
      containerInfo: {
        processor: 'C-007_APIGatewayContainer',
        qualityGrade: 'B+',
        processingMode: 'fallback'
      }
    };
  }

  /**
   * Create error response
   */
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

  /**
   * Get container status
   */
  getStatus(): any {
    return {
      containerName: 'C-007_APIGatewayContainer',
      status: this.circuitBreakerOpen ? 'degraded' : 'healthy',
      requestCount: this.requestCount,
      failureCount: this.failureCount,
      rateLimitStatus: `${this.requestCount}/${this.config.rateLimitPerMinute}`,
      claudeConfigured: !!this.claude,
      lastReset: new Date(this.lastReset).toISOString()
    };
  }
}