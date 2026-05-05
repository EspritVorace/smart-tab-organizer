import { Box, Flex, Heading } from '@radix-ui/themes';
import { Sparkles } from 'lucide-react';
import { IconBox } from '@/components/UI/IconBox/IconBox';
import { getMessage } from '@/utils/i18n';
import styles from './HeroCompact.module.css';

export function HeroCompact() {
  return (
    <Box asChild className={styles.hero}>
      <section aria-labelledby="home-hero-compact-title">
        <Flex align="center" gap="3">
          <IconBox icon={Sparkles} size="sm" variant="soft" />
          <Heading
            id="home-hero-compact-title"
            as="h1"
            size="5"
            weight="bold"
          >
            {getMessage('homepageHeroCompactTitle')}
          </Heading>
        </Flex>
      </section>
    </Box>
  );
}
