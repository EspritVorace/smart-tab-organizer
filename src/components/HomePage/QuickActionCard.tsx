import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage } from '@/utils/i18n';
import type { QuickActionDef } from './data';
import styles from './QuickActionsSection.module.css';

export interface QuickActionCardProps {
  action: QuickActionDef;
  onClick: () => void;
}

export function QuickActionCard({ action, onClick }: QuickActionCardProps) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={onClick}
      data-testid={`home-quick-action-${action.id}`}
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
