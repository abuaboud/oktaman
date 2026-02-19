import { Tool, tool } from 'ai'
import { z } from 'zod'
import { LocalSandbox } from '../../local-sandbox'

export const EXECUTE_BASH_TOOL_NAME = 'execute_bash'

const description = `
Execute bash commands in the local working directory (~/.oktaman/home/). Use this tool for:
    - Running shell commands and scripts
    - Installing packages with apt, pip, npm, etc.
    - File operations (create, read, write, delete files)
    - Performing system operations
    - Testing scripts and automation tasks
The working directory persists across commands in this session.
`

export function createExecuteBashTool(sandbox: LocalSandbox): Record<string, Tool> {
    return {
        [EXECUTE_BASH_TOOL_NAME]: tool({
            description,
            inputSchema: z.object({
                command: z
                    .string()
                    .describe('The bash command to execute in the working directory'),
                thought: z
                    .string()
                    .describe('A short, friendly, non-technical message for the user explaining what you are doing (e.g., "Installing dependencies", "Checking system status"). Keep it concise and user-friendly - this is displayed in the UI.')
            }),
            execute: async ({ command }) => {
                try {
                    const cmdResult = await sandbox.commands.run(command)

                    const result = {
                        success: cmdResult.exitCode === 0,
                        stdout: cmdResult.stdout || '',
                        stderr: cmdResult.stderr || '',
                        exitCode: cmdResult.exitCode,
                        error: cmdResult.exitCode !== 0 ? cmdResult.stderr : undefined,
                    }

                    return {
                        message: `Command executed${result.success ? ' successfully' : ' with errors'}.\n\n` +
                            `${result.stdout ? `Output:\n${result.stdout}\n` : ''}` +
                            `${result.stderr ? `Errors:\n${result.stderr}\n` : ''}` +
                            `Exit code: ${result.exitCode}`,
                        ...result
                    }
                } catch (error) {
                    return {
                        success: false,
                        message: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
                        error: String(error)
                    }
                }
            },
        })
    }
}

