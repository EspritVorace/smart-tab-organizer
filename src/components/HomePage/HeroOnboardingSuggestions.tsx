import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { AriaButton } from '@/components/UI/AriaButton/AriaButton';
import { resolvePackName } from '@/utils/packLabel';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import type { SuggestedPack } from '@/utils/packSuggestion';
import styles from './HeroOnboardingSuggestions.module.css';

export interface HeroOnboardingSuggestionsProps {
  suggestions: SuggestedPack[];
  /** Called with the ids of the packs the user kept selected. */
  onImportAndOrganize: (selectedPackIds: string[]) => void;
}

/**
 * Contextual onboarding hero (issue #433): lists the packs matching the user's
 * open tabs, pre-selected, with a one-click "import and organize" CTA. Each
 * suggestion is a whole-surface toggle (voice-control friendly), keyboard
 * reachable, with its selected state announced via `aria-pressed`. Shown as
 * long as the active workspace has no rule.
 */
export function HeroOnboardingSuggestions({
  suggestions,
  onImportAndOrganize,
}: HeroOnboardingSuggestionsProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(suggestions.map((s) => s.pack.pack.id)),
  );

  // Exploration: this contextual pack-suggestion CTA is the onboarding welcome
  // block shown whenever the workspace is empty and suggestions exist (the
  // common path), so it marks the same capability as the plain HeroOnboarding.
  useEffect(() => { void markDiscovered('help.onboardingHero'); }, []);

  const toggle = (packId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  };

  const noneSelected = selected.size === 0;

  return (
    <Box asChild className={styles.hero}>
      <section aria-labelledby="home-hero-suggest-title">
        <Flex direction="column" gap="4">
          <IconBox icon={Sparkles} size="md" variant="soft" />
          <Heading
            id="home-hero-suggest-title"
            as="h1"
            size="8"
            weight="bold"
            className={styles.title}
          >
            {getMessage('homepageHeroSuggestTitle')}
          </Heading>
          <Text as="p" size="3" color="gray" className={styles.subtitle}>
            {getMessage('homepageHeroSuggestSubtitle')}
          </Text>

          <Flex
            asChild
            direction="column"
            gap="2"
            aria-label={getMessage('homepageHeroSuggestTitle')}
          >
            <ul className={styles.list}>
              {suggestions.map((suggestion) => {
                const packId = suggestion.pack.pack.id;
                const name = resolvePackName(suggestion.pack.pack);
                const isSelected = selected.has(packId);
                return (
                  <li key={packId}>
                    <button
                      type="button"
                      className={styles.item}
                      aria-pressed={isSelected}
                      aria-label={getMessage('homepageHeroSuggestItemLabel', [
                        name,
                        String(suggestion.matchedTabs),
                      ])}
                      data-testid={`home-hero-suggest-item-${packId}`}
                      onClick={() => toggle(packId)}
                    >
                      <span
                        className={styles.check}
                        data-selected={isSelected}
                        aria-hidden="true"
                      >
                        {isSelected ? <Check size={14} /> : null}
                      </span>
                      <span className={styles.itemName}>{name}</span>
                      <Text size="2" color="gray" className={styles.itemCount}>
                        {getMessage('homepageHeroSuggestTabCount', [
                          String(suggestion.matchedTabs),
                        ])}
                      </Text>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Flex>

          <Flex align="center" gap="2" className={styles.transparency}>
            <ShieldCheck size={14} aria-hidden="true" />
            <Text as="p" size="1" color="gray">
              {getMessage('homepageHeroSuggestTransparency')}
            </Text>
          </Flex>

          <Flex gap="3" wrap="wrap" className={styles.ctas}>
            <AriaButton
              size="3"
              variant="solid"
              ariaDisabled={noneSelected}
              disabledReason={getMessage('homepageHeroSuggestDisabledTooltip')}
              onClick={() => onImportAndOrganize([...selected])}
              data-testid="home-hero-suggest-import"
            >
              <Sparkles size={16} aria-hidden="true" />
              {getMessage('homepageHeroSuggestImportOrganize')}
            </AriaButton>
          </Flex>
        </Flex>
      </section>
    </Box>
  );
}
