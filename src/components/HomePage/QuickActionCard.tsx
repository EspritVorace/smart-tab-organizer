import type { KeyboardEvent } from 'react';
import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage } from '@/utils/i18n';
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
      <Card className={styles.actionCard}>
        <Flex direction="column" gap="2">
          <IconBox icon={action.icon} size="sm" variant="soft" />
          <Heading as="h3" size="2" weight="medium">
            {getMessage(action.titleKey)}
          </Heading>
          <Text as="p" size="1" color="gray">
            {getMessage(action.descKey)}
          </Text>
        </Flex>
      </Card>
    </button>
  );
}
