// options/options.ts
import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { useSyncedSettings } from '../hooks/useSyncedSettings.js';
import { useStatistics } from '../hooks/useStatistics.js';
import { useDeepLinking } from '../hooks/useDeepLinking.js';
import { getMessage } from '../utils/i18n';
const version = browser.runtime.getManifest().version;

import { Sidebar } from '../components/UI/Sidebar/Sidebar';
import type { SidebarItem } from '../components/UI/Sidebar/Sidebar';
import { OptionsHeader, OptionsHeaderCollapsed } from '../components/UI/OptionsLayout/OptionsHeader';
import { OptionsFooter, OptionsFooterCollapsed } from '../components/UI/OptionsLayout/OptionsFooter';
import { useState } from 'react';
import { DomainRulesPage } from './DomainRulesPage';
import { StatisticsPage } from './StatisticsPage';
import { SettingsPage } from '../components/UI/SettingsPage/SettingsPage';
import { ImportExportPage } from '../components/UI/ImportExportPage/ImportExportPage';
import { ConfirmDialog } from '../components/UI/ConfirmDialog/ConfirmDialog';
import { Shield, FileText, BarChart3, Settings, Archive } from 'lucide-react';
import { FEATURE_BASE_COLORS } from '../utils/themeConstants';
import { SessionsPage } from './SessionsPage';
import type { DomainRuleSettings } from '../types/syncSettings';

(() => {

function OptionsContent() {
    const { settings, updateSettings } = useSyncedSettings();
    const { statistics: stats, resetStatistics } = useStatistics();
    const {
        currentTab, setCurrentTab,
        openSnapshotWizard, setOpenSnapshotWizard,
        snapshotGroupId, setSnapshotGroupId,
    } = useDeepLinking();

    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    const updateRules = useCallback((newRules: DomainRuleSettings) => {
        updateSettings({ domainRules: newRules });
    }, [updateSettings]);

    const handleResetStats = useCallback(() => setResetConfirmOpen(true), []);

    const handleTabChange = useCallback((tab: string) => {
        window.location.hash = tab;
        setCurrentTab(tab);
    }, [setCurrentTab]);

    const sidebarItems: SidebarItem[] = [
        { id: 'rules', label: getMessage('domainRulesTab'), icon: Shield as any, accentColor: FEATURE_BASE_COLORS.DOMAIN_RULES },
        { id: 'sessions', label: getMessage('sessionsTab'), icon: Archive as any, accentColor: FEATURE_BASE_COLORS.SESSIONS },
        { id: 'importexport', label: getMessage('importExportTab'), icon: FileText as any, accentColor: FEATURE_BASE_COLORS.IMPORT },
        { id: 'stats', label: getMessage('statisticsTab'), icon: BarChart3 as any, accentColor: FEATURE_BASE_COLORS.STATISTICS },
        { id: 'settings', label: getMessage('settingsTab'), icon: Settings as any, accentColor: FEATURE_BASE_COLORS.SETTINGS },
    ];

    if (!settings) {
        return <p>Chargement...</p>;
    }

    return (
        <div id="options-inner" style={{ display: 'flex', height: '100vh' }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={currentTab}
                onItemClick={handleTabChange}
                items={sidebarItems}
                headerContent={<OptionsHeader version={version} />}
                headerCollapsedContent={<OptionsHeaderCollapsed />}
                showFooter={true}
                footerContent={<OptionsFooter />}
                footerCollapsedContent={<OptionsFooterCollapsed />}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {currentTab === 'rules' && (
                        <DomainRulesPage syncSettings={settings} updateRules={updateRules} />
                    )}
                    {currentTab === 'importexport' && (
                        <ImportExportPage syncSettings={settings} onSettingsUpdate={updateSettings} />
                    )}
                    {currentTab === 'sessions' && (
                        <SessionsPage
                            syncSettings={settings}
                            snapshotWizardOpen={openSnapshotWizard}
                            onSnapshotWizardOpenChange={setOpenSnapshotWizard}
                            snapshotGroupId={snapshotGroupId}
                            onSnapshotGroupIdChange={setSnapshotGroupId}
                        />
                    )}
                    {currentTab === 'stats' && (
                        <StatisticsPage syncSettings={settings} stats={stats} onReset={handleResetStats} />
                    )}
                    {currentTab === 'settings' && (
                        <SettingsPage syncSettings={settings} updateSettings={updateSettings} />
                    )}
                </main>
            </div>
            <ConfirmDialog
                open={resetConfirmOpen}
                onOpenChange={setResetConfirmOpen}
                onConfirm={async () => {
                    await resetStatistics();
                    setResetConfirmOpen(false);
                }}
                title={getMessage('confirmResetStats')}
                description={getMessage('confirmResetStatsDescription')}
                confirmLabel={getMessage('confirmAction')}
                color="orange"
            />
        </div>
    );
}

function OptionsApp() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Theme>
                <OptionsContent />
            </Theme>
        </ThemeProvider>
    );
}

// Set document lang to match browser locale for screen readers
  try {
    const uiLang = browser.i18n.getUILanguage();
    if (uiLang) document.documentElement.lang = uiLang;
  } catch (_) { /* fallback to HTML default */ }

  const root = createRoot(document.getElementById('options-app'));
  root.render(<OptionsApp />);
})();
