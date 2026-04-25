// Context Management System
// Tracks project, conversation, and technical context

import { ContextLayer, ProjectContext, ConversationContext, TechnicalContext } from '../core/types.js';

export class ContextManager {
  private context: ContextLayer;

  constructor() {
    this.context = {
      project_context: {
        project_type: 'web',
        frameworks: [],
        languages: [],
        coding_standards: []
      },
      conversation_context: {
        session_id: `session_${Date.now()}`,
        turn_number: 0,
        history: [],
        current_task: ''
      },
      technical_context: {}
    };
  }

  getContext(): ContextLayer {
    return this.context;
  }

  updateProject(updates: Partial<ProjectContext>): void {
    this.context.project_context = { ...this.context.project_context, ...updates };
  }

  addTurn(role: string, content: string): void {
    this.context.conversation_context.history.push({ role, content });
    this.context.conversation_context.turn_number++;

    if (this.context.conversation_context.history.length > 10) {
      this.context.conversation_context.history =
        this.context.conversation_context.history.slice(-10);
    }
  }

  setTask(task: string): void {
    this.context.conversation_context.current_task = task;
  }

  updateTechnical(updates: Partial<TechnicalContext>): void {
    this.context.technical_context = { ...this.context.technical_context, ...updates };
  }

  extractHints(userInput: string): void {
    // Detect project type
    if (/React/i.test(userInput)) {
      this.context.project_context.frameworks.push('React');
    }
    if (/Next\.js/i.test(userInput)) {
      this.context.project_context.frameworks.push('Next.js');
    }
    if (/Vue/i.test(userInput)) {
      this.context.project_context.frameworks.push('Vue');
    }
  }
}

export const contextManager = new ContextManager();
