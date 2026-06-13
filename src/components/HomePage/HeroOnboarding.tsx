import { useEffect } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { PackagePlus, Plus, Sparkles } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage } from '@/utils/i18n';
import { markDiscovered } from '@/exploration/progressStore';
import styles from './HeroOnboarding.module.css';

export interface HeroOnboardingProps {
  onImportPack: () => void;
  onCreateRule: () => void;
}

export function HeroOnboarding({ onImportPack, onCreateRule }: HeroOnboardingProps) {
  // Exploration: the onboarding hero was shown to the user.
  useEffect(() => { void markDiscovered('help.onboardingHero'); }, []);

  return (
    <Box asChild className={styles.hero}>
      <section aria-labelledby="home-hero-title">
        <Flex direction="column" gap="4">
          <IconBox icon={Sparkles} size="md" variant="soft" />
          <Heading
            id="home-hero-title"
            as="h1"
            size="8"
            weight="bold"
            className={styles.title}
          >
            {getMessage('homepageHeroOnboardingTitle')}
          </Heading>
          <Text as="p" size="3" color="gray" className={styles.subtitle}>
            {getMessage('homepageHeroOnboardingSubtitle')}
          </Text>
          <Flex gap="3" wrap="wrap" className={styles.ctas}>
            <Button size="3" variant="solid" onClick={onImportPack} data-testid="home-hero-import">
              <PackagePlus size={16} aria-hidden="true" />
              {getMessage('homepageHeroOnboardingImportPack')}
            </Button>
            <Button size="3" variant="outline" onClick={onCreateRule} data-testid="home-hero-create-rule">
              <Plus size={16} aria-hidden="true" />
              {getMessage('homepageHeroOnboardingCreateRule')}
            </Button>
          </Flex>
        </Flex>
      </section>
    </Box>
  );
}
