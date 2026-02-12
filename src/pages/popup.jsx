// popup/popup.js
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Box, Flex, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '../utils/i18n';
import { Statistics } from '../components/Core/Statistics/Statistics.tsx';
import { PopupHeader } from '../components/UI/PopupHeader/PopupHeader.tsx';
import { SettingsToggles } from '../components/UI/SettingsToggles/SettingsToggles.tsx';
import { useSyncedSettings } from '../hooks/useSyncedSettings.ts';
import { useStatistics } from '../hooks/useStatistics.ts';

(() => {

const STATS_COLLAPSED_KEY = 'popupStatsCollapsed';

function PopupContent() {
    const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSyncedSettings();
    const { statistics, isLoaded: statsLoaded } = useStatistics();
    const [statsCollapsed, setStatsCollapsed] = useState(false);
    const [collapsedLoaded, setCollapsedLoaded] = useState(false);

    // Load collapsed state from storage
    useEffect(() => {
        browser.storage.local.get(STATS_COLLAPSED_KEY).then((result) => {
            if (result[STATS_COLLAPSED_KEY] !== undefined) {
                setStatsCollapsed(result[STATS_COLLAPSED_KEY]);
            }
            setCollapsedLoaded(true);
        });
    }, []);

    const handleToggleStatsCollapsed = useCallback(() => {
        setStatsCollapsed((prev) => {
            const next = !prev;
            browser.storage.local.set({ [STATS_COLLAPSED_KEY]: next });
            return next;
        });
    }, []);

    const openOptionsPage = useCallback(() => {
        browser.runtime.openOptionsPage();
    }, []);

    // --- Rendu ---
    return (
        <Box as="main" width="350px" p="4" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)" }} aria-label={getMessage('popupTitle')}>
            <Flex gap="3" direction="column" width="100%">
                <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage}/>

                <SettingsToggles
                    globalGroupingEnabled={settings?.globalGroupingEnabled}
                    globalDeduplicationEnabled={settings?.globalDeduplicationEnabled}
                    onGroupingChange={setGlobalGroupingEnabled}
                    onDeduplicationChange={setGlobalDeduplicationEnabled}
                    isLoading={!isLoaded}
                />

                <Statistics
                    stats={statistics}
                    isLoading={!statsLoaded || !collapsedLoaded}
                    collapsed={statsCollapsed}
                    onToggleCollapsed={handleToggleStatsCollapsed}
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

  const root = createRoot(document.getElementById('popup-app'));
  root.render(<PopupApp />);
})();
