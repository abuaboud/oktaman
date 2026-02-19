import { useRef, forwardRef, useImperativeHandle } from 'react';

import { SessionMetadata, ChatWithOktaManRequest, conversationUtils } from '@oktaman/shared';
import { sessionHooks } from '@/lib/hooks/session-hooks';
import { AskQuestionInput } from './ask-question-input';
import { TextPrompt } from './text-prompt-input';

interface PromptInputProps {
  placeholder?: string;
  onSend?: (request: ChatWithOktaManRequest) => void;
  disabled?: boolean;
  session?: SessionMetadata | null;
  onStop?: () => void;
  isStopping?: boolean;
}

export interface PromptInputRef {
  setMessage: (message: string) => void;
  focus: () => void;
}

export const PromptInput = forwardRef<PromptInputRef, PromptInputProps>(({
  placeholder,
  onSend,
  disabled,
  session,
  onStop,
  isStopping
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textPromptRef = useRef<{ setMessage: (msg: string) => void }>(null);
  const { data: conversationData } = sessionHooks.useConversation(session?.id ?? null);

  // Check if the last message is interrupted
  const lastMessage = conversationData && conversationData.length > 0
    ? conversationData[conversationData.length - 1]
    : null;
  const isLastMessageInterrupted = lastMessage?.role === 'interrupted';

  // Calculate pending questions from session
  const pendingQuestions = session?.isStreaming ? [] : conversationUtils.getQuestions(conversationData ?? []);
  const hasPendingQuestions = !isLastMessageInterrupted && pendingQuestions.length > 0;

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setMessage: (newMessage: string) => {
      textPromptRef.current?.setMessage(newMessage);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  return (
    <>
      {hasPendingQuestions ? (
        <AskQuestionInput
          questions={pendingQuestions}
          disabled={disabled}
          sessionId={session?.id ?? null}
        />
      ) : (
        <TextPrompt
          ref={textPromptRef}
          placeholder={placeholder}
          disabled={disabled}
          session={session}
          onSend={onSend}
          onStop={onStop}
          isStopping={isStopping}
          textareaRef={textareaRef}
        />
      )}
    </>
  );
});

PromptInput.displayName = 'PromptInput';
