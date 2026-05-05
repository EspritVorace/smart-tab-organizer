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
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';

import { useSettings } from '@/hooks/useSettings.js';
import { useStatistics } from '@/hooks/useStatistics.js';
import { useDeepLinking } from '@/hooks/useDeepLinking.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { getMessage } from '@/utils/i18n';
import type { ShortcutDefinition } from '@/utils/keyboardShortcuts';

import { Sidebar } from '@/components/UI/Sidebar/Sidebar';
import type { SidebarItem } from '@/components/UI/Sidebar/Sidebar';
import { OptionsHeader, OptionsHeaderCollapsed } from '@/components/UI/OptionsLayout/OptionsHeader';
import { WorkspaceFooter, WorkspaceFooterCollapsed } from '@/components/UI/Workspace/WorkspaceFooter';
import { ShortcutsAside, type PageContext } from '@/components/UI/ShortcutsPanel';
import { DomainRulesPage } from './DomainRulesPage';
import { HomePage } from './HomePage';
import { StatisticsPage } from './StatisticsPage';
import { SettingsPage } from '@/components/UI/SettingsPage/SettingsPage';
import { ImportExportPage } from './ImportExportPage';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { Home, Shield, FileText, BarChart3, Settings, Archive, Layers } from 'lucide-react';
import { SessionsPage } from './SessionsPage';
import { WorkspacesPage } from './WorkspacesPage';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import type { Session } from '@/types/session';
import type { HomeRestoreTarget } from '@/components/HomePage/types';
import { Toaster } from '@/components/UI/Toaster/Toaster';
import type { DomainRuleSettings } from '@/types/syncSettings';

export function OptionsContent() {
    const version = browser.runtime.getManifest().version;

    const { settings, updateSettings } = useSettings();
    const { statisticsAggregates, resetStatistics } = useStatistics(settings?.domainRules ?? []);
    const {
        currentTab, setCurrentTab,
        openSnapshotWizard, setOpenSnapshotWizard,
        openRuleWizard, setOpenRuleWizard,
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

    const handleOpenRuleWizardFromHome = useCallback(() => {
        setOpenRuleWizard(true);
        handleTabChange('rules');
    }, [setOpenRuleWizard, handleTabChange]);

    const handleOpenSnapshotWizardFromHome = useCallback(() => {
        setOpenSnapshotWizard(true);
        handleTabChange('sessions');
    }, [setOpenSnapshotWizard, handleTabChange]);

    const handleRestoreFromHome = useCallback(async (session: Session, target: HomeRestoreTarget) => {
        if (target === 'custom') {
            setRestoreSessionId(session.id);
            handleTabChange('sessions');
            return;
        }
        await restoreSessionTabs(session, target as RestoreTarget);
    }, [setRestoreSessionId, handleTabChange]);

    const sidebarItems: SidebarItem[] = useMemo(() => [
        { id: 'home', label: getMessage('homeTab'), icon: Home, accentColor: 'indigo' },
        { id: 'rules', label: getMessage('domainRulesTab'), icon: Shield, accentColor: 'indigo' },
        { id: 'sessions', label: getMessage('sessionsTab'), icon: Archive, accentColor: 'indigo' },
        { id: 'importexport', label: getMessage('importExportTab'), icon: FileText, accentColor: 'indigo' },
        { id: 'stats', label: getMessage('statisticsTab'), icon: BarChart3, accentColor: 'indigo' },
        { id: 'settings', label: getMessage('settingsTab'), icon: Settings, accentColor: 'indigo' },
        { id: 'workspaces', label: getMessage('workspacesTab'), icon: Layers, accentColor: 'indigo' },
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

    const openShortcuts = useCallback(() => setShortcutsAsideOpen(true), []);

    if (!settings) {
        return (
            <Flex align="center" justify="center" gap="2" style={{ height: '100vh' }}>
                <Spinner size="3" />
                <Text>{getMessage('loadingText')}</Text>
            </Flex>
        );
    }

    return (
        <ShortcutsControlProvider openShortcuts={openShortcuts} version={version}>
        <div id="options-inner" data-testid="options" style={{ display: 'flex', height: '100vh' }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={currentTab}
                onItemClick={handleTabChange}
                items={sidebarItems}
                headerContent={<OptionsHeader />}
                headerCollapsedContent={<OptionsHeaderCollapsed />}
                showFooter={true}
                footerContent={<WorkspaceFooter onManage={() => handleTabChange('workspaces')} />}
                footerCollapsedContent={<WorkspaceFooterCollapsed onManage={() => handleTabChange('workspaces')} />}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                    <main data-testid="options-content" style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0 20px', minWidth: 0 }}>
                        {currentTab === 'home' && (
                            <HomePage
                                syncSettings={settings}
                                statisticsAggregates={statisticsAggregates}
                                onNavigate={handleTabChange}
                                onOpenSnapshotWizard={handleOpenSnapshotWizardFromHome}
                                onOpenRuleWizard={handleOpenRuleWizardFromHome}
                                onOpenShortcutsAside={openShortcuts}
                                onRestore={handleRestoreFromHome}
                            />
                        )}
                        {currentTab === 'rules' && (
                            <DomainRulesPage
                                syncSettings={settings}
                                updateRules={updateRules}
                                openRuleWizard={openRuleWizard}
                                onOpenRuleWizardChange={setOpenRuleWizard}
                            />
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
                        {currentTab === 'workspaces' && (
                            <WorkspacesPage syncSettings={settings} />
                        )}
                    </main>
                    <ShortcutsAside
                        open={shortcutsAsideOpen}
                        onClose={() => setShortcutsAsideOpen(false)}
                        pageContext={currentTab as PageContext}
                    />
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
        </ShortcutsControlProvider>
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
