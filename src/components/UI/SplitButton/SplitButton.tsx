import React from 'react';
import { Button, DropdownMenu, Flex, Kbd } from '@radix-ui/themes';
import { ChevronDown } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { AriaButton } from '@/components/UI/AriaButton/AriaButton';

export interface SplitButtonMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** If true, a separator is rendered before this item */
  separator?: boolean;
  /** Optional keyboard hint rendered on the right side (e.g. "Shift+R"). */
  shortcut?: string;
  /** data-testid forwarded to the DropdownMenu.Item */
  'data-testid'?: string;
}

export interface SplitButtonRadioGroupOption {
  value: string;
  label: string;
  'data-testid'?: string;
}

export interface SplitButtonRadioGroupConfig {
  /** Visible label rendered above the radio group inside the dropdown. */
  label: string;
  /** Currently selected option value. */
  value: string;
  /** Available options. */
  options: SplitButtonRadioGroupOption[];
  /** Called when the user picks a new option. Selecting an option must not trigger any other action. */
  onValueChange: (value: string) => void;
}

export interface SplitButtonProps {
  /** Label of the primary button. Accepts text or any ReactNode (e.g. icon) */
  label: React.ReactNode;
  /** Action on primary button click */
  onClick: () => void;
  /** Dropdown menu items */
  menuItems: SplitButtonMenuItem[];
  /**
   * Optional radio group rendered at the bottom of the dropdown menu, below
   * the action items. Selecting a radio item only emits `onValueChange`; it
   * never triggers any of the action items.
   */
  radioGroup?: SplitButtonRadioGroupConfig;
  /** Radix variant */
  variant?: 'solid' | 'soft' | 'outline';
  /** Radix size */
  size?: '1' | '2' | '3';
  /** Disabled state */
  disabled?: boolean;
  /** Explanation shown in a Tooltip when the button is disabled. */
  disabledReason?: string;
  /** Aria-label for the chevron dropdown trigger */
  ariaLabel?: string;
  /** Aria-label for the primary button. Required when label is not textual */
  primaryAriaLabel?: string;
  /** data-testid forwarded to the primary button */
  'data-testid'?: string;
}

export function SplitButton({
  label,
  onClick,
  menuItems,
  radioGroup,
  variant = 'solid',
  size = '2',
  disabled = false,
  disabledReason,
  ariaLabel,
  primaryAriaLabel,
  'data-testid': testId,
}: SplitButtonProps) {
  const chevronStyle = {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: '1px solid rgba(255,255,255,0.2)',
    paddingLeft: 6,
    paddingRight: 6,
    minWidth: 28,
  };

  return (
    <Flex gap="0">
      <AriaButton
        data-testid={testId}
        variant={variant}
        size={size}
        onClick={onClick}
        ariaDisabled={disabled}
        disabledReason={disabledReason}
        aria-label={typeof label === 'string' ? undefined : primaryAriaLabel}
        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        {label}
      </AriaButton>
      {disabled ? (
        <Button
          variant={variant}
          size={size}
          aria-disabled="true"
          aria-label={ariaLabel ?? getMessage('sessionRestoreOptions')}
          style={chevronStyle}
        >
          <ChevronDown size={14} />
        </Button>
      ) : (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              variant={variant}
              size={size}
              aria-label={ariaLabel ?? getMessage('sessionRestoreOptions')}
              style={chevronStyle}
            >
              <ChevronDown size={14} />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {item.separator && <DropdownMenu.Separator />}
                <DropdownMenu.Item
                  onClick={item.onClick}
                  disabled={item.disabled}
                  data-testid={item['data-testid']}
                >
                  <Flex align="center" justify="between" gap="3" width="100%">
                    <Flex align="center" gap="2">
                      {item.icon}
                      {item.label}
                    </Flex>
                    {item.shortcut && (
                      <Kbd size="1">{item.shortcut}</Kbd>
                    )}
                  </Flex>
                </DropdownMenu.Item>
              </React.Fragment>
            ))}
            {radioGroup && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Label>{radioGroup.label}</DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  value={radioGroup.value}
                  onValueChange={radioGroup.onValueChange}
                >
                  {radioGroup.options.map((option) => (
                    <DropdownMenu.RadioItem
                      key={option.value}
                      value={option.value}
                      data-testid={option['data-testid']}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {option.label}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      )}
    </Flex>
  );
}
