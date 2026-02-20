import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Session, isNil } from '@oktaman/shared';
import { skillsLoader, buildSkillsPrompt } from './skills';
import { loadPromptFiles } from './prompts/prompt-loader';
import { ToolName } from './tool-constructor';
import { WORKING_DIR } from '../common/system';

// Each group maps a shared prompt to the tools that use it.
// The prompt section is included if any tool in the group is not excluded.
const TOOL_PROMPT_GROUPS: ToolPromptGroup[] = [
    {
        prompt: loadPrompt('./tools/execute-bash/tool.md'),
        tools: [ToolName.EXECUTE_BASH],
    },
    {
        prompt: loadPrompt('./tools/ask-question/tool.md'),
        tools: [ToolName.ASK_QUESTION],
    },
    {
        prompt: loadPrompt('./tools/agent/tool.md'),
        tools: [ToolName.CREATE_AGENT, ToolName.UPDATE_AGENT, ToolName.LIST_AGENTS],
    },
    {
        prompt: loadPrompt('./tools/agent/composio-tool.md'),
        tools: [ToolName.LIST_COMPOSIO_TRIGGERS],
    },
    {
        prompt: loadPrompt('./tools/memory/tool.md'),
        tools: [ToolName.MEMORY_STORE, ToolName.MEMORY_SEARCH, ToolName.MEMORY_FORGET],
    },
    {
        prompt: loadPrompt('./tools/planning/tool.md'),
        tools: [ToolName.WRITE_TODOS, ToolName.READ_TODOS],
    },
    {
        prompt: loadPrompt('./tools/firecrawl/tool.md'),
        tools: [ToolName.FIRECRAWL_SEARCH, ToolName.FIRECRAWL_SCRAPE, ToolName.FIRECRAWL_CRAWL, ToolName.FIRECRAWL_BATCH_SCRAPE, ToolName.FIRECRAWL_EXTRACT],
    },
];

const AGENT_CONTEXT_PROMPT_TEMPLATE = loadPrompt('./tools/agent/agent-prompt.md');

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

    const attachmentsDir = resolve(WORKING_DIR, 'attachments');
    const agentPrompt = injectTemplate(promptFiles.agent, { attachmentsDir });

    return `
${promptFiles.soul}
(Editable at ${soulPath})
Today's date is ${new Date().toISOString().split('T')[0]}.
${locationPrompt}

${promptFiles.user}
(Editable at ${userPath})

${agentPrompt}
(Editable at ${agentPath})

${agentContextPrompt}

${toolSections}

${skillsPrompt ? `\n\n${skillsPrompt}` : ''}
`.trim();

}

function buildToolSections(excludedTools: ToolName[]): string {
    return TOOL_PROMPT_GROUPS
        .filter(group => group.tools.some(t => !excludedTools.includes(t)))
        .map(group => group.prompt)
        .join('\n\n---\n\n');
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

type ToolPromptGroup = {
    prompt: string;
    tools: ToolName[];
}
