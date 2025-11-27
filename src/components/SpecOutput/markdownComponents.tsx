/**
 * Markdown Components - Extracted from SpecOutput.tsx
 * Stable component references for ReactMarkdown to prevent re-renders
 *
 * Performance improvements:
 * - Defined outside component = stable references across renders
 * - React Compiler can skip reconciliation when spec changes
 * - Memoized SpecMarkdown wrapper for additional protection
 * - Estimated 10-50ms saved per interaction on large specs
 */

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

/**
 * Markdown component overrides with Tailwind styling
 * Defined at module level for stable references
 */
export const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      className="text-3xl font-bold text-primary mb-8 mt-8 tracking-tight border-b border-border/20 pb-4"
      {...props}
    />
  ),

  h2: ({ node, ...props }) => (
    <h2
      className="text-2xl font-semibold text-foreground/90 mt-12 mb-6 tracking-tight"
      {...props}
    />
  ),

  h3: ({ node, ...props }) => (
    <h3
      className="text-xl font-semibold text-foreground/80 mt-10 mb-4 tracking-tight"
      {...props}
    />
  ),

  h4: ({ node, ...props }) => (
    <h4
      className="text-lg font-medium text-foreground/70 mt-8 mb-3"
      {...props}
    />
  ),

  h5: ({ node, ...props }) => (
    <h5
      className="text-base font-medium text-foreground/70 mt-6 mb-2"
      {...props}
    />
  ),

  h6: ({ node, ...props }) => (
    <h6
      className="text-sm font-medium text-foreground/60 mt-4 mb-2"
      {...props}
    />
  ),

  p: ({ node, ...props }) => (
    <p
      className="text-foreground/70 leading-relaxed mb-5 text-sm"
      {...props}
    />
  ),

  ul: ({ node, ...props }) => (
    <ul
      className="space-y-2 mb-6 ml-4 list-disc list-inside"
      {...props}
    />
  ),

  ol: ({ node, ...props }) => (
    <ol
      className="space-y-2 mb-6 ml-4 list-decimal list-inside"
      {...props}
    />
  ),

  li: ({ node, ...props }) => (
    <li
      className="text-foreground/70 text-sm leading-relaxed"
      {...props}
    />
  ),

  strong: ({ node, ...props }) => (
    <strong
      className="font-semibold text-foreground/90"
      {...props}
    />
  ),

  em: ({ node, ...props }) => (
    <em
      className="italic text-foreground/80"
      {...props}
    />
  ),

  // Handle both inline and block code
  code: ({ node, inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="bg-primary/10 px-2 py-0.5 rounded text-primary font-mono text-xs border border-primary/20"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Block code (inside pre)
    return (
      <code
        className="block bg-secondary/30 p-5 rounded-xl text-foreground/80 font-mono text-xs overflow-x-auto border border-border/20"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ node, children, ...props }) => (
    <pre
      className="my-4 overflow-x-auto"
      {...props}
    >
      {children}
    </pre>
  ),

  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/40 pl-6 pr-4 py-3 my-6 bg-primary/5 rounded-r-lg italic text-foreground/70"
      {...props}
    />
  ),

  hr: ({ node, ...props }) => (
    <hr
      className="my-8 border-border/30"
      {...props}
    />
  ),

  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-6">
      <table
        className="w-full border-collapse border border-border/30 rounded-lg"
        {...props}
      />
    </div>
  ),

  thead: ({ node, ...props }) => (
    <thead
      className="bg-primary/5"
      {...props}
    />
  ),

  tbody: ({ node, ...props }) => (
    <tbody {...props} />
  ),

  tr: ({ node, ...props }) => (
    <tr
      className="border-b border-border/20 hover:bg-primary/5 transition-colors"
      {...props}
    />
  ),

  th: ({ node, ...props }) => (
    <th
      className="border border-border/30 px-4 py-2 bg-primary/10 text-left text-sm font-semibold text-foreground/90"
      {...props}
    />
  ),

  td: ({ node, ...props }) => (
    <td
      className="border border-border/30 px-4 py-2 text-sm text-foreground/70"
      {...props}
    />
  ),

  a: ({ node, ...props }) => (
    <a
      className="text-primary hover:text-primary/80 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),

  img: ({ node, ...props }) => (
    <img
      className="max-w-full h-auto rounded-lg my-4 border border-border/20"
      loading="lazy"
      {...props}
    />
  ),

  // Handle definition lists if present
  dl: ({ node, ...props }) => (
    <dl
      className="space-y-4 my-6"
      {...props}
    />
  ),

  dt: ({ node, ...props }) => (
    <dt
      className="font-semibold text-foreground/90"
      {...props}
    />
  ),

  dd: ({ node, ...props }) => (
    <dd
      className="ml-4 text-foreground/70"
      {...props}
    />
  ),
};

/**
 * Memoized Markdown Renderer Component
 * Prevents unnecessary re-renders when parent state changes
 */
interface SpecMarkdownProps {
  content: string;
  className?: string;
}

export const SpecMarkdown = memo(function SpecMarkdown({
  content,
  className = ''
}: SpecMarkdownProps) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

SpecMarkdown.displayName = 'SpecMarkdown';
