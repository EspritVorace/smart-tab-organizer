import React, { useMemo } from 'react';
import { getMessage } from '@/utils/i18n.js';
import { foldAccents } from '@/utils/stringUtils.js';

interface AccessibleHighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

interface Segment {
  text: string;
  isMatch: boolean;
}

const markStyle: React.CSSProperties = {
  backgroundColor: 'var(--yellow-a5)',
  color: 'inherit',
  borderRadius: 'var(--radius-1)',
  padding: '0 2px',
  fontStyle: 'normal',
  fontWeight: 'bold',
};

/**
 * Splits `text` into segments by searching for `searchTerm` case-insensitively
 * and accent-insensitively ("etude" matches "étude", "e" matches "é").
 *
 * Matching runs on the normalized forms, but the returned segments contain
 * the original text. Indices stay aligned because each precomposed NFC
 * character produces exactly one character after NFD normalization plus
 * diacritic stripping.
 */
function buildSegments(text: string, searchTerm: string): Segment[] {
  const trimmed = searchTerm.trim();
  if (!trimmed) return [{ text, isMatch: false }];

  const textFolded = foldAccents(text);
  const termFolded = foldAccents(trimmed);
  if (!termFolded) return [{ text, isMatch: false }];

  const escaped = termFolded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'g');

  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(textFolded)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), isMatch: false });
    }
    segments.push({ text: text.slice(start, end), isMatch: true });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMatch: false });
  }

  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}

export const AccessibleHighlight = React.memo(function AccessibleHighlight({
  text,
  searchTerm,
  className,
}: AccessibleHighlightProps) {
  const segments = useMemo(
    () => buildSegments(text, searchTerm),
    [text, searchTerm]
  );

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} style={markStyle}>
            <span className="sr-only">{getMessage('highlightStart')}</span>
            {segment.text}
            <span className="sr-only">{getMessage('highlightEnd')}</span>
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
});
