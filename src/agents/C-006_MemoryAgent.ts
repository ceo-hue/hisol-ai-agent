import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';
import { ValueChain, ValueNode, ValueDecisionContext } from '../types/value-chain.js';

/**
 * C-006: MemoryAgent (Value Chain Engine)
 * 
 * Responsibility: Build and maintain user value chain for consistent decision-making
 * Mechanism: Frequency/Weight Accumulation + Narrative Value Recall
 */
export class MemoryAgent {
  private readonly logger = createLogger('C-006');
  private chainFilePath: string;
  private valueChain: ValueChain = { nodes: {}, version: '1.0' };

  constructor(storageDir: string = './data') {
    this.chainFilePath = path.join(storageDir, 'value_chain.json');
    this.initializeChain(storageDir);
  }

  private async initializeChain(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
      const exists = await fs.access(this.chainFilePath).then(() => true).catch(() => false);
      if (exists) {
        const data = await fs.readFile(this.chainFilePath, 'utf-8');
        this.valueChain = JSON.parse(data);
        this.logger.info('Value Chain loaded', { nodeCount: Object.keys(this.valueChain.nodes).length });
      }
    } catch (error) {
      this.logger.error('Failed to load Value Chain', { error });
    }
  }

  async accumulateValue(terms: string[], importanceBoost: number = 0): Promise<void> {
    const timestamp = Date.now();

    terms.forEach(term => {
      if (!this.valueChain.nodes[term]) {
        this.valueChain.nodes[term] = {
          term,
          frequency: 1,
          importance: 0.1 + importanceBoost,
          lastSeen: timestamp,
          associations: {}
        };
      } else {
        const node = this.valueChain.nodes[term];
        node.frequency += 1;
        node.importance = Math.min(1.0, node.importance + 0.05 + importanceBoost);
        node.lastSeen = timestamp;
      }

      terms.forEach(other => {
        if (term !== other) {
          const node = this.valueChain.nodes[term];
          node.associations[other] = (node.associations[other] || 0) + 1;
        }
      });
    });

    await this.saveToFile();
    this.logger.info('Value Chain updated', { updatedTerms: terms });
  }

  async getValueDecision(query: string): Promise<ValueDecisionContext> {
    const nodes = Object.values(this.valueChain.nodes);
    
    const sorted = nodes.sort((a, b) => (b.frequency * b.importance) - (a.frequency * a.importance));
    const topValues = sorted.slice(0, 3).map(n => n.term);

    let narrative = '';
    if (topValues.length > 0) {
      narrative = \사용자님께서는 그동안 \ 등의 가치를 가장 중요하게 여기셨습니다. \;
      
      const primary = this.valueChain.nodes[topValues[0]];
      const strongLink = Object.entries(primary.associations)
        .sort(([, a], [, b]) => b - a)[0];
        
      if (strongLink && strongLink[1] > 3) {
        narrative += \특히 \와(과) \을(를) 사슬처럼 연결하여 통합적으로 접근하시는 경향이 뚜렷합니다.\;
      }
    } else {
      narrative = "아직 축적된 가치 데이터가 부족하지만, 이번 대화를 통해 새로운 가치 지도를 그려 나가겠습니다.";
    }

    return {
      primaryValues: topValues,
      narrative
    };
  }

  private async saveToFile(): Promise<void> {
    try {
      await fs.writeFile(this.chainFilePath, JSON.stringify(this.valueChain, null, 2));
    } catch (error) {
      this.logger.error('Failed to save Value Chain', { error });
    }
  }
}
