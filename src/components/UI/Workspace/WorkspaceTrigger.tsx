import type { ComponentProps } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronDown } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { WorkspaceAvatar } from './WorkspaceAvatar';

type WorkspaceTriggerProps = ComponentProps<typeof Flex> & {
  name: string;
  accentColor: ComponentProps<typeof WorkspaceAvatar>['accentColor'];
  /**
   * Visual variant:
   * - "popup": bordered box with a two-line label (sublabel + workspace name).
   * - "sidebar": transparent background with workspace name only.
   */
  variant: 'popup' | 'sidebar';
  testId: string;
};

/**
 * The trigger element passed to WorkspaceSwitcherDropdown.
 * Shared between PopupWorkspaceSwitcher (variant="popup") and
 * WorkspaceFooter (variant="sidebar").
 *
 * WorkspaceSwitcherDropdown renders this through Radix's DropdownMenu.Trigger
 * (asChild/Slot semantics), so the root element must forward `ref` and the
 * injected props (onClick, data-state, aria-*) to open the menu on click.
 */
export function WorkspaceTrigger({
  name,
  accentColor,
  variant,
  testId,
  ref,
  style,
  ...props
}: WorkspaceTriggerProps) {
  const isPopup = variant === 'popup';

  return (
    <Flex
      ref={ref}
      data-testid={testId}
      align="center"
      gap={isPopup ? '2' : '3'}
      role="button"
      tabIndex={0}
      aria-label={getMessage('workspaceSwitcherLabel')}
      {...props}
      style={{
        flex: 1,
        minWidth: 0,
        padding: isPopup ? '6px 8px' : '8px 10px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-2)',
        ...(isPopup
          ? {
              border: '1px solid var(--gray-a4)',
              background: 'var(--gray-a2)',
            }
          : {
              background: 'transparent',
              transition: 'background-color 0.15s ease',
            }),
        ...style,
      }}
    >
      <WorkspaceAvatar name={name} accentColor={accentColor} size="sm" />
      {isPopup ? (
        <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
          <Text size="1" color="gray" style={{ lineHeight: 1.2 }}>
            {getMessage('popupWorkspaceLabel')}
          </Text>
          <Text
            size="2"
            weight="medium"
            style={{
              color: 'var(--gray-12)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {name}
          </Text>
        </Flex>
      ) : (
        <Text
          size="2"
          weight="medium"
          style={{
            color: 'var(--gray-12)',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Text>
      )}
      <ChevronDown size={14} style={{ color: 'var(--gray-11)', flexShrink: 0 }} aria-hidden="true" />
    </Flex>
  );
}
