// options/options.ts
import React, { useCallback, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';
import { mountExtensionApp } from '@/utils/mountExtensionApp.js';
import { Flex, Spinner, Text, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import {
    ActiveWorkspaceProvider,
    useActiveWorkspaceContext,
} from '@/contexts/ActiveWorkspaceContext.js';

import { useSettings } from '@/hooks/useSettings.js';
import { useStatistics } from '@/hooks/useStatistics.js';
import { useDeepLinking } from '@/hooks/useDeepLinking.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { getMessage } from '@/utils/i18n';
import type { ShortcutDefinition } from '@/utils/keyboardShortcuts';

import { Sidebar } from '@/components/UI/Sidebar/Sidebar';
import type { SidebarItem } from '@/components/UI/Sidebar/Sidebar';
import { OptionsHeader, OptionsHeaderCollapsed } from '@/components/UI/OptionsLayout/OptionsHeader';
import { OptionsFooter, OptionsFooterCollapsed } from '@/components/UI/OptionsLayout/OptionsFooter';
import { ShortcutsAside } from '@/components/UI/ShortcutsPanel';
import { DomainRulesPage } from './DomainRulesPage';
import { StatisticsPage } from './StatisticsPage';
import { SettingsPage } from '@/components/UI/SettingsPage/SettingsPage';
import { ImportExportPage } from './ImportExportPage';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { Shield, FileText, BarChart3, Settings, Archive } from 'lucide-react';
import { SessionsPage } from './SessionsPage';
import { Toaster } from '@/components/UI/Toaster/Toaster';
import type { DomainRuleSettings } from '@/types/syncSettings';

export function OptionsContent() {
    const version = browser.runtime.getManifest().version;

    const { settings, updateSettings } = useSettings();
    const { statisticsAggregates, resetStatistics } = useStatistics(settings?.domainRules ?? []);
    const {
        currentTab, setCurrentTab,
        openSnapshotWizard, setOpenSnapshotWizard,
        snapshotGroupId, setSnapshotGroupId,
        restoreSessionId, setRestoreSessionId,
    } = useDeepLinking();

    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [shortcutsAsideOpen, setShortcutsAsideOpen] = useState(false);

    const updateRules = useCallback((newRules: DomainRuleSettings) => {
        updateSettings({ domainRules: newRules });
    }, [updateSettings]);

    const handleResetStats = useCallback(() => setResetConfirmOpen(true), []);

    const handleTabChange = useCallback((tab: string) => {
        window.location.hash = tab;
        setCurrentTab(tab);
    }, [setCurrentTab]);

    const sidebarItems: SidebarItem[] = useMemo(() => [
        { id: 'rules', label: getMessage('domainRulesTab'), icon: Shield, accentColor: 'indigo' },
        { id: 'sessions', label: getMessage('sessionsTab'), icon: Archive, accentColor: 'indigo' },
        { id: 'importexport', label: getMessage('importExportTab'), icon: FileText, accentColor: 'indigo' },
        { id: 'stats', label: getMessage('statisticsTab'), icon: BarChart3, accentColor: 'indigo' },
        { id: 'settings', label: getMessage('settingsTab'), icon: Settings, accentColor: 'indigo' },
    ], []);

    const focusActiveSearch = useCallback(() => {
        const node = document.querySelector<HTMLInputElement>(
            '[data-testid$="-search"] input, [data-testid$="-search"]',
        );
        node?.focus();
    }, []);

    const handleEscape = useCallback(() => {
        if (shortcutsAsideOpen) {
            setShortcutsAsideOpen(false);
        }
    }, [shortcutsAsideOpen]);

    const shortcuts = useMemo<ShortcutDefinition[]>(() => {
        const tabShortcuts: ShortcutDefinition[] = sidebarItems.map((item, index) => ({
            combo: `Alt+${index + 1}`,
            action: () => handleTabChange(item.id),
        }));
        return [
            ...tabShortcuts,
            { combo: '/', action: focusActiveSearch },
            { combo: '?', action: () => setShortcutsAsideOpen((open) => !open) },
            { combo: 'Escape', action: handleEscape, allowInTypingTarget: false },
        ];
    }, [sidebarItems, handleTabChange, focusActiveSearch, handleEscape]);

    useKeyboardShortcuts(shortcuts);

    if (!settings) {
        return (
            <Flex align="center" justify="center" gap="2" style={{ height: '100vh' }}>
                <Spinner size="3" />
                <Text>{getMessage('loadingText')}</Text>
            </Flex>
        );
    }

    return (
        <div id="options-inner" data-testid="options" style={{ display: 'flex', height: '100vh' }}>
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
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                    <main data-testid="options-content" style={{ flex: 1, overflow: 'auto', padding: '20px', minWidth: 0 }}>
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
                                restoreSessionId={restoreSessionId}
                                onRestoreSessionIdChange={setRestoreSessionId}
                            />
                        )}
                        {currentTab === 'stats' && (
                            <StatisticsPage syncSettings={settings} statisticsData={statisticsAggregates} onReset={handleResetStats} />
                        )}
                        {currentTab === 'settings' && (
                            <SettingsPage syncSettings={settings} updateSettings={updateSettings} />
                        )}
                    </main>
                    <ShortcutsAside open={shortcutsAsideOpen} onClose={() => setShortcutsAsideOpen(false)} />
                </div>
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

function OptionsThemed() {
    const { accentColor, activeId } = useActiveWorkspaceContext();
    return (
        <Theme accentColor={accentColor}>
            <div key={activeId} style={{ display: 'contents' }}>
                <OptionsContent />
                <Toaster />
            </div>
        </Theme>
    );
}

export function OptionsApp() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ActiveWorkspaceProvider>
                <OptionsThemed />
            </ActiveWorkspaceProvider>
        </ThemeProvider>
    );
}

mountExtensionApp('options-app', <OptionsApp />);
