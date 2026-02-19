import { LanguageModelUsage, ModelMessage } from "ai";
import { CompactionConversationMessage } from "@oktaman/shared";
import { needsCompaction as checkNeedsCompaction } from "./model-config";

export const compactionService = {

    needsCompaction(usage: LanguageModelUsage, modelId: string): boolean {
        const inputTokens = usage.inputTokens ?? 0;
        return checkNeedsCompaction(inputTokens, modelId);
    },

    compact(messages: ModelMessage[]): CompactionConversationMessage {

        const conversationText = messages.map(msg => {
            if (msg.role === 'user') {
                const textContent = Array.isArray(msg.content)
                    ? msg.content.filter(c => c.type === 'text').map(c => 'text' in c ? c.text : '').join('\n')
                    : msg.content;
                return `User: ${textContent}`;
            } else if (msg.role === 'assistant') {
                const textContent = Array.isArray(msg.content)
                    ? msg.content.filter(c => c.type === 'text').map(c => 'text' in c ? c.text : '').join('\n')
                    : msg.content;
                return `Assistant: ${textContent}`;
            }
            return '';
        }).filter(t => t).join('\n\n');

        const summary = `[Previous conversation summary - ${messages.length} messages compacted]\n\nKey context from earlier in the conversation:\n${conversationText.slice(0, 5000)}\n\n[End of summary - continuing conversation]`;


        return {
            role: 'compaction',
            summary,
        };
    },

    /**
     * Converts compaction messages to model messages for AI
     */
    convertCompactionToModelMessage(compaction: CompactionConversationMessage): ModelMessage {
        return {
            role: 'user',
            content: compaction.summary,
        };
    }
};


