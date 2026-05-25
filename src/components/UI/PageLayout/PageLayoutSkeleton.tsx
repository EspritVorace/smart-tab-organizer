import React from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { getMessage } from '@/utils/i18n';
import { PageLayoutFrame } from './PageLayoutFrame';

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
    <PageLayoutFrame
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      descriptionOverride={descriptionOverride}
      rootAriaBusy
      rootTestId="page-layout-skeleton"
      contentTestId="page-layout-skeleton-content"
    >
      <VisuallyHidden>
        <div role="status" aria-live="polite" aria-atomic="true">
          {getMessage('loadingText')}
        </div>
      </VisuallyHidden>
      {children}
    </PageLayoutFrame>
  );
}
