import React, { useCallback } from 'react';
import { browser } from 'wxt/browser';
import { mountExtensionApp } from '@/utils/mountExtensionApp.js';
import { Box, Flex, Separator, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '@/utils/i18n';
import { PopupHeader } from '@/components/UI/PopupHeader/PopupHeader';
import { SettingsToggles } from '@/components/UI/SettingsToggles/SettingsToggles';
import { PopupToolbar } from '@/components/UI/PopupToolbar/PopupToolbar';
import { PopupProfilesList } from '@/components/UI/PopupProfilesList/PopupProfilesList';
import { useSettings } from '@/hooks/useSettings';

export function PopupContent() {
  const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSettings();

  const openOptionsPage = useCallback(() => {
    browser.runtime.openOptionsPage();
  }, []);

  const openRulesPage = useCallback(async (): Promise<void> => {
    const url = browser.runtime.getURL('/options.html') + '#rules';
    const tabs = await browser.tabs.query({ url: browser.runtime.getURL('/options.html') });
    if (tabs.length > 0) {
      await browser.tabs.update(tabs[0].id, { active: true, url });
      await browser.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      await browser.tabs.create({ url });
    }
    window.close();
  }, []);

  const hasRules = isLoaded && (settings?.domainRules?.length ?? 0) > 0;

  return (
    <Box data-testid="popup" width="400px" p="4" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)" }} aria-label={getMessage('popupTitle')}>
      <Flex gap="3" direction="column" width="100%">
        <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage} />

        <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
          <PopupToolbar />

          {isLoaded && !hasRules ? (
            <SettingsToggles
              isLoading={false}
              hasRules={false}
              onOpenRules={openRulesPage}
            />
          ) : null}

          <PopupProfilesList />

          {hasRules ? (
            <>
              <Separator size="4" />
              <SettingsToggles
                globalGroupingEnabled={settings?.globalGroupingEnabled}
                globalDeduplicationEnabled={settings?.globalDeduplicationEnabled}
                onGroupingChange={setGlobalGroupingEnabled}
                onDeduplicationChange={setGlobalDeduplicationEnabled}
                isLoading={!isLoaded}
                hasRules={true}
              />
            </>
          ) : null}
        </main>
      </Flex>
    </Box>
  );
}

export function PopupApp() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Theme>
        <PopupContent />
      </Theme>
    </ThemeProvider>
  );
}

mountExtensionApp('popup-app', <PopupApp />);
