import { AgentSessionStatus, ConversationMessage, ProviderConfig, SessionSource } from "@oktaman/shared";
import { generateObject } from "ai";
import { logger } from "../../common/logger";
import { z } from "zod";
import { settingsService } from "../../settings/settings.service";
import { createModel } from "../../settings/providers";

const SYSTEM_PROMPT = `You are a session status analyzer.

Your job is to determine if a conversation session should be marked as "closed" or "needs_you" based on the last exchange.

Analyze the last user message and assistant response to determine the session status:

**Default to "closed" unless there's an explicit need for user input.**

**Set to "closed" when:**
- All requested tasks are completed
- The assistant has finished its work
- The conversation has reached a natural conclusion
- The assistant has provided results, analysis, or completed actions
- The assistant is simply waiting for potential follow-up (but hasn't asked for anything specific)

**Set to "needs_you" ONLY when:**
- The assistant explicitly asked a direct question that requires an answer
- The assistant is blocked and cannot proceed without specific user input
- The assistant is requesting critical information or clarification needed to continue
- There's an error or issue that requires user intervention

**Do NOT set to "needs_you" for:**
- General offers like "let me know if you need anything else"
- Passive waiting for approval when the work is already done
- Completed tasks awaiting review

If the user sends a new message, the session will be re-evaluated. Assume closed unless explicitly blocked.

Respond with a JSON object containing:
- status: either "closed" or "needs_you"
- reasoning: brief explanation for your choice`;



const statusSchema = z.object({
    status: z.enum(['closed', 'needs_you']).describe('The session status based on the conversation'),
    reasoning: z.string().describe('Brief explanation for the chosen status'),
});


export const sessionStatusAgent = {
    async determineStatus(source: SessionSource, providerConfig: ProviderConfig, messages: ConversationMessage[]): Promise<AgentSessionStatus> {
        if (source !== SessionSource.AUTOMATION) {
            return AgentSessionStatus.CLOSED;
        }

        try {
            const lastMessages = extractLastMessages(messages);
            if (!lastMessages) {
                return AgentSessionStatus.NEEDS_YOU;
            }

            const { lastUserMessage, lastAssistantMessage } = lastMessages;

            const settings = await settingsService.getOrCreate();
            const model = createModel(providerConfig, settings.defaultModelId);

            const { object } = await generateObject({
                model,
                system: SYSTEM_PROMPT,
                prompt: `Last user message: ${lastUserMessage}

Last assistant response: ${lastAssistantMessage}`,
                schema: statusSchema,
            });

            logger.info({ status: object.status, reasoning: object.reasoning }, '[SessionStatusAgent] Determined session status');

            if (object.status === "needs_you") {
                return AgentSessionStatus.NEEDS_YOU;
            }

            return AgentSessionStatus.CLOSED;
        } catch (error) {
            logger.error({ error }, '[SessionStatusAgent] Failed to determine session status, defaulting to CLOSED');
            return AgentSessionStatus.NEEDS_YOU;
        }
    },
};



export function extractLastMessages(conversation: ConversationMessage[]): { lastUserMessage: string; lastAssistantMessage: string } | null {
    // Find the last assistant message
    let lastAssistantMessage = '';
    let lastUserMessage = '';

    // Iterate backwards to find the last assistant message
    for (let i = conversation.length - 1; i >= 0; i--) {
        const message = conversation[i];

        if (message.role === 'assistant' && !lastAssistantMessage) {
            // Extract text from assistant parts
            const textParts = message.parts
                .filter(part => part.type === 'text')
                .map(part => part.message)
                .join(' ');
            lastAssistantMessage = textParts;
        }

        if (message.role === 'user' && !lastUserMessage && lastAssistantMessage) {
            // Extract text from user content
            const textContent = message.content
                .filter(part => part.type === 'text')
                .map(part => part.message)
                .join(' ');
            lastUserMessage = textContent;
            break;
        }
    }

    if (!lastAssistantMessage || !lastUserMessage) {
        return null;
    }

    return { lastUserMessage, lastAssistantMessage };
}
