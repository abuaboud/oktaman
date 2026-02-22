import { PromptSuggestions } from "./prompt-suggestions";

interface EmptyConversationProps {
  onSelectPrompt?: (prompt: string) => void;
}

export function EmptyConversation({ onSelectPrompt }: EmptyConversationProps) {
  return (
    <div className="flex-1 flex flex-col justify-start pt-16 px-4">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <img
          src="/chad-oktaman.png"
          alt="OktaMan"
          className="w-32 h-32 object-contain"
        />
        <h1 className="text-3xl font-semibold">What can I help you with?</h1>
        <p className="text-lg text-muted-foreground">
          Your AI sidekick for work, life, and everything in between
        </p>
      </div>

      {onSelectPrompt && <PromptSuggestions onSelectPrompt={onSelectPrompt} />}
    </div>
  );
}
