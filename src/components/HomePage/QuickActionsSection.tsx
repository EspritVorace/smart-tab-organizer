import { useRef, useState } from 'react';
import { Card, Flex, Grid, Heading } from '@radix-ui/themes';
import { Zap } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { useListNavigation } from '@/hooks/useListNavigation';
import { getMessage } from '@/utils/i18n';
import { QUICK_ACTIONS, type QuickActionId } from './data';
import { QuickActionCard } from './QuickActionCard';

export interface QuickActionsSectionProps {
  count?: number;
  onAction: (id: QuickActionId) => void;
}

export function QuickActionsSection({ count = 5, onAction }: QuickActionsSectionProps) {
  const items = QUICK_ACTIONS.slice(0, count);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const { handleNavigationKey } = useListNavigation(gridRef, '[data-home-quick-action]', {
    axis: 'horizontal',
    rovingTabIndex: true,
  });

  return (
    <Card asChild>
      <section aria-labelledby="home-quick-heading" data-testid="home-quick">
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <IconBox icon={Zap} size="sm" variant="soft" />
            <Heading id="home-quick-heading" as="h2" size="4" weight="bold">
              {getMessage('homepageQuickActionsTitle')}
            </Heading>
          </Flex>
          <Grid ref={gridRef} columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
            {items.map((a, i) => (
              <QuickActionCard
                key={a.id}
                action={a}
                onClick={() => onAction(a.id)}
                tabIndex={i === focusIndex ? 0 : -1}
                onFocus={() => setFocusIndex(i)}
                onKeyDown={(e) => handleNavigationKey(e, i)}
              />
            ))}
          </Grid>
        </Flex>
      </section>
    </Card>
  );
}
