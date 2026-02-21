import { Session, SessionMetadata, ChatWithOktaManRequest, conversationUtils, CreateSessionRequest, CreateSessionRequestBody, ListSessionsRequest, UpdateSessionRequest, isNil } from "@oktaman/shared";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { sessionService } from "./session.service";
import { z } from "zod";
import { filesService } from "../../files/files.service";
import { sessionManager } from "../../core/session-manager/session-manager.service";
import { logger } from "../../common/logger";
import { ipExtractor } from "../../common/ip-extractor";

export const sessionController: FastifyPluginAsyncZod = async (app) => {

    app.post('/', CreateSessionRequestConfig, async (request) => {
        const ip = ipExtractor.extractIp(request);
        return sessionService.create({
            userMessage: request.body.userMessage,
            modelId: request.body.modelId,
            userId: 'main-user',
            source: request.body.source,
            agentId: request.body.agentId,
            ip,
        });
    });

    app.get('/', ListSessionsRequestConfig, async (request) => {
        return sessionService.list();
    });

    app.get('/:id', GetSessionRequestConfig, async (request) => {
        return sessionService.getOneOrThrow({ id: request.params.id });
    });

    app.delete('/:id', DeleteSessionRequestConfig, async (request) => {
        return sessionService.delete({
            id: request.params.id,
        });
    });

    app.patch('/:id', UpdateSessionRequestConfig, async (request) => {
        return sessionService.update({
            id: request.params.id,
            status: request.body.status,
        });
    });

    app.post('/:id/stop', StopSessionRequestConfig, async (request) => {
        const sessionId = request.params.id;
        const wasStopped = await sessionManager.stopSession(sessionId);

        logger.info({
            sessionId,
            stopped: wasStopped
        }, '[SessionController] Stop request processed');

        return { success: true, stopped: wasStopped };
    });

    app.post('/attachments', async (request, reply) => {
        try {
            const data = await request.file()

            if (!data) {
                return reply.code(400).send({ error: 'No file uploaded' })
            }

            const buffer = await data.toBuffer()
            const fileName = data.filename
            const downloadUrl = await filesService.uploadFile(fileName, buffer)

            return {
                downloadUrl,
                fileName,
            }
        } catch (error) {
            logger.error({ error }, 'Failed to upload file')
            return reply.code(500).send({ error: 'Failed to upload file' })
        }
    });

    app.post('/:id/chat', ChatWithOktaManRequestConfig, async (request, reply) => {
        const session = await sessionService.getOneOrThrow({ id: request.params.id });

        // Fetch content for text-based files and convert images to data URLs
        const filesWithContent = await Promise.all(
            request.body.files.map(async (file) => {
                const isTextFile = file.type.startsWith('text/') ||
                    file.type === 'application/json' ||
                    file.type === 'application/javascript' ||
                    file.type === 'application/xml';
                const isImageFile = file.type.startsWith('image/');

                if (isTextFile) {
                    try {
                        const response = await fetch(file.url);
                        const content = await response.text();
                        return { ...file, content };
                    } catch (error) {
                        console.error(`Failed to fetch file content for ${file.name}:`, error);
                        return file;
                    }
                }

                // Convert relative image URLs to data URLs
                if (isImageFile && file.url.startsWith('/v1/files/')) {
                    try {
                        const fileKey = file.url.replace('/v1/files/', '');
                        const { stream, contentType } = await filesService.getFileStream(fileKey);
                        const base64 = stream.toString('base64');
                        const dataUrl = `data:${contentType};base64,${base64}`;
                        return { ...file, url: dataUrl };
                    } catch (error) {
                        console.error(`Failed to convert image to data URL for ${file.name}:`, error);
                        return file;
                    }
                }

                return file;
            })
        );

        // Handle question answers if provided
        if (!isNil(request.body.toolOutput)) {
            session.conversation = conversationUtils.updateToolOutput(
                session.conversation,
                request.body.toolOutput
            );
        } else {
            // Add user message to conversation (can be empty for question-only responses)
            session.conversation = conversationUtils.addUserMessage({
                conversation: session.conversation,
                message: request.body.message,
                files: filesWithContent,
            });
        }



        await sessionService.update({
            id: session.id,
            conversation: session.conversation,
            isStreaming: true,
            modelId: request.body.modelId || session.modelId,
        });

        // Process chat asynchronously (fire and forget)
        sessionManager.enqueueChatProcessing({
            sessionId: session.id,
            sessionSource: session.source,
        }).catch((error) => {
            logger.error({ sessionId: session.id, error }, 'Failed to process chat job asynchronously');
        });

        // Return success immediately
        reply.send({ success: true });

    });

};

const CreateSessionRequestConfig = {
    schema: {
        body: CreateSessionRequestBody,
    }
};

const ChatWithOktaManRequestConfig = {
    schema: {
        params: z.object({
            id: z.string()
        }),
        body: ChatWithOktaManRequest,
    }
};

const DeleteSessionRequestConfig = {
    schema: {
        params: z.object({
            id: z.string()
        })
    }
};

const UpdateSessionRequestConfig = {
    schema: {
        params: z.object({
            id: z.string()
        }),
        body: UpdateSessionRequest,
    }
};

const GetSessionRequestConfig = {
    schema: {
        params: z.object({
            id: z.string()
        }),
    }
};

const ListSessionsRequestConfig = {
    schema: {
        querystring: ListSessionsRequest,
    }
};

const UploadAttachmentRequestConfig = {
    schema: {
        body: z.object({
            fileName: z.string(),
        }),
    }
};

const StopSessionRequestConfig = {
    schema: {
        params: z.object({
            id: z.string()
        }),
    }
};

