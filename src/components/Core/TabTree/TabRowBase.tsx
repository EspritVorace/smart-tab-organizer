import React from 'react';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { Globe } from 'lucide-react';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';

export interface TabRowBaseProps {
  /** Favicon URL or undefined to show the Globe fallback */
  favIconUrl?: string;
  /** Tab title */
  title: string;
  /** Domain extracted from the URL */
  domain: string;
  /** Full URL shown in the tooltip */
  fullUrl: string;
  /** Indentation level (1-based) */
  level: number;
  /** Left slot: checkbox or nothing */
  leftSlot?: React.ReactNode;
  /** Right slot: action buttons */
  rightSlot?: React.ReactNode;
  /** Optional callback when the title text is clicked (e.g., to open the tab) */
  onTitleClick?: () => void;
  /**
   * Whether to show a tooltip with the full URL on hover (default: true).
   * Disable in editable contexts: Radix Tooltip generates an invisible
   * "grace area" between trigger and popup that can intercept pointer events
   * on adjacent rows.
   */
  showTooltip?: boolean;
  /** Search term to highlight in the title and domain */
  searchQuery?: string;
}

export function TabRowBase({
  favIconUrl,
  title,
  domain,
  fullUrl,
  level,
  leftSlot,
  rightSlot,
  onTitleClick,
  showTooltip = true,
  searchQuery,
}: TabRowBaseProps) {
  const favicon = favIconUrl ? (
    <img
      src={favIconUrl}
      alt=""
      width={16}
      height={16}
      style={{ flexShrink: 0, borderRadius: 2 }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <Globe size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--gray-8)' }} />
  );

  const titleContent = (
    <Flex align="center" gap="2" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
      {favicon}
      <Flex direction="column" style={{ overflow: 'hidden', flex: 1, gap: 0 }}>
        <Text
          size="2"
          weight="bold"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: onTitleClick ? 'pointer' : undefined,
          }}
          onClick={
            onTitleClick
              ? (e) => {
                  e.stopPropagation();
                  onTitleClick();
                }
              : undefined
          }
        >
          <AccessibleHighlight text={title} searchTerm={searchQuery ?? ''} />
        </Text>
        {domain && (
          <Text
            size="1"
            color="gray"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <AccessibleHighlight text={domain} searchTerm={searchQuery ?? ''} />
          </Text>
        )}
      </Flex>
    </Flex>
  );

  return (
    /* CSS grid: 1fr (title) + auto (actions) — guarantees the actions column
       always gets its natural width regardless of the display:table context
       created by Radix ScrollArea. */
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: 'var(--space-2)',
        paddingLeft: (level - 1) * 20,
        paddingTop: 'var(--space-1)',
        paddingBottom: 'var(--space-1)',
        paddingRight: 'var(--space-2)',
        minHeight: 32,
        alignItems: 'center',
      }}
    >
      {/* Column 1: optional leftSlot + favicon + title */}
      <Flex align="center" gap="2" style={{ overflow: 'hidden', minWidth: 0 }}>
        {leftSlot}
        {showTooltip ? (
          <Tooltip content={fullUrl}>{titleContent}</Tooltip>
        ) : (
          titleContent
        )}
      </Flex>
      {/* Column 2: action buttons — auto-sized, never clipped */}
      {rightSlot}
    </div>
  );
}
