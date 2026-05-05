import { useCallback, useState, type KeyboardEvent } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
} from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage } from '@/utils/i18n';
import { TIPS, type TipDef } from './data';
import styles from './TipsSection.module.css';

export type TipsVariant = 'cards' | 'liste' | 'accordeon';

export interface TipsSectionProps {
  variant?: TipsVariant;
}

interface TipBodyProps {
  icon: LucideIcon;
  titleKey: string;
  textKey: string;
  compact?: boolean;
}

function TipBody({ icon, titleKey, textKey, compact = false }: TipBodyProps) {
  const className = compact
    ? `${styles.tipCard} ${styles.tipCardCompact}`
    : styles.tipCard;
  return (
    <Box className={className}>
      <Flex gap="3" align="start">
        <IconBox icon={icon} size="md" variant="soft" />
        <Flex direction="column" gap="1">
          <Text as="p" size="2" weight="medium" mb="0">
            {getMessage(titleKey)}
          </Text>
          <Text as="p" size="2" color="gray" mb="0">
            {getMessage(textKey)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}

function TipsCardsVariant({ tips }: { tips: ReadonlyArray<TipDef> }) {
  const [active, setActive] = useState(0);

  const goPrev = useCallback(() => {
    setActive((i) => (i - 1 + tips.length) % tips.length);
  }, [tips.length]);
  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % tips.length);
  }, [tips.length]);

  const handleKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const current = tips[active];

  return (
    <Box tabIndex={0} onKeyDown={handleKey} aria-label={getMessage('homepageTipsNavLabel')}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <IconBox icon={Lightbulb} size="sm" variant="soft" />
          <Heading id="home-tips-heading" as="h2" size="4" weight="bold">
            {getMessage('homepageTipsTitle')}
          </Heading>
          <Box flexGrow="1" />
          <Flex gap="1">
            <IconButton
              variant="ghost"
              size="2"
              onClick={goPrev}
              aria-label={getMessage('homepageTipsPrev')}
              data-testid="home-tips-prev"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="2"
              onClick={goNext}
              aria-label={getMessage('homepageTipsNext')}
              data-testid="home-tips-next"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </IconButton>
          </Flex>
        </Flex>
        <Box aria-live="polite" data-testid="home-tips-current">
          <TipBody icon={current.icon} titleKey={current.titleKey} textKey={current.textKey} />
        </Box>
        <Flex justify="center" gap="2" mt="1" role="tablist" aria-label={getMessage('homepageTipsNavLabel')}>
          {tips.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={getMessage('homepageTipsDotLabel', [String(i + 1)])}
              className={i === active ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              onClick={() => setActive(i)}
              data-testid={`home-tips-dot-${i}`}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}

function TipsListVariant({ tips }: { tips: ReadonlyArray<TipDef> }) {
  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <IconBox icon={Lightbulb} size="sm" variant="soft" />
        <Heading id="home-tips-heading" as="h2" size="4" weight="bold">
          {getMessage('homepageTipsTitle')}
        </Heading>
      </Flex>
      <Flex direction="column" gap="2">
        {tips.map((t) => (
          <TipBody
            key={t.id}
            icon={t.icon}
            titleKey={t.titleKey}
            textKey={t.textKey}
            compact
          />
        ))}
      </Flex>
    </Flex>
  );
}

interface AccordionItemProps {
  tip: TipDef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TipsAccordionItem({ tip, open, onOpenChange }: AccordionItemProps) {
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange} className={styles.accordionItem}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className={
            open
              ? `${styles.accordionTrigger} ${styles.accordionTriggerOpen}`
              : styles.accordionTrigger
          }
          data-testid={`home-tips-accordion-${tip.id}`}
        >
          <IconBox icon={tip.icon} size="sm" variant="soft" />
          <Text size="2" weight="medium" className={styles.accordionLabel}>
            {getMessage(tip.titleKey)}
          </Text>
          <ChevronDown size={16} aria-hidden="true" className={styles.accordionChevron} />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box className={styles.accordionBody}>
          <Text size="2" color="gray">
            {getMessage(tip.textKey)}
          </Text>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function TipsAccordionVariant({ tips }: { tips: ReadonlyArray<TipDef> }) {
  const [openId, setOpenId] = useState<string | null>(tips[0]?.id ?? null);

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <IconBox icon={Lightbulb} size="sm" variant="soft" />
        <Heading id="home-tips-heading" as="h2" size="4" weight="bold">
          {getMessage('homepageTipsTitle')}
        </Heading>
      </Flex>
      <Box>
        {tips.map((tip) => (
          <TipsAccordionItem
            key={tip.id}
            tip={tip}
            open={openId === tip.id}
            onOpenChange={(open) => setOpenId(open ? tip.id : null)}
          />
        ))}
      </Box>
    </Flex>
  );
}

export function TipsSection({ variant = 'cards' }: TipsSectionProps) {
  return (
    <Card asChild>
      <section aria-labelledby="home-tips-heading" data-testid="home-tips">
        {variant === 'cards' && <TipsCardsVariant tips={TIPS} />}
        {variant === 'liste' && <TipsListVariant tips={TIPS} />}
        {variant === 'accordeon' && <TipsAccordionVariant tips={TIPS} />}
      </section>
    </Card>
  );
}
