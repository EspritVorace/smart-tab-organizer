import React from 'react';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { Globe } from 'lucide-react';

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
}: TabRowBaseProps) {
  return (
    <Tooltip content={fullUrl}>
      <Flex
        align="center"
        gap="2"
        style={{
          paddingLeft: (level - 1) * 20,
          paddingTop: 'var(--space-1)',
          paddingBottom: 'var(--space-1)',
          paddingRight: 'var(--space-2)',
          overflow: 'hidden',
          minHeight: 32,
        }}
      >
        {leftSlot}
        {favIconUrl ? (
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
        )}
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
            {title}
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
              {domain}
            </Text>
          )}
        </Flex>
        {rightSlot != null && rightSlot}
      </Flex>
    </Tooltip>
  );
}
