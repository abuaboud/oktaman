import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AskQuestionInput, QuestionAnswer } from '@oktaman/shared';

interface SingleChoiceQuestionProps {
  question: AskQuestionInput['questions'][number];
  isLastQuestion: boolean;
  onAnswer: (answer: QuestionAnswer[]) => void;
  disabled?: boolean;
}

export const SingleChoiceQuestion = ({ question, isLastQuestion, onAnswer, disabled }: SingleChoiceQuestionProps) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleOptionSelect = (option: string) => {
    const answer: QuestionAnswer = {
      selectedOptions: [option],
      customInput: undefined,
      answeredAt: new Date(),
    };
    onAnswer([answer]);
  };

  const handleCustomSubmit = () => {
    const answer: QuestionAnswer = {
      selectedOptions: [],
      customInput: customInput.trim(),
      answeredAt: new Date(),
    };
    onAnswer([answer]);
  };

  // Type guard to ensure question has options
  if (question.type === 'text_field' || question.type === 'connection_card') {
    return null;
  }

  return (
    <div className="space-y-2 pl-4">
      <div className="flex flex-col gap-2">
        {question.options.map((option: any) => {
          // Handle both string and object formats
          const optionValue = typeof option === 'string' ? option : option.value || option.label;
          const optionLabel = typeof option === 'string' ? option : option.label || option.value;

          return (
            <Button
              key={optionValue}
              variant="outline"
              size="default"
              onClick={() => handleOptionSelect(optionValue)}
              disabled={disabled}
              className="justify-start w-full"
            >
              {optionLabel}
            </Button>
          );
        })}
      </div>

      {!showOtherInput && (
        <Button
          variant="ghost"
          size="default"
          onClick={() => setShowOtherInput(true)}
          disabled={disabled}
          className="text-muted-foreground justify-start w-full"
        >
          Others...
        </Button>
      )}

      {showOtherInput && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Tell me what to do instead"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (customInput.trim()) {
                  handleCustomSubmit();
                }
              }
            }}
            className="min-h-[60px] flex-1"
            disabled={disabled}
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleCustomSubmit}
            disabled={!customInput.trim() || disabled}
            className="self-end"
          >
            {isLastQuestion ? 'Send' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
};
