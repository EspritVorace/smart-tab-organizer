import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';

interface ImportExportActionCardProps {
  testId: string;
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Action card displayed on the Import/Export page: icon tile, title,
 * description and a trigger button. Shared between the four page tiles
 * (export rules, import rules, export sessions, import sessions).
 */
export function ImportExportActionCard({
  testId,
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
}: ImportExportActionCardProps) {
  return (
    <Card data-testid={testId} size="3">
      <Flex direction="column" gap="3" align="start" style={{ height: '100%' }}>
        <Flex align="center" gap="2">
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-2)',
              backgroundColor: 'var(--accent-a3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
          </Box>
          <Text size="4" weight="bold">
            {title}
          </Text>
        </Flex>

        <Text size="2" color="gray" style={{ flex: 1 }}>
          {description}
        </Text>

        <Button variant="solid" onClick={onClick} disabled={disabled}>
          <Icon size={16} aria-hidden="true" />
          {buttonLabel}
        </Button>
      </Flex>
    </Card>
  );
}
