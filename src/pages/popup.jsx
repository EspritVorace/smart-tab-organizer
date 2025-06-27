// popup/popup.js
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Box, Container, Flex, Switch, Text, Theme, Skeleton } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '../utils/i18n.js';
import { Statistics } from '../components/Statistics/Statistics.tsx';
import { PopupHeader } from '../components/PopupHeader/PopupHeader.tsx';
import { SettingsToggles } from '../components/SettingsToggles/SettingsToggles.tsx';
import { useSyncedSettings } from '../hooks/useSyncedSettings.ts';
import { useStatistics } from '../hooks/useStatistics.ts';

(() => {

function PopupContent() {
    const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSyncedSettings();
    const { statistics, isLoaded: statsLoaded, resetStatistics } = useStatistics();

    const openOptionsPage = useCallback(() => {
        browser.runtime.openOptionsPage();
    }, []);

    const handleResetStats = useCallback(async () => {
        if (confirm(getMessage('confirmResetStats'))) {
            await resetStatistics();
        }
    }, [resetStatistics]);

    // --- Rendu ---
    return (
        <Box width="350px" p="4" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)" }}>
            <Flex gap="2" direction="column" width="100%">
                <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage}/>

                <SettingsToggles 
                    globalGroupingEnabled={settings?.globalGroupingEnabled}
                    globalDeduplicationEnabled={settings?.globalDeduplicationEnabled}
                    onGroupingChange={setGlobalGroupingEnabled}
                    onDeduplicationChange={setGlobalDeduplicationEnabled}
                    isLoading={!isLoaded}
                />

                <Statistics stats={statistics} onReset={handleResetStats} isLoading={!statsLoaded} />
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

// Monte l'application React dans le div #popup-app
  const root = createRoot(document.getElementById('popup-app'));
  root.render(<PopupApp />);
})();
