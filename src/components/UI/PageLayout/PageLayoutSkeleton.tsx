import React from 'react';
import { Heading, Box, Text } from '@radix-ui/themes';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { getMessage } from '@/utils/i18n';

interface PageLayoutSkeletonProps {
  titleKey: string;
  descriptionKey: string;
  descriptionOverride?: string;
  children: React.ReactNode;
}

export function PageLayoutSkeleton({
  titleKey,
  descriptionKey,
  descriptionOverride,
  children,
}: PageLayoutSkeletonProps) {
  return (
    <Box
      data-testid="page-layout-skeleton"
      aria-busy="true"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <VisuallyHidden>
        <div role="status" aria-live="polite" aria-atomic="true">
          {getMessage('loadingText')}
        </div>
      </VisuallyHidden>

      <Box
        data-testid="page-layout-header"
        pb="3"
        style={{ borderBottom: '1px solid var(--gray-a4)' }}
      >
        <Heading size="5" weight="bold" as="h1" style={{ letterSpacing: '-0.02em' }}>
          {getMessage(titleKey)}
        </Heading>

        <Box data-testid="page-layout-description" pt="2">
          <Text size="2" color="gray" as="p" style={{ margin: 0 }}>
            {descriptionOverride ?? getMessage(descriptionKey)}
          </Text>
        </Box>
      </Box>

      <Box
        data-testid="page-layout-skeleton-content"
        pt="4"
        style={{ flex: 1, overflow: 'auto', minHeight: 0 }}
      >
        {children}
      </Box>
    </Box>
  );
}
