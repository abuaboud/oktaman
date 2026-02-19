import { readFile, copyFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { tryCatch } from '@oktaman/shared';
import { WORKING_DIR } from '../../common/system';

const PROMPT_FILES = ['SOUL.MD', 'USER.MD', 'AGENT.MD'] as const;

const DEFAULTS_DIR = join(__dirname, 'defaults');

/**
 * Load the three prompt files from ~/.oktaman/home/.
 * Copies defaults from source on first run if files don't exist.
 */
export async function loadPromptFiles(): Promise<PromptFiles> {
    await ensureDefaults();

    const [soulContent, userContent, agentContent] = await Promise.all(
        PROMPT_FILES.map(file => readPromptFile(file))
    );

    return {
        soul: soulContent,
        user: userContent,
        agent: agentContent,
    };
}

async function ensureDefaults(): Promise<void> {
    await tryCatch(mkdir(WORKING_DIR, { recursive: true }));

    for (const file of PROMPT_FILES) {
        const targetPath = join(WORKING_DIR, file);
        const [accessError] = await tryCatch(access(targetPath));
        if (accessError) {
            const sourcePath = join(DEFAULTS_DIR, file);
            await tryCatch(copyFile(sourcePath, targetPath));
        }
    }
}

async function readPromptFile(file: string): Promise<string> {
    const filePath = join(WORKING_DIR, file);
    const [error, content] = await tryCatch(readFile(filePath, 'utf-8'));
    if (error) {
        return '';
    }
    return content;
}

type PromptFiles = {
    soul: string;
    user: string;
    agent: string;
}
