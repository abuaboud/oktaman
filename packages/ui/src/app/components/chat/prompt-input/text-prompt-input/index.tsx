import { Paperclip, ArrowUp, Square } from 'lucide-react';
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { isNil, SessionMetadata, ChatWithOktaManRequest } from '@oktaman/shared';
import { FilePreview } from '../../file-preview';
import { ModelSelector, AIModel, MODELS } from '../model-selector';

const DRAFT_KEY_PREFIX = 'chat-draft';

const getDraftKey = (sessionId: string | null | undefined) => {
  return `${DRAFT_KEY_PREFIX}-${sessionId ?? 'new'}`;
};

export type UploadingFile = {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
};

interface TextPromptProps {
  placeholder?: string;
  disabled?: boolean;
  session?: SessionMetadata | null;
  onSend?: (request: ChatWithOktaManRequest) => void;
  onStop?: () => void;
  isStopping?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const TextPrompt = forwardRef<{ setMessage: (msg: string) => void }, TextPromptProps>(({
  placeholder,
  disabled,
  session,
  onSend,
  onStop,
  isStopping,
  textareaRef,
}, ref) => {
  const [message, setMessage] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    MODELS.find(m => m.id === 'moonshotai/kimi-k2.5') || MODELS[0]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = session?.id ?? null;
  const isStreaming = session?.isStreaming ?? false;

  // Expose setMessage method via ref
  useImperativeHandle(ref, () => ({
    setMessage: (newMessage: string) => {
      setMessage(newMessage);
      const draftKey = getDraftKey(sessionId);
      if (newMessage.trim()) {
        localStorage.setItem(draftKey, newMessage);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
  }));

  // Load draft when session changes
  useEffect(() => {
    const draftKey = getDraftKey(sessionId);
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setMessage(savedDraft);
    } else {
      setMessage('');
    }

    if (session?.modelId) {
      const savedModel = MODELS.find(m => m.id === session.modelId);
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    } else {
      // Fallback to Kimi model if no preference is set
      setSelectedModel(MODELS.find(m => m.id === 'moonshotai/kimi-k2.5') || MODELS[0]);
    }
  }, [sessionId, session?.modelId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    const draftKey = getDraftKey(sessionId);
    if (newValue.trim()) {
      localStorage.setItem(draftKey, newValue);
    } else {
      localStorage.removeItem(draftKey);
    }
  };

  const handleFileChange = async (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const id = crypto.randomUUID();
        const newUploadingFile: UploadingFile = {
          id,
          file,
          status: 'uploading',
        };

        setUploadingFiles((prev) => [...prev, newUploadingFile]);

        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/v1/sessions/attachments', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const { downloadUrl } = await response.json() as {
            downloadUrl: string;
            fileName: string;
          };

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: 'completed', url: downloadUrl }
                : f,
            ),
          );
        } catch (error) {
          console.error('Failed to upload file:', error);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, status: 'error' } : f,
            ),
          );
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const isUploadingFiles = uploadingFiles.some((f) => f.status === 'uploading');
  const hasCompletedFiles = uploadingFiles.some((f) => f.status === 'completed');
  const canSend = !disabled && !isStreaming && !isUploadingFiles && (message.trim() || hasCompletedFiles);

  const handleSend = () => {
    if (!canSend || !onSend) return;

    const files = uploadingFiles
      .filter((f) => f.status === 'completed' && f.url)
      .map((f) => ({
        name: f.file.name,
        type: f.file.type,
        url: f.url!,
      }));

    onSend({
      message: message.trim(),
      files: files.length > 0 ? files : [],
      toolOutput: undefined,
      modelId: selectedModel.id,
    });

    const draftKey = getDraftKey(sessionId);
    localStorage.removeItem(draftKey);

    setMessage('');
    setUploadingFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => !isNil(file));
    if (pastedFiles.length > 0) {
      handleFileChange(pastedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileChange(droppedFiles);
  };

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
  };

  return (
    <>
      <div
        className="flex flex-col w-full"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="relative">
          <div
            className={cn(
              "min-h-[155px] w-full p-px rounded-lg border border-input-border ring-2 ring-indigo-500"
            )}
          >
            <div
              className={cn(
                'relative rounded-md bg-background w-full h-full flex flex-col justify-between',
              )}
            >
              {uploadingFiles.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-start gap-3 flex-wrap">
                    {uploadingFiles.map((uploadingFile) => (
                      <FilePreview
                        key={uploadingFile.id}
                        name={uploadingFile.file.name}
                        isLoading={uploadingFile.status === 'uploading'}
                        isError={uploadingFile.status === 'error'}
                        onRemove={() => removeFile(uploadingFile.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="p-2 pb-0 grow flex flex-col">
                <Textarea
                  ref={textareaRef}
                  className="w-full bg-background border-none resize-none overflow-hidden grow focus-visible:ring-0 shadow-none"
                  placeholder={placeholder}
                  minRows={uploadingFiles.length > 0 ? 3 : 10}
                  maxRows={4}
                  value={message}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
              </div>
              <div className="flex justify-between mx-2 mb-3">
                <div className="flex justify-start items-center gap-x-1">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                    disabled={!!session}
                  />
                  <label
                    htmlFor="chat-file-upload"
                    className="cursor-pointer p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </label>
                  <input
                    ref={fileInputRef}
                    id="chat-file-upload"
                    type="file"
                    multiple
                    onChange={(e) => {
                      handleFileChange(
                        (e.target.files && Array.from(e.target.files)) || [],
                      );
                    }}
                    className="hidden"
                  />
                </div>
                <div className="flex justify-center items-center gap-x-2">
                  {isStreaming ? (
                    <Button
                      variant="default"
                      disabled={isStopping}
                      onClick={onStop}
                      size="icon"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      disabled={!canSend}
                      onClick={handleSend}
                      size="icon"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
