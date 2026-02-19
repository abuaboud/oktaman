import { Tool, tool } from 'ai'
import { z } from 'zod'
import { LocalSandbox } from '../../local-sandbox'
import { filesService } from '../../../files/files.service'

export const DISPLAY_ATTACHMENTS_TOOL_NAME = 'display_attachments'

const description = `
Display attachments to the user by providing either:
1. A URL to an external resource (image, document, etc.)
2. A file path inside the working directory (e.g., output.png or path/to/file.pdf)

`

export function createDisplayAttachmentsTool(sandbox: LocalSandbox) {
    return {
        [DISPLAY_ATTACHMENTS_TOOL_NAME]: (tool as any)({
            description,
            inputSchema: z.object({
                items: z.array(z.object({
                    attachment: z.string().describe('URL or working directory file path'),
                    description: z.string().optional().describe('Optional description'),
                })),
            }),
            execute: async ({ items }: { items: { attachment: string; description?: string }[] }) => {
                const results = await Promise.all(items.map(async ({ attachment }) => {
                    const isUrl = attachment.startsWith('http://') || attachment.startsWith('https://')
                    if (isUrl) {
                        return {
                            name: attachment.split('/').pop() || 'attachment',
                            link: attachment,
                            type: 'url'
                        }
                    } else {
                        const presignedUrl = await filesService.uploadAndGetPresignedUrl(sandbox, attachment)
                        return {
                            name: attachment.split('/').pop() || 'file',
                            link: presignedUrl,
                            type: 'file'
                        }
                    }
                }))
                return { attachments: results }
            }
        }) as Tool
    }
}

