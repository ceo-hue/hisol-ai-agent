// Prompt Engineering System
// Builds dynamic prompts for each persona

import { PersonaRole, ContextLayer, PromptTemplate } from '../core/types.js';
import { getPersonaDefinition } from '../personas/definitions.js';

export class PromptBuilder {
  buildPrompt(persona: PersonaRole, action: string, context: ContextLayer, userIntent: string): string {
    const def = getPersonaDefinition(persona);

    const sections: string[] = [];

    // Role
    sections.push(`# Role: ${def.name}\n**Mission:** ${def.mission}\n**Coverage:** ${def.coverage.join(', ')}`);

    // Context
    const proj = context.project_context;
    sections.push(`\n# Context\n**Project:** ${proj.project_type}\n**Frameworks:** ${proj.frameworks.join(', ') || 'None'}\n**Task:** ${context.conversation_context.current_task || userIntent}`);

    // Mindset
    sections.push(`\n# Mindset\n${def.mindset.map(m => `- ${m}`).join('\n')}`);

    // Guardrails
    sections.push(`\n# Guardrails\n${def.guardrails.map(g => `- ${g}`).join('\n')}`);

    // Task
    sections.push(`\n# Your Task\n**Action:** ${action}\n**User Intent:** ${userIntent}`);

    return sections.join('\n');
  }
}

export const promptBuilder = new PromptBuilder();
