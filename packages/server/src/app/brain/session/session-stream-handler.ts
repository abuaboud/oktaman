import { AgentStreamingUpdate, AgentStreamingEvent, conversationUtils, Session, ConversationMessage } from "@oktaman/shared";
import { websocketService } from "../../core/websockets";
import { sessionService } from "./session.service";
import { logger } from "../../common/logger";


export const sessionStreamHandler = {

    handleUpdate: async (params: {
        update: AgentStreamingUpdate;
        session: Session;
    }): Promise<Session> => {
        const { update, session } = params;

        let newConversation: ConversationMessage[] = session.conversation;
        let updatedSession: Session = session;

        // Handle different update types and save to DB first
        switch (update.event) {
            case AgentStreamingEvent.AGENT_STREAMING_UPDATE: {
                // Update the conversation with the streaming chunk
                let currentNumberOfParts = newConversation.length;
                newConversation = conversationUtils.streamChunk(newConversation, update.data);

                let newNumberOfParts = newConversation.length;

                // Only persist to database for significant updates (tool-call completions or new parts)
                if (newNumberOfParts > currentNumberOfParts || update.data.part?.type === 'tool-call') {

                    updatedSession = await sessionService.update({
                        id: session.id,
                        conversation: newConversation,
                        cost: update.data.cost,
                    });
                } else {
                    updatedSession = { ...session, conversation: newConversation };
                }
                break;
            }

            case AgentStreamingEvent.AGENT_SESSION_UPDATE: {
                updatedSession = await sessionService.update({
                    id: session.id,
                    status: update.data.status,
                    conversation: newConversation,
                    isStreaming: update.data.isStreaming,
                    usage: update.data.usage,
                    cost: update.data.cost,
                });
                break;
            }

            case AgentStreamingEvent.AGENT_COMPACTION: {
                // Handle compaction: update session conversation and create new conversation for AI
                const compaction = update.data.compaction;

                // Create new conversation with just the compaction summary for AI messages
                newConversation = conversationUtils.addUserMessage({
                    conversation: [],
                    message: compaction.summary,
                });

                // Add compaction message to session conversation for history
                newConversation = conversationUtils.addCompactionMessage(
                    newConversation,
                    compaction
                );

                // Persist immediately
                updatedSession = await sessionService.update({
                    id: session.id,
                    conversation: newConversation,
                });
                break;
            }

            default: {
                logger.warn({ event: update.event }, '[SessionStreamHandler] Unknown event type');
                updatedSession = { ...session, conversation: newConversation };
            }
        }

        const io = websocketService.getIo();
        io.to('main-user').emit(update.event, update);

        return updatedSession;
    },


};



