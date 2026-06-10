import type { KeyboardEvent } from 'react';
import { Card, Flex, Heading, Kbd, Text } from '@radix-ui/themes';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage, type MessageKey } from '@/utils/i18n';
import type { QuickActionDef } from './data';
import styles from './QuickActionsSection.module.css';

export interface QuickActionCardProps {
  action: QuickActionDef;
  onClick: () => void;
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus?: () => void;
}

export function QuickActionCard({
  action,
  onClick,
  tabIndex = 0,
  onKeyDown,
  onFocus,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      tabIndex={tabIndex}
      data-testid={`home-quick-action-${action.id}`}
      data-home-quick-action=""
    >
      {action.shortcutLetter && (
        <Kbd
          size="1"
          className={styles.kbd}
          aria-label={getMessage('homepageQuickActionShortcutAriaLabel', [
            action.shortcutLetter.toUpperCase(),
          ])}
          data-testid={`home-quick-action-${action.id}-kbd`}
        >
          {action.shortcutLetter.toUpperCase()}
        </Kbd>
      )}
      <Card className={styles.actionCard}>
        <Flex direction="column" gap="2">
          <IconBox icon={action.icon} size="sm" variant="soft" />
          <Heading as="h3" size="2" weight="medium">
            {getMessage(action.titleKey as MessageKey)}
          </Heading>
          <Text as="p" size="1" color="gray">
            {getMessage(action.descKey as MessageKey)}
          </Text>
        </Flex>
      </Card>
    </button>
  );
}
