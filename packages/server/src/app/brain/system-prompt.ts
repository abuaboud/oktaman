import { readFileSync } from 'fs';
import { join } from 'path';
import { Session, isNil } from '@oktaman/shared';
import { skillsLoader, buildSkillsPrompt } from './skills';
import { loadPromptFiles } from './prompts/prompt-loader';
import { ToolName } from './tool-constructor';
import { WORKING_DIR } from '../common/system';

const TOOL_PROMPTS: Record<string, string> = {
    [ToolName.EXECUTE_BASH]: loadPrompt('./tools/execute-bash/tool.md'),
    [ToolName.DISPLAY_ATTACHMENTS]: loadPrompt('./tools/display-attachments/tool.md'),
    [ToolName.ASK_QUESTION]: loadPrompt('./tools/ask-question/tool.md'),
    [ToolName.CREATE_AGENT]: loadPrompt('./tools/agent/tool.md'),
    [ToolName.LIST_COMPOSIO_TRIGGERS]: loadPrompt('./tools/agent/composio-tool.md'),
    [ToolName.MEMORY_STORE]: loadPrompt('./tools/memory/tool.md'),
    [ToolName.WRITE_TODOS]: loadPrompt('./tools/planning/tool.md'),
};

const AGENT_CONTEXT_PROMPT_TEMPLATE = loadPrompt('./tools/agent/agent-prompt.md');

// Tools that share a prompt section — if one is included, the section is included
const TOOL_PROMPT_ALIASES: Record<string, string> = {
    [ToolName.UPDATE_AGENT]: ToolName.CREATE_AGENT,
    [ToolName.LIST_AGENTS]: ToolName.CREATE_AGENT,
    [ToolName.MEMORY_SEARCH]: ToolName.MEMORY_STORE,
    [ToolName.MEMORY_FORGET]: ToolName.MEMORY_STORE,
    [ToolName.READ_TODOS]: ToolName.WRITE_TODOS,
};

export async function buildMainSystemPrompt(options: MainSystemPromptOptions): Promise<string> {
    const { agentContext, session, excludedTools = [] } = options;

    // Load user-editable prompt files from ~/.oktaman/home/
    const promptFiles = await loadPromptFiles();

    // Build location context if available
    const locationPrompt = buildLocationPrompt(session);

    // Load available skills (absolute paths in ~/.oktaman/home/skills)
    const skills = await skillsLoader.list();
    const skillsPrompt = buildSkillsPrompt(skills);

    // Inject agent context if available
    const agentContextPrompt = agentContext
        ? injectTemplate(AGENT_CONTEXT_PROMPT_TEMPLATE, {
            id: agentContext.id,
            name: agentContext.name,
            description: agentContext.description,
        })
        : '';

    // Build tool instructions, excluding tools not available in this session
    const toolSections = buildToolSections(excludedTools);

    const soulPath = join(WORKING_DIR, 'SOUL.MD');
    const userPath = join(WORKING_DIR, 'USER.MD');
    const agentPath = join(WORKING_DIR, 'AGENT.MD');

    return `
${promptFiles.soul}
(Editable at ${soulPath})
Today's date is ${new Date().toISOString().split('T')[0]}.
${locationPrompt}

${promptFiles.user}
(Editable at ${userPath})

${promptFiles.agent}
(Editable at ${agentPath})

${agentContextPrompt}

${toolSections}

${skillsPrompt ? `\n\n${skillsPrompt}` : ''}
`.trim();

}

function buildToolSections(excludedTools: ToolName[]): string {
    const includedSections = new Set<string>();

    for (const [toolName, prompt] of Object.entries(TOOL_PROMPTS)) {
        // Check if this tool or any alias pointing to it is not excluded
        const aliasedTools = Object.entries(TOOL_PROMPT_ALIASES)
            .filter(([, target]) => target === toolName)
            .map(([alias]) => alias);

        const allToolsInGroup = [toolName, ...aliasedTools];
        const anyIncluded = allToolsInGroup.some(t => !excludedTools.includes(t as ToolName));

        if (anyIncluded) {
            includedSections.add(prompt);
        }
    }

    return Array.from(includedSections).join('\n\n---\n\n');
}

function loadPrompt(relativePath: string): string {
    const fullPath = join(__dirname, relativePath);
    return readFileSync(fullPath, 'utf-8');
}

function injectTemplate(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

function buildLocationPrompt(session?: Session): string {
    if (!session || isNil(session.location)) {
        return '';
    }

    const parts: string[] = [];

    if (session.location.city) {
        parts.push(session.location.city);
    }
    if (session.location.region) {
        parts.push(session.location.region);
    }
    if (session.location.country) {
        parts.push(session.location.country);
    }

    const locationString = parts.length > 0 ? parts.join(', ') : null;
    const timezoneString = session.location.timezone || null;

    if (!locationString && !timezoneString) {
        return '';
    }

    const locationInfo = locationString ? `The user is located in ${locationString}.` : '';
    const timezoneInfo = timezoneString ? `The user's timezone is ${timezoneString}.` : '';

    return `${locationInfo}${locationInfo && timezoneInfo ? ' ' : ''}${timezoneInfo}`;
}

type MainSystemPromptOptions = {
    session: Session;
    excludedTools?: ToolName[];
    agentContext?: {
        id: string;
        name: string;
        description: string;
    };
}
