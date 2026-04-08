import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Box, Flex, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '../utils/i18n';
import { PopupHeader } from '../components/UI/PopupHeader/PopupHeader';
import { SettingsToggles } from '../components/UI/SettingsToggles/SettingsToggles';
import { PopupToolbar } from '../components/UI/PopupToolbar/PopupToolbar';
import { PopupProfilesList } from '../components/UI/PopupProfilesList/PopupProfilesList';
import { useSyncedSettings } from '../hooks/useSyncedSettings';

(() => {

function PopupContent() {
  const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSyncedSettings();

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
    <Box data-testid="popup" width="350px" p="4" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)" }} aria-label={getMessage('popupTitle')}>
      <Flex gap="3" direction="column" width="100%">
        <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage} />

        <PopupToolbar />

        <PopupProfilesList />

        <SettingsToggles
          globalGroupingEnabled={settings?.globalGroupingEnabled}
          globalDeduplicationEnabled={settings?.globalDeduplicationEnabled}
          onGroupingChange={setGlobalGroupingEnabled}
          onDeduplicationChange={setGlobalDeduplicationEnabled}
          isLoading={!isLoaded}
          hasRules={hasRules}
          onOpenRules={openRulesPage}
        />
      </Flex>
    </Box>
  );
}

function PopupApp() {
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

// Set document lang to match browser locale for screen readers
try {
  const uiLang = browser.i18n.getUILanguage();
  if (uiLang) document.documentElement.lang = uiLang;
} catch (_) { /* fallback to HTML default */ }

const root = createRoot(document.getElementById('popup-app')!);
root.render(<PopupApp />);
})();
