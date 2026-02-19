import { useState, useEffect } from 'react';
import { ConnectionQuestion, QuestionAnswer } from '@oktaman/shared';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ComposioToolkitIcon } from './composio-toolkit-icon';
import { connectionHooks } from '@/lib/hooks/connection-hooks';

interface ConnectionCardQuestionProps {
  question: ConnectionQuestion;
  onAnswer: (answer: QuestionAnswer[]) => void;
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
}

export const ConnectionCardQuestion = ({
  question,
  onAnswer,
  onSendMessage,
  disabled,
}: ConnectionCardQuestionProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [customInput, setCustomInput] = useState('');


  const isConnected = connectionHooks.useIsConnected(
    question.toolkit,
    isConnecting && !!popupWindow
  );

  useEffect(() => {
    if (!isConnected) return;

    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }

    setPopupWindow(null);
    setIsConnecting(false);
    handleContinue();
  }, [isConnected]);

  useEffect(() => {
    if (!popupWindow) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'composio-auth-complete') {
        popupWindow.close();
        setPopupWindow(null);
        setIsConnecting(false);
      }
    };

    const checkClosed = setInterval(() => {
      if (popupWindow.closed) {
        clearInterval(checkClosed);
        setIsConnecting(false);
        setPopupWindow(null);
      }
    }, 500);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkClosed);
    };
  }, [popupWindow]);

  const handleConnect = async () => {
    if (disabled || isConnecting) return;

    setIsConnecting(true);

    // Open redirect URL in new window
    if (question.redirectUrl) {
      const popup = window.open(question.redirectUrl, '_blank', 'width=600,height=700');
      setPopupWindow(popup);
    } else {
      setIsConnecting(false);
    }
  };

  const handleContinue = () => {
    if (disabled) return;

    // Submit answer and move to next question
    const answer: QuestionAnswer = {
      selectedOptions: ['connect'],
      answeredAt: new Date(),
    };

    onAnswer([answer]);
  };

  const handleSkip = () => {
    if (disabled || isConnecting) return;

    const answer: QuestionAnswer = {
      selectedOptions: ['skip'],
      answeredAt: new Date(),
    };

    onAnswer([answer]);
  };

  const handleCustomInput = () => {
    if (!customInput.trim() || disabled || isConnecting) return;

    // Send directly as a chat message instead of as a question answer
    if (onSendMessage) {
      onSendMessage(customInput.trim());
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomInput();
    }
  };

  const displayName = question.name || question.toolkit || 'App';

  return (
    <div className={`flex flex-col gap-3 rounded-lg p-3 `}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <ComposioToolkitIcon
              className="size-10"
              slug={question.toolkit || ''}
              type="toolkit"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base truncate">{displayName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isConnecting && (
            <Button
              onClick={handleSkip}
              size="sm"
              variant="ghost"
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          )}
          {!isConnecting ? (
            <Button
              onClick={handleConnect}
              size="sm"
              disabled={disabled}
              className="bg-primary hover:bg-primary/90 font-medium"
            >
              Connect
            </Button>
          ) : popupWindow && !popupWindow.closed ? (
            <Button
              size="sm"
              disabled
              className="bg-primary/50"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              Connecting...
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              size="sm"
              disabled={disabled}
              className="bg-primary hover:bg-primary/90 font-medium"
            >
              Continue
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shadow-none">
        <Input
          type="text"
          placeholder="or tell OktaMan what to do instead..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isConnecting}
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm shadow-none"
        />
      </div>
    </div>
  );
};
