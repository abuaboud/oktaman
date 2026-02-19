import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AgentTextFieldQuestion, QuestionAnswer } from '@oktaman/shared';

interface TextFieldQuestionProps {
  question: AgentTextFieldQuestion;
  isLastQuestion: boolean;
  onAnswer: (answer: QuestionAnswer[]) => void;
  disabled?: boolean;
}

export const TextFieldQuestion = ({ question, isLastQuestion, onAnswer, disabled }: TextFieldQuestionProps) => {
  const [textInput, setTextInput] = useState('');

  const handleSubmit = () => {
    const answer: QuestionAnswer = {
      selectedOptions: [],
      customInput: textInput.trim(),
      answeredAt: new Date(),
    };
    onAnswer([answer]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textInput.trim()) {
        handleSubmit();
      }
    }
  };


  return (
    <div className="flex gap-2 pt-2">
      {question.multiline ? (
        <Textarea
          placeholder={question.placeholder || 'Type your answer...'}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] flex-1"
          disabled={disabled}
          autoFocus
        />
      ) : (
        <Input
          placeholder={question.placeholder || 'Type your answer...'}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={disabled}
          autoFocus
        />
      )}
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!textInput.trim() || disabled}
        className="self-end"
      >
        {isLastQuestion ? 'Send' : 'Next'}
      </Button>
    </div>
  );
};
