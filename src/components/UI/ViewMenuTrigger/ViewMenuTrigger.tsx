import React from 'react';
import { Badge, Box, DropdownMenu, IconButton } from '@radix-ui/themes';
import { ListFilter } from 'lucide-react';

export interface ViewMenuTriggerProps {
  /** Number of active filter/sort/group operations; drives the badge and the solid styling. */
  activeOps: number;
  /** Accessible label when no operation is active. */
  label: string;
  /** Accessible label when at least one operation is active. */
  activeLabel: string;
  testId?: string;
  size?: React.ComponentProps<typeof IconButton>['size'];
}

/**
 * Shared trigger for the rules / sessions "view" dropdown menus: a filter
 * IconButton that turns solid and shows a count badge when the view is active.
 * Must be rendered as a child of a `DropdownMenu.Root` (it renders the
 * `DropdownMenu.Trigger`).
 */
export function ViewMenuTrigger({ activeOps, label, activeLabel, testId, size }: ViewMenuTriggerProps) {
  const isActive = activeOps > 0;
  const triggerLabel = isActive ? activeLabel : label;

  return (
    <Box position="relative" style={{ display: 'inline-flex', flexShrink: 0 }}>
      <DropdownMenu.Trigger>
        <IconButton
          data-testid={testId}
          data-active={isActive || undefined}
          variant={isActive ? 'solid' : 'ghost'}
          color={isActive ? undefined : 'gray'}
          size={size}
          aria-label={triggerLabel}
          title={triggerLabel}
        >
          <ListFilter size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      {isActive && (
        <Badge
          color="indigo"
          variant="solid"
          radius="full"
          size="1"
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 16,
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {activeOps}
        </Badge>
      )}
    </Box>
  );
}
