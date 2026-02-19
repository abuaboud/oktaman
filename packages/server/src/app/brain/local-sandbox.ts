import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { WORKING_DIR } from '../common/system';
import { logger } from '../common/logger';
import { tryCatch } from '@oktaman/shared';

const execAsync = promisify(exec);

async function ensureWorkingDirectory(): Promise<void> {
    await fs.mkdir(WORKING_DIR, { recursive: true });
}

export class LocalSandbox {
    private workingDir: string;
    private sessionId: string;

    private constructor(sessionId: string) {
        this.sessionId = sessionId;
        this.workingDir = WORKING_DIR;
    }

    static async create(sessionId?: string): Promise<LocalSandbox> {
        const id = sessionId || 'default';
        const sandbox = new LocalSandbox(id);
        await ensureWorkingDirectory();
        logger.info({ workingDir: sandbox.workingDir }, '[LocalSandbox] Created local sandbox');
        return sandbox;
    }

    static async connect(sessionId: string): Promise<LocalSandbox> {
        return LocalSandbox.create(sessionId);
    }

    get commands() {
        return {
            run: async (command: string, options?: { timeoutMs?: number }): Promise<CommandResult> => {
                const timeout = options?.timeoutMs || 120000;
                logger.info({ command, workingDir: this.workingDir }, '[LocalSandbox] Executing command');

                try {
                    const { stdout, stderr } = await execAsync(command, {
                        cwd: this.workingDir,
                        timeout,
                        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                    });

                    return {
                        stdout: stdout || '',
                        stderr: stderr || '',
                        exitCode: 0,
                    };
                } catch (error) {
                    const execError = error as { stdout?: string; stderr?: string; code?: number; killed?: boolean };

                    if (execError.killed) {
                        return {
                            stdout: execError.stdout || '',
                            stderr: `Command timed out after ${timeout}ms`,
                            exitCode: 124, // Standard timeout exit code
                        };
                    }

                    return {
                        stdout: execError.stdout || '',
                        stderr: execError.stderr || String(error),
                        exitCode: execError.code || 1,
                    };
                }
            }
        };
    }

    get files() {
        return {
            read: async (filePath: string, options?: { format?: 'text' | 'bytes' }): Promise<string | Uint8Array> => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDir, filePath);

                // Security: Prevent directory traversal outside working directory
                const resolvedPath = path.resolve(fullPath);
                const resolvedWorkingDir = path.resolve(this.workingDir);

                if (!resolvedPath.startsWith(resolvedWorkingDir) && !path.isAbsolute(filePath)) {
                    throw new Error('Access denied: Path outside working directory');
                }

                try {
                    if (options?.format === 'bytes') {
                        const buffer = await fs.readFile(fullPath);
                        return new Uint8Array(buffer);
                    }
                    return await fs.readFile(fullPath, 'utf-8');
                } catch (error) {
                    throw new Error(`Failed to read file: ${filePath}`);
                }
            },

            write: async (filePath: string, content: string | Buffer | Uint8Array): Promise<void> => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDir, filePath);

                // Ensure directory exists
                await fs.mkdir(path.dirname(fullPath), { recursive: true });

                if (content instanceof Uint8Array) {
                    await fs.writeFile(fullPath, Buffer.from(content));
                } else {
                    await fs.writeFile(fullPath, content);
                }
            },

            exists: async (filePath: string): Promise<boolean> => {
                const fullPath = path.join(this.workingDir, filePath);
                const [error] = await tryCatch(fs.access(fullPath));
                return !error;
            },

            list: async (dirPath: string): Promise<FileInfo[]> => {
                const fullPath = path.join(this.workingDir, dirPath);
                const [error, files] = await tryCatch(fs.readdir(fullPath, { withFileTypes: true }));

                if (error) {
                    throw new Error(`Failed to list directory: ${dirPath}`);
                }

                return files.map(file => ({
                    name: file.name,
                    path: path.join(dirPath, file.name),
                    isDir: file.isDirectory(),
                }));
            },

            remove: async (filePath: string): Promise<void> => {
                const fullPath = path.join(this.workingDir, filePath);
                await fs.rm(fullPath, { recursive: true, force: true });
            }
        };
    }

    // Compatibility methods for e2b interface
    setTimeout(_timeoutMs: number): void {
        // No-op for local sandbox - no timeout needed
    }

    get sandboxId(): string {
        return this.sessionId;
    }
}

type CommandResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
}

type FileInfo = {
    name: string;
    path: string;
    isDir: boolean;
}
