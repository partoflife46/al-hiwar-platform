/**
 * Lightweight scholarly Markdown renderer for Academy lesson content.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/academy/markdown-lesson-body.tsx`.
 *
 * Exported symbols:
 * - `renderInlineMarkdown` (Function): render inline markdown definition.
 * - `MarkdownLessonBody` (Function): markdown lesson body definition.
 *
 * @module components/academy/markdown-lesson-body
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';

/**
 * Constant definition for inline pattern.
 */
const INLINE_PATTERN = /(\*\*[\s\S]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g;

/** Renders bold, italic, and inline code spans inside a Markdown text fragment. */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  return text.split(INLINE_PATTERN).map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-bold text-[#082233]">
          {renderInlineMarkdown(token.slice(2, -2))}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-[#005072]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

/** Renders a single paragraph, heading, blockquote, or list block from Markdown text. */
function renderMarkdownBlock(block: string, idx: number): React.ReactNode {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={idx} className="text-lg font-bold text-[#005072] pt-2">
        {renderInlineMarkdown(trimmed.slice(4))}
      </h3>
    );
  }
  if (trimmed.startsWith('## ')) {
    return (
      <h2
        key={idx}
        className="text-xl font-extrabold text-[#082233] pt-3 border-b border-[#E2E8F0] pb-1.5"
      >
        {renderInlineMarkdown(trimmed.slice(3))}
      </h2>
    );
  }
  if (trimmed.startsWith('# ')) {
    return (
      <h2 key={idx} className="text-2xl font-extrabold text-[#082233] pt-1">
        {renderInlineMarkdown(trimmed.slice(2))}
      </h2>
    );
  }
  if (trimmed.startsWith('> ')) {
    return (
      <blockquote
        key={idx}
        className="border-l-4 border-[#BC9C5C] bg-[#F8FAFC] px-4 py-3 rounded-r-xl text-[#082233]/90 italic"
      >
        {renderInlineMarkdown(trimmed.replace(/^>\s?/gm, ''))}
      </blockquote>
    );
  }

  const lines = trimmed.split('\n');
  if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
    return (
      <ul key={idx} className="list-disc pl-6 space-y-1.5">
        {lines.map((l, li) => (
          <li key={li}>
            {renderInlineMarkdown(l.trim().replace(/^[-*]\s+/, ''))}
          </li>
        ))}
      </ul>
    );
  }
  if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
    return (
      <ol key={idx} className="list-decimal pl-6 space-y-1.5">
        {lines.map((l, li) => (
          <li key={li}>
            {renderInlineMarkdown(l.trim().replace(/^\d+\.\s+/, ''))}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p key={idx} className="whitespace-pre-line">
      {renderInlineMarkdown(trimmed)}
    </p>
  );
}

/** Renders full Markdown lesson text into structured, styled React elements. */
export function MarkdownLessonBody({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#082233]">
      {blocks.map((block, idx) => renderMarkdownBlock(block, idx))}
    </div>
  );
}
