import React from 'react';
import { DropdownMenu, Flex, IconButton } from '@radix-ui/themes';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

export interface ListToolbarMenuItem {
  /** Stable React key + DropdownMenu.Item identity. */
  key: string;
  /** Already-resolved label (via getMessage by the caller). */
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Item testid (e.g. "page-rules-toolbar-menu-export"). */
  testId?: string;
}

interface ListToolbarMenuProps {
  /** Trigger testid (e.g. "page-rules-toolbar-menu"). */
  testId?: string;
  /** Accessible label for the icon-only trigger. Defaults to getMessage('moreActions'). */
  ariaLabel?: string;
  items: ListToolbarMenuItem[];
}

/**
 * Overflow ("...") menu rendered at the right edge of the {@link ListToolbar},
 * after the primary action button. Hosts the page-level import/export entry
 * points (export + import on rules and sessions, import only on workspaces).
 */
export function ListToolbarMenu({ testId, ariaLabel, items }: ListToolbarMenuProps) {
  const label = ariaLabel ?? getMessage('moreActions');
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          data-testid={testId}
          variant="ghost"
          color="gray"
          aria-label={label}
          title={label}
          style={{ flexShrink: 0 }}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {items.map(({ key, label: itemLabel, icon: Icon, onSelect, testId: itemTestId }) => (
          <DropdownMenu.Item key={key} data-testid={itemTestId} onSelect={onSelect}>
            <Flex align="center" gap="2">
              <Icon size={14} aria-hidden="true" />
              {itemLabel}
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
