import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { chromeGroupColors } from '../../../utils/tabTreeUtils';
import { AccessibleHighlight } from '../../UI/AccessibleHighlight/AccessibleHighlight';
import type { ChromeGroupColor } from '../../../types/tabTree';

export interface GroupRowBaseProps {
  /** Chrome tab group color */
  color: ChromeGroupColor;
  /** Group title */
  title: string;
  /** Number of tabs in the group */
  tabCount: number;
  /** Whether the group is expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggleExpand: () => void;
  /** Indentation level (1-based) */
  level: number;
  /** Left slot: checkbox or nothing */
  leftSlot?: React.ReactNode;
  /** Right slot: action buttons */
  rightSlot?: React.ReactNode;
  /** Search term to highlight in the group title */
  searchQuery?: string;
}

export function GroupRowBase({
  color,
  title,
  tabCount,
  isExpanded,
  onToggleExpand,
  level,
  leftSlot,
  rightSlot,
  searchQuery,
}: GroupRowBaseProps) {
  const colorHex = chromeGroupColors[color] ?? chromeGroupColors.grey;

  return (
    <Flex
      align="center"
      gap="2"
      style={{
        paddingLeft: (level - 1) * 20,
        paddingTop: 'var(--space-1)',
        paddingBottom: 'var(--space-1)',
        paddingRight: 'var(--space-2)',
        minHeight: 32,
        width: '100%',
      }}
    >
      {leftSlot}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label={
          isExpanded
            ? getMessage('tabTreeCollapseGroup', [title])
            : getMessage('tabTreeExpandGroup', [title])
        }
      >
        {isExpanded ? (
          <ChevronDown size={14} aria-hidden="true" style={{ color: 'var(--gray-9)' }} />
        ) : (
          <ChevronRight size={14} aria-hidden="true" style={{ color: 'var(--gray-9)' }} />
        )}
      </button>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: colorHex,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <Text
        size="2"
        weight="bold"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        <AccessibleHighlight text={title} searchTerm={searchQuery ?? ''} />
      </Text>
      <Text size="1" color="gray" style={{ flexShrink: 0 }}>
        ({tabCount})
      </Text>
      {rightSlot != null && rightSlot}
    </Flex>
  );
}
