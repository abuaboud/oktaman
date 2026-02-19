import { useState } from 'react';
import { AgentQuestion, QuestionAnswer, QuestionType } from '@oktaman/shared';
import { MessageCircleQuestion } from 'lucide-react';
import { SingleChoiceQuestion } from './single-choice';
import { MultipleChoiceQuestion } from './multiple-choice';
import { ConnectionCardQuestion } from './connection-card';
import { TextFieldQuestion } from './text-field';
import { useChat } from '@/lib/hooks/chat-hooks';

interface AskQuestionInputProps {
  questions: AgentQuestion[];
  disabled?: boolean;
  sessionId: string | null;
}

export const AskQuestionInput = ({ questions, disabled, sessionId }: AskQuestionInputProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const { send } = useChat({ sessionId });

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = (answer: QuestionAnswer[]) => {
    const newAnswers = [...answers, ...answer];
    setAnswers(newAnswers);

    if (isLastQuestion && sessionId) {
      // Send answers as tool output
      send({
        message: '',
        files: [],
        toolOutput: {
          answers: newAnswers,
        }
      });
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSendMessage = (message: string) => {
    if (!sessionId) return;

    // Send directly as a chat message
    send({
      message,
      files: []
    });
  };

  // Guard against undefined currentQuestion
  if (!currentQuestion) {
    return null;
  }

  const isConnectionCard = currentQuestion.type === QuestionType.CONNECTION_CARD;

  return (
    <div className="min-h-[155px] w-full p-px rounded-lg border border-input-border ring-2 ring-indigo-500">
      <div className="relative rounded-md bg-background w-full h-full flex flex-col">
        <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground pb-2 border-b">
            <MessageCircleQuestion className="w-4 h-4" />
            <span>
              {isConnectionCard ? 'Connection' : 'Ask'} {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Show question text only for non-connection questions */}
          {!isConnectionCard && (
            <div className="text-sm font-medium">
              {'text' in currentQuestion && currentQuestion.text}
            </div>
          )}

          {currentQuestion.type === QuestionType.SINGLE_CHOICE && (
            <SingleChoiceQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={disabled}
              isLastQuestion={isLastQuestion}
            />
          )}

          {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
            <MultipleChoiceQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={disabled}
              isLastQuestion={isLastQuestion}
            />
          )}

          {currentQuestion.type === QuestionType.TEXT_FIELD && (
            <TextFieldQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              disabled={disabled}
              isLastQuestion={isLastQuestion}
            />
          )}

          {currentQuestion.type === QuestionType.CONNECTION_CARD && (
            <ConnectionCardQuestion
              key={currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              onSendMessage={handleSendMessage}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  );
};
