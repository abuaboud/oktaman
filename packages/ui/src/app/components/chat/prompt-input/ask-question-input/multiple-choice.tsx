import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AskQuestionInput, QuestionAnswer } from '@oktaman/shared';

interface MultipleChoiceQuestionProps {
  question: AskQuestionInput['questions'][number];
  onAnswer: (answer: QuestionAnswer[]) => void;
  disabled?: boolean;
  isLastQuestion: boolean;
}

export const MultipleChoiceQuestion = ({
  question,
  onAnswer,
  disabled,
  isLastQuestion
}: MultipleChoiceQuestionProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState<string>('');

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => {
      const idx = prev.indexOf(option);
      if (idx >= 0) {
        return prev.filter(opt => opt !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleSubmit = () => {
    const answer: QuestionAnswer = {
      selectedOptions,
      customInput: customInput.trim() || undefined,
      answeredAt: new Date(),
    };
    onAnswer([answer]);
  };

  const canSubmit = selectedOptions.length > 0 || customInput.trim().length > 0;

  // Type guard to ensure question has options
  if (question.type === 'text_field' || question.type === 'connection_card') {
    return null;
  }

  return (
    <>
      <div className="space-y-2 pl-4">
        {question.options.map((option: any) => {
          // Handle both string and object formats
          const optionValue = typeof option === 'string' ? option : option.value || option.label;
          const optionLabel = typeof option === 'string' ? option : option.label || option.value;

          return (
            <div key={optionValue} className="flex items-center space-x-2">
              <Checkbox
                id={optionValue}
                checked={selectedOptions.includes(optionValue)}
                onCheckedChange={() => handleOptionToggle(optionValue)}
                disabled={disabled}
              />
              <Label htmlFor={optionValue} className="font-normal cursor-pointer text-sm">
                {optionLabel}
              </Label>
            </div>
          );
        })}
      </div>

      <div className="mx-4 mt-4 mb-3">
        <Textarea
          placeholder="Or tell OktaMan what to do instead..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) {
                handleSubmit();
              }
            }
          }}
          disabled={disabled}
          className="text-sm min-h-[60px]"
        />
      </div>

      <div className="flex justify-end mx-4 mb-3 pt-3 border-t">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit || disabled}
        >
          {isLastQuestion ? 'Submit Answers' : 'Next Question'}
        </Button>
      </div>
    </>
  );
};
