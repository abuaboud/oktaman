import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { cn } from '@/lib/utils';

const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-start w-full">
      <div className="flex gap-1 justify-center items-center rounded-full p-3">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-[loading_1s_ease-in-out_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-[loading_1s_ease-in-out_0.3s_infinite]"></div>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-[loading_1s_ease-in-out_0.6s_infinite]"></div>
      </div>
    </div>
  );
};

function applyVariables(markdown: string, variables: Record<string, string>) {
  return markdown
    .replaceAll('<br>', '\n')
    .replaceAll(/\{\{(.*?)\}\}/g, (_, variableName) => {
      return variables[variableName] ?? '';
    });
}

type MarkdownProps = {
  markdown: string | undefined;
  variables?: Record<string, string>;
  muted?: boolean;
};

const components: Partial<Components> = {
  pre: ({ children }) => <div className="my-4">{children}</div>,
  code: ({ node, className, children, ref, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const inline = !match;

    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    return (
      <SyntaxHighlighter
        style={prism as any}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
        }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  },
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      <a target="_blank" rel="noopener noreferrer" className="text-primary underline" {...props}>
        {children}
      </a>
    );
  },
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children, muted: _muted }: { children: string; muted?: boolean }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.muted === nextProps.muted,
);

const OktaManMarkdown = React.memo(
  ({ markdown, variables = {}, muted = false }: MarkdownProps) => {
    if ((!markdown || markdown.trim() === '')) {
      return (
        <LoadingIndicator />
      );
    }

    if (!markdown) {
      return null;
    }

    // Apply variables but preserve whitespace and line breaks
    const markdownProcessed = applyVariables(markdown, variables ?? {});
    
    return (
      <div className={cn("leading-7", muted && "text-muted-foreground")}>
        <NonMemoizedMarkdown muted={muted}>{markdownProcessed}</NonMemoizedMarkdown>
      </div>
    );
  },
);

OktaManMarkdown.displayName = 'OktaManMarkdown';
export { OktaManMarkdown };
