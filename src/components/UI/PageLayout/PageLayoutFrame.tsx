import React from 'react';
import { Heading, Box, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

interface PageLayoutFrameProps {
  titleKey: string;
  descriptionKey: string;
  descriptionOverride?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  rootAriaBusy?: boolean;
  rootTestId?: string;
  contentTestId?: string;
}

export function PageLayoutFrame({
  titleKey,
  descriptionKey,
  descriptionOverride,
  children,
  footer,
  rootAriaBusy,
  rootTestId,
  contentTestId = 'page-layout-content',
}: PageLayoutFrameProps) {
  return (
    <Box
      data-testid={rootTestId}
      aria-busy={rootAriaBusy || undefined}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        data-testid={contentTestId}
        pt="4"
        // Vertical scroll only. overflow-x is clipped because Radix ghost
        // buttons (the toolbar "..." menu, row dropdowns) carry intentional
        // negative margins whose border-box pokes ~6px past the content edge;
        // on `overflow: auto` that empty margin space triggered a spurious
        // horizontal scrollbar. No page scrolls horizontally here (the stats
        // page owns its own inner scroll region).
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
      >
        {children}
      </Box>

      {footer}
    </Box>
  );
}
