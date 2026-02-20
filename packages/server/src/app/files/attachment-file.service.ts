import { promises as fs } from 'fs'
import path from 'path'
import { WORKING_DIR } from '../common/system'

function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
    }
    return contentTypes[extension || ''] || 'application/octet-stream'
}

export const attachmentFileService = {
    resolveAndValidate(filePath: string): AttachmentValidationResult {
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(WORKING_DIR, filePath)
        const resolvedWorkingDir = path.resolve(WORKING_DIR)

        console.log('Resolving file path:', resolvedPath)
        if (!resolvedPath.startsWith(resolvedWorkingDir)) {
            return { valid: false, error: 'Path is outside the working directory', resolvedPath }
        }

        return { valid: true, resolvedPath }
    },

    async getFileStream(resolvedPath: string): Promise<{ stream: Buffer; contentType: string }> {
        const stream = await fs.readFile(resolvedPath)
        const fileName = path.basename(resolvedPath)
        const contentType = getContentType(fileName)

        return { stream, contentType }
    },
}

type AttachmentValidationResult = {
    valid: boolean
    error?: string
    resolvedPath: string
}
