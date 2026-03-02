// Auto-Trigger System - Intelligent Persona Selection
// Safe addition - integrates with C-001 Emotion Engine

import { PersonaRole, TriggerRule, TriggerScore, TriggerResult } from '../core/types.js';
import { ARHAEmotionVector } from '../types/arha-emotion.js';

export const TRIGGER_RULES: TriggerRule[] = [
  // Backend & API
  {
    keywords: ['API', 'endpoint', 'REST', 'GraphQL', 'database', 'DB', 'schema', 'query', 'SQL'],
    intent_patterns: [
      /API\s+(create|design|build|make)/i,
      /database\s+model/i,
      /(create|design)\s+(endpoint|route)/i,
      /backend\s+(architecture|design)/i
    ],
    personas: ['SeniorBackendArchitect', 'SeniorTechLead'],
    priority: 9
  },

  // Frontend & UI
  {
    keywords: ['component', 'React', 'Vue', 'Svelte', 'frontend', 'state', 'UI', 'interface'],
    intent_patterns: [
      /(create|build|make)\s+component/i,
      /state\s+manage/i,
      /frontend\s+(architecture|design)/i,
      /(React|Vue|Svelte)\s+app/i
    ],
    personas: ['SeniorFrontendSpecialist', 'SeniorUXDesigner'],
    priority: 9
  },

  // Error & Debugging
  {
    keywords: ['error', 'bug', 'crash', 'TypeError', 'debug', 'fix', 'broken', 'fail'],
    intent_patterns: [
      /error\s+(occur|happen|appear)/i,
      /\w+Error:/,
      /(debug|fix|solve)\s+(error|bug|issue)/i,
      /not\s+work/i,
      /crash/i
    ],
    emotion_hints: { valence: -0.5, arousal: 0.7, intensity: 0.8 },
    personas: ['SeniorDebugTracer', 'SeniorQA_Security'],
    priority: 10
  },

  // Performance & Optimization
  {
    keywords: ['slow', 'optimize', 'performance', 'bundle', 'memory', 'TTI', 'FCP', 'lag'],
    intent_patterns: [
      /performance\s+(improve|optimize)/i,
      /too\s+slow/i,
      /(optimize|reduce)\s+(bundle|memory)/i,
      /speed\s+up/i
    ],
    personas: ['SeniorPerformanceOptimizer', 'SeniorVibeCalibrator'],
    priority: 9
  },

  // Security & Vulnerabilities
  {
    keywords: ['security', 'vulnerability', 'XSS', 'SQL injection', 'CVE', 'OWASP', 'audit'],
    intent_patterns: [
      /security\s+(audit|scan|check)/i,
      /vulnerability\s+analysis/i,
      /(XSS|CSRF|SQL\s+injection)/i,
      /security\s+issue/i
    ],
    personas: ['SeniorSecurityAuditor', 'SeniorQA_Security'],
    priority: 10
  },

  // Code Review & Quality
  {
    keywords: ['code review', 'refactor', 'quality', 'SOLID', 'DRY', 'clean code'],
    intent_patterns: [
      /code\s+review/i,
      /refactor/i,
      /(improve|enhance)\s+code/i,
      /clean\s+up/i,
      /code\s+quality/i
    ],
    personas: ['SeniorCodeReviewer', 'SeniorTechLead'],
    priority: 7
  },

  // Documentation
  {
    keywords: ['document', 'README', 'guide', 'API doc', 'tutorial', 'explain'],
    intent_patterns: [
      /(write|create|generate)\s+(document|README|guide)/i,
      /API\s+doc/i,
      /how\s+to\s+use/i,
      /documentation/i
    ],
    personas: ['SeniorTechnicalWriter'],
    priority: 6
  },

  // Deployment & Operations
  {
    keywords: ['deploy', 'canary', 'CI/CD', 'rollback', 'SLO', 'monitoring'],
    intent_patterns: [
      /deploy(ment)?\s+strategy/i,
      /canary\s+deploy/i,
      /(setup|configure)\s+(CI|CD)/i,
      /rollback\s+plan/i
    ],
    personas: ['SeniorOps', 'SeniorPreFlightSimulator'],
    priority: 8
  },

  // Architecture & Design
  {
    keywords: ['architecture', 'design', 'ADR', 'microservice', 'MSA', 'system design'],
    intent_patterns: [
      /system\s+design/i,
      /architect(ure)?\s+(review|design)/i,
      /(microservice|MSA)\s+architecture/i,
      /design\s+pattern/i
    ],
    personas: ['SeniorTechLead', 'SeniorBackendArchitect'],
    priority: 9
  },

  // Testing
  {
    keywords: ['test', 'unit test', 'E2E', 'coverage', 'TDD', 'integration test'],
    intent_patterns: [
      /(write|create|add)\s+test/i,
      /test\s+coverage/i,
      /(unit|integration|E2E)\s+test/i,
      /improve\s+coverage/i
    ],
    personas: ['SeniorQA_Security', 'SeniorPreFlightSimulator'],
    priority: 8
  },

  // Learning & Education
  {
    keywords: ['learn', 'teach', 'how', 'why', 'explain', 'tutorial', 'understand'],
    intent_patterns: [
      /how\s+(to|do|does)/i,
      /why\s+\w+/i,
      /learn\s+(about|how)/i,
      /teach\s+me/i,
      /explain/i
    ],
    personas: ['SeniorEducator'],
    priority: 5
  },

  // UX & Accessibility
  {
    keywords: ['UX', 'user experience', 'accessibility', 'WCAG', 'flow', 'usability'],
    intent_patterns: [
      /UX\s+(improve|design)/i,
      /accessibility\s+(check|audit)/i,
      /user\s+(flow|journey)/i,
      /WCAG/i
    ],
    personas: ['SeniorUXDesigner', 'SeniorVibeCalibrator'],
    priority: 8
  },

  // Platform Calibration
  {
    keywords: ['web', 'mobile', 'desktop', 'PWA', 'responsive', 'cross-platform'],
    intent_patterns: [
      /(web|mobile|desktop)\s+app/i,
      /PWA/i,
      /responsive\s+design/i,
      /cross-platform/i
    ],
    personas: ['SeniorVibeCalibrator', 'SeniorFrontendSpecialist'],
    priority: 7
  },

  // Pre-flight & Simulation
  {
    keywords: ['simulate', 'test run', 'dry run', 'impact', 'risk', 'preview'],
    intent_patterns: [
      /simulate/i,
      /(dry|test)\s+run/i,
      /impact\s+analysis/i,
      /what\s+if/i,
      /preview\s+change/i
    ],
    personas: ['SeniorPreFlightSimulator'],
    priority: 8
  },

  // Product Strategy
  {
    keywords: ['strategy', 'roadmap', 'KPI', 'metric', 'MVP', 'feature', 'prioritize'],
    intent_patterns: [
      /product\s+strategy/i,
      /roadmap/i,
      /KPI/i,
      /MVP/i,
      /prioritize\s+feature/i
    ],
    personas: ['ProductStrategist'],
    priority: 7
  }
];

export class AutoTriggerEngine {
  private rules: TriggerRule[];

  constructor(rules: TriggerRule[] = TRIGGER_RULES) {
    this.rules = rules;
  }

  /**
   * Select personas based on user input and emotion
   */
  selectPersonas(
    userInput: string,
    emotionVector?: ARHAEmotionVector,
    maxPersonas: number = 3
  ): TriggerResult {
    const scores = this.calculateScores(userInput, emotionVector);

    scores.sort((a, b) => b.score - a.score);

    const selectedPersonas = scores
      .slice(0, maxPersonas)
      .filter(s => s.score > 0)
      .map(s => s.persona);

    const topScore = scores[0]?.score || 0;
    const secondScore = scores[1]?.score || 0;
    const confidence = topScore > 0 ? Math.min((topScore - secondScore) / topScore, 1.0) : 0;

    const reasoning = this.generateReasoning(scores.slice(0, maxPersonas));

    return {
      selected_personas: selectedPersonas,
      scores: scores.slice(0, 5),
      reasoning,
      confidence
    };
  }

  private calculateScores(
    userInput: string,
    emotionVector?: ARHAEmotionVector
  ): TriggerScore[] {
    const inputLower = userInput.toLowerCase();
    const scoreMap = new Map<PersonaRole, TriggerScore>();

    for (const rule of this.rules) {
      const matchedKeywords: string[] = [];
      for (const keyword of rule.keywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }
      const keywordScore = matchedKeywords.length * 2;

      const matchedPatterns: string[] = [];
      for (const pattern of rule.intent_patterns) {
        if (pattern.test(userInput)) {
          matchedPatterns.push(pattern.source);
        }
      }
      const patternScore = matchedPatterns.length * 3;

      let emotionBonus = 0;
      if (emotionVector && rule.emotion_hints) {
        emotionBonus = this.calculateEmotionMatch(emotionVector, rule.emotion_hints);
      }

      const totalScore = (keywordScore + patternScore + emotionBonus) * rule.priority;

      for (const persona of rule.personas) {
        const existing = scoreMap.get(persona);
        if (existing) {
          existing.score += totalScore;
          existing.matched_keywords.push(...matchedKeywords);
          existing.matched_patterns.push(...matchedPatterns);
        } else {
          scoreMap.set(persona, {
            persona,
            score: totalScore,
            matched_keywords: matchedKeywords,
            matched_patterns: matchedPatterns
          });
        }
      }
    }

    return Array.from(scoreMap.values());
  }

  private calculateEmotionMatch(
    actual: ARHAEmotionVector,
    hint: { valence?: number; arousal?: number; intensity?: number }
  ): number {
    let match = 0;
    let count = 0;

    if (hint.valence !== undefined) {
      const valenceDiff = Math.abs(actual.valence - hint.valence);
      match += (1 - valenceDiff / 2);
      count++;
    }

    if (hint.arousal !== undefined) {
      const arousalDiff = Math.abs(actual.arousal - hint.arousal);
      match += (1 - arousalDiff);
      count++;
    }

    if (hint.intensity !== undefined) {
      const intensityDiff = Math.abs(actual.intensity - hint.intensity);
      match += (1 - intensityDiff);
      count++;
    }

    return count > 0 ? (match / count) * 2 : 0;
  }

  private generateReasoning(topScores: TriggerScore[]): string {
    if (topScores.length === 0) {
      return 'No specific personas matched. Using default approach.';
    }

    const lines: string[] = [];
    for (const score of topScores) {
      const reasons: string[] = [];
      if (score.matched_keywords.length > 0) {
        reasons.push(`keywords: ${score.matched_keywords.slice(0, 3).join(', ')}`);
      }
      if (score.matched_patterns.length > 0) {
        reasons.push(`intent patterns matched`);
      }
      lines.push(`${score.persona} (score: ${score.score.toFixed(1)}) - ${reasons.join(', ')}`);
    }
    return lines.join('\n');
  }

  addRule(rule: TriggerRule): void {
    this.rules.push(rule);
  }
}

export const autoTriggerEngine = new AutoTriggerEngine();
