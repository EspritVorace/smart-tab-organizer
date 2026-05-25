import type { AppSettings } from '@/types/syncSettings.js';
import { StatusBar } from '@/components/UI/StatusBar/StatusBar';
import { PageLayoutFrame } from './PageLayoutFrame';

interface PageLayoutProps {
  titleKey: string;
  descriptionKey: string;
  /**
   * Overrides the description rendered under the title. Useful when a single
   * page swaps its sub-title based on internal sub-tab state (e.g. Sessions
   * Active vs Archived). When unset, `descriptionKey` drives the text.
   */
  descriptionOverride?: string;
  syncSettings: AppSettings;
  children: (settings: AppSettings) => React.ReactNode;
}

export function PageLayout({ titleKey, descriptionKey, descriptionOverride, syncSettings, children }: PageLayoutProps) {
  return (
    <PageLayoutFrame
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      descriptionOverride={descriptionOverride}
      footer={<StatusBar />}
    >
      {children(syncSettings)}
    </PageLayoutFrame>
  );
}
