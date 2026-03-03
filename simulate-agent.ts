import { HiSolUnifiedMCPServer } from './src/server.js';
import { OrchestrationAgent } from './src/agents/C-005_OrchestrationAgent.js';
import { MemoryAgent } from './src/agents/C-006_MemoryAgent.js';

async function runSimulation() {
  console.log('?? HiSol Agent Simulation Starting...');
  
  const memoryAgent = new MemoryAgent('./test_data');
  const orchestrator = new OrchestrationAgent(memoryAgent);

  console.log('\n--- Scenario 1: Value Learning ---');
  const req1 = { userInput: '이 프로젝트는 보안이 최우선이고, 성능 최적화에 신경을 많이 써야 해.' };
  const res1 = await orchestrator.orchestrateContainers(req1);
  console.log('Result 1 (Quality):', res1.qualityGrade);

  console.log('\n--- Scenario 2: Value-Driven Recall & Refinement ---');
  const req2 = { userInput: '새로운 로그인 API 설계를 제안해줘.' };
  const res2 = await orchestrator.orchestrateContainers(req2);
  console.log('Recall Narrative:', res2.orchestrationResult.valueNarrative);
  console.log('Quality Grade:', res2.qualityGrade);

  console.log('\n--- Scenario 3: FileSystem Tool Execution ---');
  // Orchestrator initialization logic normally registers C-004
  // We'll simulate the CommandAgent behavior directly
  const { CommandAgent } = await import('./src/agents/C-004_CommandAgent.js');
  const commandAgent = new CommandAgent();
  const fsRes = await commandAgent.executeCommand({
    userIntent: 'Read package.json',
    commandType: 'hisol_filesystem',
    parameters: { action: 'read', path: 'package.json' }
  });
  console.log('File Read Success:', fsRes.success !== false);
  console.log('Content Preview:', fsRes.executionResult.result.substring(0, 100) + '...');

  console.log('\n? Simulation Completed successfully.');
}

runSimulation().catch(console.error);
