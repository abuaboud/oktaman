import { MessageSquare } from "lucide-react";
import { useRef } from "react";
import { MessageList } from "./message-list";
import { PromptInput, PromptInputRef } from "./prompt-input";
import { EmptyConversation } from "./empty-conversation";
import { isNil, SessionSource } from "@oktaman/shared";
import type { SessionMetadata, Message } from "@/lib/types/session";
import { useChat } from "@/lib/hooks/chat-hooks";

interface ChatWithInputProps {
    sessionId: string | null;
    session: SessionMetadata | null | undefined;
    conversationData: Message[] | null | undefined;
    isLoadingSession: boolean;
    isLoadingConversation: boolean;
    showEmptyStateForNoSession?: boolean;
}

export const ChatWithInput = ({
    sessionId,
    session,
    conversationData,
    isLoadingSession,
    isLoadingConversation,
    showEmptyStateForNoSession = false,
}: ChatWithInputProps) => {
    const hasConversation = !isNil(conversationData) && conversationData.length > 0;
    const promptInputRef = useRef<PromptInputRef>(null);

    const chat = useChat({
        sessionId: sessionId,
    });

    const handleSelectPrompt = (prompt: string) => {
        // Fill the prompt input without sending
        promptInputRef.current?.setMessage(prompt);
    };

    const renderChatContent = () => {
        if (isLoadingSession || isLoadingConversation) {
            return <div className="flex-1" />;
        }
        if (hasConversation) {
            return (
                <MessageList
                    className="flex-1 px-4"
                    conversation={conversationData!}
                    isStreaming={session?.isStreaming}
                />
            );
        }
        return <EmptyConversation onSelectPrompt={handleSelectPrompt} />;
    };

    if (showEmptyStateForNoSession && !sessionId) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Select a chat session</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose a session from the list to view the conversation
                    </p>
                </div>
            </div>
        );
    }

    const shouldShowInput = !session?.source ||
        session.source === SessionSource.MAIN ||
        session.source === SessionSource.AUTOMATION;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {renderChatContent()}
            {!isLoadingSession && !isLoadingConversation && shouldShowInput && (
                <div className="bg-background pb-4 flex-shrink-0 flex justify-center">
                    <div className="w-full max-w-3xl">
                        <PromptInput
                            ref={promptInputRef}
                            placeholder={hasConversation ? "Send a message..." : "Send a message..."}
                            onSend={(request) => {
                                chat.send(request);
                            }}
                            disabled={chat.isPending}
                            session={session}
                            onStop={() => sessionId && chat.stop({ sessionId })}
                            isStopping={chat.isStopping}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
