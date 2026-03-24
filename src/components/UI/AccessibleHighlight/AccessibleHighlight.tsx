import React, { useMemo } from 'react';
import { getMessage } from '../../../utils/i18n.js';

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

function buildSegments(text: string, searchTerm: string): Segment[] {
  const trimmed = searchTerm.trim();
  if (!trimmed) {
    return [{ text, isMatch: false }];
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part, i) => ({ text: part, isMatch: i % 2 === 1 }));
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
