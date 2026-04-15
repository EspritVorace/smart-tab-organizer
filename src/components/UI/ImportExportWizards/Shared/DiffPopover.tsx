import React from 'react';
import { Button, Popover, Text } from '@radix-ui/themes';
import { Eye } from 'lucide-react';
import { getMessage } from '../../../../utils/i18n';

interface DiffPopoverProps {
  /** Localised entity name displayed next to "Differences:" in the popover header. */
  entityLabel: string;
  /** Max width of the popover content. */
  maxWidth?: number;
  children: React.ReactNode;
}

/**
 * "Eye" button + Radix popover showing the "Differences: <entityLabel>"
 * header and arbitrary diff content as children. Shared by rule and
 * session conflict rows.
 */
export function DiffPopover({ entityLabel, maxWidth = 350, children }: DiffPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button
          variant="ghost"
          size="1"
          aria-label={getMessage('viewDiff')}
          title={getMessage('viewDiff')}
        >
          <Eye size={14} aria-hidden="true" />
        </Button>
      </Popover.Trigger>
      <Popover.Content style={{ maxWidth }}>
        <Text size="3" weight="bold" mb="2">
          {getMessage('differences')}: {entityLabel}
        </Text>
        {children}
      </Popover.Content>
    </Popover.Root>
  );
}
