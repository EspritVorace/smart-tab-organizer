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
import type { ImportExportAction, ImportExportFrom } from '@/hooks/useDeepLinking.js';
import { useShortcuts, type ShortcutAction } from '@/hooks/useShortcuts.js';
import { getMessage } from '@/utils/i18n';
import type { SourceMode } from '@/components/UI/ImportExportWizards/Source';

import { Sidebar } from '@/components/UI/Sidebar/Sidebar';
import type { SidebarSection } from '@/components/UI/Sidebar/Sidebar';
import { OptionsHeader, OptionsHeaderCollapsed } from '@/components/UI/OptionsLayout/OptionsHeader';
import { WorkspaceFooter, WorkspaceFooterCollapsed } from '@/components/UI/Workspace/WorkspaceFooter';
import { ShortcutsAside, type PageContext } from '@/components/UI/ShortcutsPanel';
import { SequenceIndicator } from '@/components/UI/SequenceIndicator';
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
        importExportAction, setImportExportAction,
        importExportFrom, setImportExportFrom,
    } = useDeepLinking();

    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [shortcutsAsideOpen, setShortcutsAsideOpen] = useState(false);
    const [importInitialMode, setImportInitialMode] = useState<SourceMode | null>(null);
    const [sequencePrefix, setSequencePrefix] = useState<string[] | null>(null);

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

    const navigateToImportExportAction = useCallback((action: ImportExportAction, from: ImportExportFrom) => {
        window.location.hash = `importexport?action=${action}&from=${from}`;
        setCurrentTab('importexport');
    }, [setCurrentTab]);

    const handleOpenImportRulesFromHome = useCallback((initialSourceMode?: SourceMode) => {
        setImportInitialMode(initialSourceMode ?? null);
        navigateToImportExportAction('import-rules', 'home');
    }, [navigateToImportExportAction]);

    const handleOpenImportRulesFromRules = useCallback(() => {
        setImportInitialMode(null);
        navigateToImportExportAction('import-rules', 'rules');
    }, [navigateToImportExportAction]);

    const handleOpenImportSessionsFromSessions = useCallback(() => {
        navigateToImportExportAction('import-sessions', 'sessions');
    }, [navigateToImportExportAction]);

    const handleImportExportConsumed = useCallback(() => {
        setImportExportAction(null);
        setImportExportFrom(null);
    }, [setImportExportAction, setImportExportFrom]);

    const handleImportRulesClosed = useCallback(() => {
        setImportInitialMode(null);
    }, []);

    const handleRestoreFromHome = useCallback(async (session: Session, target: HomeRestoreTarget) => {
        if (target === 'custom') {
            setRestoreSessionId(session.id);
            handleTabChange('sessions');
            return;
        }
        await restoreSessionTabs(session, target as RestoreTarget);
    }, [setRestoreSessionId, handleTabChange]);

    const sidebarSections: SidebarSection[] = useMemo(() => [
        {
            id: 'tools',
            label: getMessage('sidebarSectionTools'),
            items: [
                { id: 'home', label: getMessage('homeTab'), icon: Home, accentColor: 'indigo' },
                { id: 'rules', label: getMessage('domainRulesTab'), icon: Shield, accentColor: 'indigo' },
                { id: 'sessions', label: getMessage('sessionsTab'), icon: Archive, accentColor: 'indigo' },
            ],
        },
        {
            id: 'tracking',
            label: getMessage('sidebarSectionTracking'),
            items: [
                { id: 'stats', label: getMessage('statisticsTab'), icon: BarChart3, accentColor: 'indigo' },
            ],
        },
        {
            id: 'configuration',
            label: getMessage('sidebarSectionConfiguration'),
            items: [
                { id: 'importexport', label: getMessage('importExportTab'), icon: FileText, accentColor: 'indigo' },
                { id: 'settings', label: getMessage('settingsTab'), icon: Settings, accentColor: 'indigo' },
                { id: 'workspaces', label: getMessage('workspacesTab'), icon: Layers, accentColor: 'indigo' },
            ],
        },
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

    const shortcutBindings = useMemo<Record<string, ShortcutAction>>(() => ({
        'options.search.focus': focusActiveSearch,
        'options.help': () => setShortcutsAsideOpen((open) => !open),
        'options.search.clear': handleEscape,
        'options.nav.home': () => handleTabChange('home'),
        'options.nav.rules': () => handleTabChange('rules'),
        'options.nav.sessions': () => handleTabChange('sessions'),
        'options.nav.stats': () => handleTabChange('stats'),
        'options.nav.importexport': () => handleTabChange('importexport'),
        'options.nav.settings': () => handleTabChange('settings'),
        'options.nav.workspaces': () => handleTabChange('workspaces'),
    }), [handleTabChange, focusActiveSearch, handleEscape]);

    useShortcuts(shortcutBindings, {
        scope: 'global',
        onSequenceState: ({ activePrefix }) => setSequencePrefix(activePrefix),
    });

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
                sections={sidebarSections}
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
                                onOpenImportRules={handleOpenImportRulesFromHome}
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
                                onOpenImportRules={handleOpenImportRulesFromRules}
                            />
                        )}
                        {currentTab === 'importexport' && (
                            <ImportExportPage
                                syncSettings={settings}
                                onSettingsUpdate={updateSettings}
                                deepLinkAction={importExportAction}
                                deepLinkFrom={importExportFrom}
                                onDeepLinkConsumed={handleImportExportConsumed}
                                onNavigate={handleTabChange}
                                importRulesInitialMode={importInitialMode}
                                onImportRulesClosed={handleImportRulesClosed}
                                onSequencePrefixChange={setSequencePrefix}
                            />
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
                                onOpenImportSessions={handleOpenImportSessionsFromSessions}
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
            <SequenceIndicator activePrefix={sequencePrefix} />
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
