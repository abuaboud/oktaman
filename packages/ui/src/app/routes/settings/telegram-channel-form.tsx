import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

export function TelegramChannelForm({ onSave, onCancel }: TelegramChannelFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      botToken: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await onSave("Telegram Bot", { botToken: value.botToken, pairedChatId: null });
      } catch (err) {
        let errorMessage = 'Failed to save Telegram channel. Please try again.';

        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { params?: { message?: string } } } }).response;
          errorMessage = response?.data?.params?.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setServerError(errorMessage);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect Telegram to communicate with your AI agents via mobile or desktop.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Setup Instructions</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Open Telegram and search for @BotFather</li>
          <li>Send /newbot and follow the prompts</li>
          <li>Copy the bot token provided</li>
          <li>Paste the token below and save</li>
        </ol>
      </div>

      <form.Field name="botToken">
        {(field) => (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-token">Bot Token</Label>
              <Input
                id="bot-token"
                type="password"
                placeholder="Enter your Telegram bot token"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (serverError) {
                    setServerError(null);
                  }
                }}
                onBlur={field.handleBlur}
                className={serverError ? "border-destructive" : ""}
                required
              />
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Get your token from{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @BotFather
                </a>
              </p>
            </div>
          </div>
        )}
      </form.Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.botToken] as const}
        >
          {([isSubmitting, botToken]) => (
            <Button type="submit" disabled={isSubmitting || botToken.trim() === ""}>
              {isSubmitting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

type TelegramChannelFormProps = {
  onSave: (name: string, config: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}
