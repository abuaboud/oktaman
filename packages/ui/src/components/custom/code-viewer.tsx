import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, Code as CodeIcon, Check, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeViewerProps {
  code: string;
  title?: string;
  language?: string;
  defaultCollapsed?: boolean;
}

const CodeViewer = ({ code, title = "Code", language = "javascript", defaultCollapsed = false }: CodeViewerProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-viewer w-full">
      <Accordion type="single" collapsible defaultValue={defaultCollapsed ? undefined : "item-0"} className="w-full">
        <AccordionItem value="item-0" className="border rounded-lg mt-2 bg-background">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {title.toLowerCase() === 'error' ? (
                <Bug className="h-4 w-4" />
              ) : (
                <CodeIcon className="h-4 w-4" />
              )}
              <span>{title}</span>
            </div>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 relative" 
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 transition-all" />
                ) : (
                  <Copy className="h-4 w-4 transition-all" />
                )}
              </Button>
              <AccordionTrigger className="hover:no-underline" />
            </div>
          </div>
          <AccordionContent className="bg-muted">
            <div className="syntax-highlighter-container w-full max-w-full overflow-x-scroll">
              <SyntaxHighlighter
                language={language}
                style={oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  width: '100%',
                  maxWidth: '100%'
                }}
                showLineNumbers={false}
                wrapLongLines={true}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CodeViewer;