import { promises as fs } from 'fs'
import path from 'path'
import { LocalSandbox } from '../brain/local-sandbox'
import { nanoid } from 'nanoid'
import { STORAGE_PATH } from '../common/system'

async function ensureStorageDirectories(): Promise<void> {
    const sandboxDir = path.join(STORAGE_PATH, 'files')
    const attachmentsDir = path.join(STORAGE_PATH, 'attachments')

    await fs.mkdir(sandboxDir, { recursive: true })
    await fs.mkdir(attachmentsDir, { recursive: true })
}

function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
        // Images
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        // Text
        'txt': 'text/plain',
        'json': 'application/json',
        'xml': 'application/xml',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        // Archives
        'zip': 'application/zip',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        // Audio/Video
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'wav': 'audio/wav',
        'webm': 'video/webm',
    }

    return contentTypes[extension || ''] || 'application/octet-stream'
}

async function uploadSandboxFileToLocal(sandbox: LocalSandbox, sandboxFilePath: string): Promise<string> {
    await ensureStorageDirectories()

    let fileContent: Uint8Array
    try {
        // Read file as bytes to handle binary files properly
        const content = await sandbox.files.read(sandboxFilePath, { format: 'bytes' })
        fileContent = content as Uint8Array
    } catch (error) {
        throw new Error(`File not found in working directory: ${sandboxFilePath}`)
    }

    const fileName = sandboxFilePath.split('/').pop() || 'file'
    const fileKey = `files/${nanoid()}/${fileName}`
    const filePath = path.join(STORAGE_PATH, fileKey)

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // Write file to local storage
    await fs.writeFile(filePath, fileContent)

    return fileKey
}

function generateDownloadUrl(fileKey: string): string {
    // Remove API_BASE_URL dependency for relative URLs to work with Fastify
    return `/v1/files/${fileKey}`
}

async function saveFileToLocal(fileName: string, fileBuffer: Buffer): Promise<string> {
    await ensureStorageDirectories()

    const fileKey = `attachments/${nanoid()}/${fileName}`
    const filePath = path.join(STORAGE_PATH, fileKey)

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // Write file to local storage
    await fs.writeFile(filePath, fileBuffer)

    return fileKey
}

async function getFileStream(fileKey: string): Promise<{ stream: Buffer; contentType: string }> {
    const filePath = path.join(STORAGE_PATH, fileKey)

    // Security: Prevent directory traversal
    const resolvedPath = path.resolve(filePath)
    const resolvedStoragePath = path.resolve(STORAGE_PATH)

    if (!resolvedPath.startsWith(resolvedStoragePath)) {
        throw new Error('Invalid file path')
    }

    try {
        const stream = await fs.readFile(filePath)
        const fileName = path.basename(fileKey)
        const contentType = getContentType(fileName)

        return { stream, contentType }
    } catch (error) {
        throw new Error('File not found')
    }
}

export const filesService = {
    async uploadAndGetPresignedUrl(sandbox: LocalSandbox, sandboxFilePath: string): Promise<string> {
        const fileKey = await uploadSandboxFileToLocal(sandbox, sandboxFilePath)
        return generateDownloadUrl(fileKey)
    },
    async generateUploadUrl(fileName: string): Promise<{ uploadUrl: string; fileKey: string; downloadUrl: string }> {
        await ensureStorageDirectories()

        const fileKey = `attachments/${nanoid()}/${fileName}`
        const uploadUrl = '/v1/sessions/attachments'
        const downloadUrl = generateDownloadUrl(fileKey)

        return {
            uploadUrl,
            fileKey,
            downloadUrl,
        }
    },
    async uploadFile(fileName: string, fileBuffer: Buffer): Promise<string> {
        const fileKey = await saveFileToLocal(fileName, fileBuffer)
        return generateDownloadUrl(fileKey)
    },
    async getFileStream(fileKey: string): Promise<{ stream: Buffer; contentType: string }> {
        return getFileStream(fileKey)
    },
}
