import React from 'react';
import { Button, DropdownMenu, Flex } from '@radix-ui/themes';
import { ChevronDown } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

export interface SplitButtonMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** If true, a separator is rendered before this item */
  separator?: boolean;
}

export interface SplitButtonProps {
  /** Label of the primary button */
  label: string;
  /** Action on primary button click */
  onClick: () => void;
  /** Dropdown menu items */
  menuItems: SplitButtonMenuItem[];
  /** Radix variant */
  variant?: 'solid' | 'soft' | 'outline';
  /** Radix size */
  size?: '1' | '2' | '3';
  /** Disabled state */
  disabled?: boolean;
  /** Aria-label for the chevron dropdown trigger */
  ariaLabel?: string;
  /** data-testid forwarded to the primary button */
  'data-testid'?: string;
}

export function SplitButton({
  label,
  onClick,
  menuItems,
  variant = 'solid',
  size = '2',
  disabled = false,
  ariaLabel,
  'data-testid': testId,
}: SplitButtonProps) {
  return (
    <Flex gap="0">
      <Button
        data-testid={testId}
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {label}
      </Button>
      {disabled ? (
        <Button
          variant={variant}
          size={size}
          disabled
          aria-label={ariaLabel ?? getMessage('sessionRestoreOptions')}
          style={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            paddingLeft: 6,
            paddingRight: 6,
            minWidth: 28,
          }}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      ) : (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              variant={variant}
              size={size}
              aria-label={ariaLabel ?? getMessage('sessionRestoreOptions')}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                paddingLeft: 6,
                paddingRight: 6,
                minWidth: 28,
              }}
            >
              <ChevronDown size={14} aria-hidden="true" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.separator && <DropdownMenu.Separator />}
                <DropdownMenu.Item
                  onClick={item.onClick}
                  disabled={item.disabled}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenu.Item>
              </React.Fragment>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}
    </Flex>
  );
}
