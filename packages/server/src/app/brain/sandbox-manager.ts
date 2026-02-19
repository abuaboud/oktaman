import { LocalSandbox } from './local-sandbox';
import { logger } from '../common/logger';
import { tryCatch } from '@oktaman/shared';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { SKILLS } from './skills';
import { WORKING_DIR } from '../common/system';


export const sandboxManager = {

    async getOrCreate(sessionId?: string | null): Promise<LocalSandbox> {
        logger.info({ sessionId }, '[SandboxManager] Getting or creating local sandbox');

        const sandbox = await LocalSandbox.create(sessionId ?? 'default');
        logger.info({ workingDir: WORKING_DIR }, '[SandboxManager] Created local sandbox');

        // Copy skills to working directory
        for (const skill of SKILLS) {
            const skillsExist = await checkSkillsExist(sandbox, skill);
            if (!skillsExist) {
                logger.info({ skill }, '[SandboxManager] Skills do not exist, copying to working directory');
                await copySkillsToSandbox(sandbox, skill);

                if (skill === 'agent-browser') {
                    const isInstalled = await checkAgentBrowserInstalled(sandbox);
                    if (!isInstalled) {
                        installAgentBrowser(sandbox).then(() => {
                            logger.info('[SandboxManager] Successfully installed agent-browser');
                        }).catch((error) => {
                            logger.error({ error }, '[SandboxManager] Failed to install agent-browser');
                        });
                    }
                }
            }
        }

        return sandbox;
    },
};


async function checkSkillsExist(sandbox: LocalSandbox, skill: string): Promise<boolean> {
    const [error] = await tryCatch(sandbox.files.read(`skills/${skill}/SKILL.md`));
    return !error;
}

async function copySkillsToSandbox(sandbox: LocalSandbox, skill: string): Promise<void> {
    const skillDir = join(__dirname, 'skills', skill);
    const sandboxSkillsPath = `skills/${skill}`;

    logger.info({ skill }, '[SandboxManager] Copying skill to working directory');

    // Read all files in the specific skill directory
    const [skillDirError, skillFiles] = await tryCatch(readdir(skillDir));
    if (skillDirError) {
        logger.warn({ skill, error: skillDirError }, '[SandboxManager] Failed to read skill directory');
        return;
    }

    // Copy each file to the working directory
    for (const file of skillFiles) {
        const filePath = join(skillDir, file);
        const [fileStatError, fileStats] = await tryCatch(stat(filePath));

        if (fileStatError || !fileStats.isFile()) {
            continue;
        }

        const [readError, content] = await tryCatch(readFile(filePath, 'utf-8'));
        if (readError) {
            logger.warn({ skill, file, error: readError }, '[SandboxManager] Failed to read skill file');
            continue;
        }

        const sandboxPath = `${sandboxSkillsPath}/${file}`;
        const [writeError] = await tryCatch(sandbox.files.write(sandboxPath, content));

        if (writeError) {
            logger.warn({ skill, file, error: writeError }, '[SandboxManager] Failed to write skill file');
        }
    }

    logger.info({ skill }, '[SandboxManager] Successfully copied skill to working directory');
}

async function checkAgentBrowserInstalled(sandbox: LocalSandbox): Promise<boolean> {
    logger.info('[SandboxManager] Checking if agent-browser is installed');

    const [error, result] = await tryCatch(
        sandbox.commands.run('which agent-browser', { timeoutMs: 10000 })
    );

    if (error || !result || result.exitCode !== 0) {
        logger.info('[SandboxManager] agent-browser is not installed');
        return false;
    }

    logger.info('[SandboxManager] agent-browser is installed');
    return true;
}

async function installAgentBrowser(sandbox: LocalSandbox): Promise<void> {
    logger.info('[SandboxManager] Installing agent-browser');

    // Install agent-browser globally
    const [npmError, npmResult] = await tryCatch(
        sandbox.commands.run('npm install -g agent-browser', { timeoutMs: 120000 })
    );

    if (npmError || !npmResult || npmResult.exitCode !== 0) {
        logger.error(
            {
                error: npmError,
                exitCode: npmResult?.exitCode,
                stderr: npmResult?.stderr
            },
            '[SandboxManager] Failed to install agent-browser via npm'
        );
        return;
    }

    logger.info('[SandboxManager] Successfully installed agent-browser via npm');

    // Run agent-browser install
    const [installError, installResult] = await tryCatch(
        sandbox.commands.run('agent-browser install', { timeoutMs: 120000 })
    );

    if (installError || !installResult || installResult.exitCode !== 0) {
        logger.warn(
            {
                error: installError,
                exitCode: installResult?.exitCode,
                stderr: installResult?.stderr
            },
            '[SandboxManager] Failed to run agent-browser install'
        );
        return;
    }

    logger.info('[SandboxManager] Successfully ran agent-browser install');
}
