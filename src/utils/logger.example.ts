// Logger Usage Examples - Demonstrating Label-like Functionality

import { log, createLogger, logTiming, logBatch } from './logger.js';

/**
 * Example 1: Basic logging (similar to #VIBE label system)
 */
export function example1_BasicLogging() {
  console.log('\n=== Example 1: Basic Logging ===\n');

  // Like: log("#VIBE/api/gateway:Request@v1.0", "INFO", "Processing", {...})
  log('C-007', 'INFO', 'Processing API request', {
    method: 'POST',
    path: '/api/login',
    ip: '192.168.1.100'
  });

  log('C-007', 'WARN', 'Slow response detected', {
    duration: 2500,
    threshold: 1000
  });

  log('C-007', 'ERROR', 'API request failed', {
    error: 'Authentication failed',
    userId: 'user123'
  });
}

/**
 * Example 2: Container-specific logger (cleaner syntax)
 */
export function example2_ContainerLogger() {
  console.log('\n=== Example 2: Container Logger ===\n');

  // Create a logger for C-008 Vibe Compliance
  const logger = createLogger('C-008');

  logger.info('Validation started', {
    targetPath: './src/api/auth.ts',
    analysisDepth: 'CORE'
  });

  logger.warn('Low test coverage detected', {
    coverage: 45,
    threshold: 70
  });

  logger.info('Validation completed', {
    overallScore: 0.78,
    issues: 5,
    recommendations: 12
  });
}

/**
 * Example 3: Performance timing
 */
export function example3_PerformanceTiming() {
  console.log('\n=== Example 3: Performance Timing ===\n');

  const timer = logTiming('C-008', 'Code validation pipeline');

  // Simulate work
  // ... validation logic ...

  timer.end({
    stages: 5,
    issues: 3,
    overallScore: 0.85
  });
}

/**
 * Example 4: Batch logging (validation summary)
 */
export function example4_BatchLogging() {
  console.log('\n=== Example 4: Batch Logging ===\n');

  logBatch('C-008', [
    {
      level: 'INFO',
      message: 'Stage 1: SPECIFICATION',
      metadata: { status: 'pass', score: 0.90, timeMs: 5 }
    },
    {
      level: 'WARN',
      message: 'Stage 2: CODE_QUALITY',
      metadata: { status: 'warning', score: 0.75, issues: 3 }
    },
    {
      level: 'INFO',
      message: 'Stage 3: TEST_SCAFFOLDING',
      metadata: { status: 'pass', score: 0.80, generated: 3 }
    },
    {
      level: 'INFO',
      message: 'Stage 4: PERFORMANCE_BUDGET',
      metadata: { status: 'pass', score: 0.85, timeMs: 30 }
    },
    {
      level: 'WARN',
      message: 'Stage 5: DEPLOYMENT',
      metadata: { status: 'warning', score: 0.70, securityIssues: 2 }
    }
  ]);
}

/**
 * Example 5: Real-world scenario - API Gateway request flow
 */
export async function example5_RealWorldScenario() {
  console.log('\n=== Example 5: Real-world API Gateway Flow ===\n');

  const logger = createLogger('C-007');

  // 1. Request received
  logger.info('Request received', {
    requestId: 'req_abc123',
    method: 'POST',
    path: '/api/users',
    ip: '192.168.1.100'
  });

  // 2. Validation
  const validationTimer = logTiming('C-007', 'Request validation');
  // ... validation logic ...
  validationTimer.end({ valid: true });

  // 3. Claude API call
  logger.info('Calling Claude API', {
    model: 'claude-sonnet-4.5',
    mode: 'direct'
  });

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));

  // 4. Response
  logger.info('Request completed', {
    requestId: 'req_abc123',
    statusCode: 200,
    durationMs: 150
  });
}

/**
 * Example 6: Error tracking (like #VIBE label error tracking)
 */
export function example6_ErrorTracking() {
  console.log('\n=== Example 6: Error Tracking ===\n');

  const logger = createLogger('C-003');

  try {
    // Simulate error
    throw new Error('Agent execution timeout');
  } catch (error) {
    logger.error('Agent execution failed', {
      agentType: 'HiSol-Protector',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined,
      retryCount: 3,
      maxRetries: 3
    });

    // Now you can grep logs:
    // grep "[C-003" logs/*.log
    // And immediately find all agent-related errors!
  }
}

/**
 * Example 7: Multi-container workflow (demonstrating traceability)
 */
export async function example7_MultiContainerWorkflow() {
  console.log('\n=== Example 7: Multi-container Workflow ===\n');

  const requestId = 'req_xyz789';

  // C-007: API Gateway receives request
  log('C-007', 'INFO', 'Request received', {
    requestId,
    tool: 'hisol_vibe_compliance'
  });

  // C-008: Vibe Compliance processes
  log('C-008', 'INFO', 'Starting validation', {
    requestId,
    targetPath: './src/api/users.ts'
  });

  // C-008: Validation stages
  log('C-008', 'INFO', 'SPECIFICATION stage complete', {
    requestId,
    score: 0.90
  });

  log('C-008', 'WARN', 'CODE_QUALITY stage has issues', {
    requestId,
    score: 0.75,
    issues: ['Async without try-catch', 'Null access detected']
  });

  // C-007: Return response
  log('C-007', 'INFO', 'Response sent', {
    requestId,
    statusCode: 200,
    totalDurationMs: 200
  });

  // Now grep by requestId to trace entire flow:
  // grep "req_xyz789" logs/*.log
  // Shows all containers involved!
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  example1_BasicLogging();
  example2_ContainerLogger();
  example3_PerformanceTiming();
  example4_BatchLogging();
  await example5_RealWorldScenario();
  example6_ErrorTracking();
  await example7_MultiContainerWorkflow();

  console.log('\n=== All Examples Complete ===\n');
  console.log('💡 Grep examples:');
  console.log('  grep "[C-007" logs/*.log           # All API Gateway logs');
  console.log('  grep "[C-008" logs/*.log           # All Vibe Compliance logs');
  console.log('  grep "ERROR" logs/*.log            # All errors across containers');
  console.log('  grep "req_xyz789" logs/*.log       # Trace specific request');
  console.log('  grep -E "\\[C-00[78]\\]" logs/*.log  # C-007 and C-008 only');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
