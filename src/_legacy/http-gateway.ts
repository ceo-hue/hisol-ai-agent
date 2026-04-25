// C-007_HTTPGateway
/**
 * HiSol HTTP Gateway - Express-based HTTP server for web frontend
 *
 * Responsibility: Bridge between web frontend and HiSol MCP Server
 * Features:
 * - RESTful API endpoints
 * - CORS support
 * - Master Fusion mode
 * - Direct Claude mode
 * - Error handling and logging
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { EmotionAgent } from './agents/C-001_EmotionAgent.js';
import { PersonaAgent } from './agents/C-003_PersonaAgent.js';
import { CommandAgent } from './agents/C-004_CommandAgent.js';

const app = express();
const PORT = process.env.HTTP_PORT || 8080;

// Initialize agents
const emotionEngine = new EmotionAgent();
const agentEngine = new PersonaAgent();
const apiGateway = new CommandAgent({
  claudeApiKey: process.env.CLAUDE_API_KEY,
  claudeBaseUrl: process.env.CLAUDE_API_BASE_URL || 'https://api.anthropic.com',
  maxRetries: 3,
  timeoutMs: 30000,
  rateLimitPerMinute: 60
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[HTTP_GATEWAY] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    body: req.method === 'POST' ? '...' : undefined
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HiSol HTTP Gateway',
    version: '1.0.0'
  });
});

/**
 * POST /v1/hisol/process
 * Master Fusion mode with ARHA emotional intelligence
 */
app.post('/v1/hisol/process', async (req: Request, res: Response) => {
  try {
    const {
      userInput,
      sessionHistory = [],
      culturalContext,
      enhanceResponse = true,
      hisolConfig = {}
    } = req.body;

    if (!userInput) {
      return res.status(400).json({
        error: 'userInput is required',
        code: 'MISSING_INPUT'
      });
    }

    console.log('[MASTER_FUSION] Processing request:', {
      inputLength: userInput.length,
      historyLength: sessionHistory.length,
      config: hisolConfig
    });

    // Step 1: Emotion Analysis
    const emotionResult = await emotionEngine.processEmotion({
      input: userInput,
      mode: 'fusion',
      sessionHistory,
      culturalContext
    });

    console.log('[MASTER_FUSION] Emotion analysis complete:', {
      primaryEmotion: emotionResult.primaryEmotion,
      confidence: emotionResult.confidence
    });

    // Step 2: Agent Processing (Persona selection)
    const agentResult: any = await agentEngine.processAgent({
      request: userInput,
      emotionContext: {
        valence: emotionResult.emotionVector?.valence || 0,
        arousal: emotionResult.emotionVector?.arousal || 0.5,
        intensity: emotionResult.confidence
      },
      priority: 'medium'
    });

    console.log('[MASTER_FUSION] Agent selected:', agentResult.selectedAgent || agentResult.agentType);

    // Step 3: Build enhanced system prompt
    const systemPrompt = buildMasterFusionPrompt(
      emotionResult,
      agentResult,
      hisolConfig,
      culturalContext
    );

    // Step 4: Call Claude API with enhanced prompt
    const claudeResponse = await callClaudeAPI({
      userInput,
      sessionHistory,
      systemPrompt
    });

    // Step 5: Build Master Fusion response
    const masterFusionResult = {
      finalResponse: {
        primaryInsight: claudeResponse,
        supportingInsights: [
          `감정 상태: ${emotionResult.primaryEmotion} (신뢰도: ${(emotionResult.confidence * 100).toFixed(0)}%)`,
          `선택된 페르소나: ${agentResult.selectedAgent || agentResult.agentType || 'HiSol-Agent'}`
        ],
        actionableRecommendations: agentResult.recommendations || [],
        hisolSignature: '✨ Powered by HiSol ARHA Emotional Intelligence'
      },
      emotionalAnalysis: {
        primaryEmotion: emotionResult.primaryEmotion,
        confidence: emotionResult.confidence,
        valence: emotionResult.emotionVector?.valence || 0,
        arousal: emotionResult.emotionVector?.arousal || 0.5,
        culturalResonance: (emotionResult as any).culturalResonance
      },
      agentInfo: {
        selectedAgent: agentResult.selectedAgent || agentResult.agentType || 'HiSol-Agent',
        personality: hisolConfig.personality || 'adaptive'
      },
      meta: {
        quality_grade: 'A',
        processing_time_ms: Date.now() - req.body._startTime || 0
      }
    };

    console.log('[MASTER_FUSION] Response ready:', {
      insightLength: masterFusionResult.finalResponse.primaryInsight.length,
      emotion: masterFusionResult.emotionalAnalysis.primaryEmotion
    });

    res.json({
      success: true,
      result: {
        masterFusionResult,
        combinedInsights: {
          synergisticInsights: [masterFusionResult.finalResponse.primaryInsight],
          emotionalResonance: masterFusionResult.emotionalAnalysis
        }
      }
    });

  } catch (error) {
    console.error('[MASTER_FUSION] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'MASTER_FUSION_ERROR'
    });
  }
});

/**
 * POST /v1/hisol/direct-claude
 * Direct Claude mode without emotional processing
 */
app.post('/v1/hisol/direct-claude', async (req: Request, res: Response) => {
  try {
    const { userInput, sessionHistory = [] } = req.body;

    if (!userInput) {
      return res.status(400).json({
        error: 'userInput is required',
        code: 'MISSING_INPUT'
      });
    }

    console.log('[DIRECT_CLAUDE] Processing request:', {
      inputLength: userInput.length,
      historyLength: sessionHistory.length
    });

    // Direct Claude API call
    const response = await callClaudeAPI({
      userInput,
      sessionHistory,
      systemPrompt: 'You are a helpful AI assistant. Respond naturally and conversationally.'
    });

    console.log('[DIRECT_CLAUDE] Response ready:', {
      responseLength: response.length
    });

    res.json({
      success: true,
      response,
      message: response,
      meta: {
        mode: 'direct-claude',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[DIRECT_CLAUDE] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'DIRECT_CLAUDE_ERROR'
    });
  }
});

/**
 * Build Master Fusion system prompt
 */
function buildMasterFusionPrompt(
  emotionResult: any,
  agentResult: any,
  hisolConfig: any,
  culturalContext?: string
): string {
  const prompt = `You are an emotionally intelligent AI assistant powered by HiSol ARHA system.

Current Emotional Context:
- Primary Emotion: ${emotionResult.primaryEmotion}
- Confidence: ${(emotionResult.confidence * 100).toFixed(0)}%
- Valence: ${emotionResult.emotionalVector?.valence?.toFixed(2) || 'N/A'}
- Arousal: ${emotionResult.emotionalVector?.arousal?.toFixed(2) || 'N/A'}

Selected Persona: ${agentResult.selectedAgent}
Personality Mode: ${hisolConfig.personality || 'adaptive'}

${culturalContext ? `Cultural Context: ${culturalContext}` : ''}

Instructions:
- Respond with emotional awareness and empathy
- Match the user's emotional state appropriately
- Be ${hisolConfig.personality || 'adaptive'} in your approach
- Provide thoughtful, contextually relevant responses
- Consider the cultural context in your communication style`;

  return prompt;
}

/**
 * Call Claude API
 */
async function callClaudeAPI(params: {
  userInput: string;
  sessionHistory: string[];
  systemPrompt: string;
}): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const client = new Anthropic({ apiKey });

  // Build message history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Add session history (last 6 messages for context)
  const recentHistory = params.sessionHistory.slice(-6);
  for (let i = 0; i < recentHistory.length; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: recentHistory[i]
    });
  }

  // Add current user input
  messages.push({
    role: 'user',
    content: params.userInput
  });

  console.log('[CLAUDE_API] Calling with:', {
    messageCount: messages.length,
    systemPromptLength: params.systemPrompt.length
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    temperature: 0.7,
    system: params.systemPrompt,
    messages
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  console.log('[CLAUDE_API] Response received:', {
    textLength: text.length,
    tokens: response.usage.output_tokens
  });

  return text;
}

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[HTTP_GATEWAY] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 HiSol HTTP Gateway Server Started');
  console.log('=====================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET  /health`);
  console.log(`   POST /v1/hisol/process (Master Fusion)`);
  console.log(`   POST /v1/hisol/direct-claude (Direct)`);
  console.log('');
  console.log('✅ Ready to accept connections');
  console.log('=====================================');
  console.log('');
});
