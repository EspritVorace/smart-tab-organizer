// options/options.ts
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { mountExtensionApp } from '@/utils/mountExtensionApp.js';
import { Flex, Spinner, Text, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';
import {
    ActiveWorkspaceProvider,
    useActiveWorkspaceContext,
} from '@/contexts/ActiveWorkspaceContext.js';
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';
import { ImportExportWizardsProvider } from '@/contexts/ImportExportWizardsContext';

import { useSettings } from '@/hooks/useSettings.js';
import { useActiveSessions } from '@/hooks/useActiveSessions.js';
import { usePinnedSessions } from '@/hooks/usePinnedSessions.js';
import { useStatistics } from '@/hooks/useStatistics.js';
import { useSessionStatistics } from '@/hooks/useSessionStatistics.js';
import { useStorageUsage } from '@/hooks/useStorageUsage.js';
import { useDeepLinking, type StatsSubTab } from '@/hooks/useDeepLinking.js';
import { useShortcuts, type ShortcutAction } from '@/hooks/useShortcuts.js';
import { useThemeToggleShortcut } from '@/hooks/useThemeToggleShortcut.js';
import { getDocsUrlForTab } from '@/utils/docsUrl';
import { getMessage } from '@/utils/i18n';

import { Sidebar } from '@/components/UI/Sidebar/Sidebar';
import type { SidebarSection } from '@/components/UI/Sidebar/Sidebar';
import { OptionsHeader, OptionsHeaderCollapsed } from '@/components/UI/OptionsLayout/OptionsHeader';
import { OptionsTopbar } from '@/components/UI/OptionsLayout/OptionsTopbar';
import { WorkspaceFooter, WorkspaceFooterCollapsed } from '@/components/UI/Workspace/WorkspaceFooter';
import { ShortcutsAside, type PageContext } from '@/components/UI/ShortcutsPanel';
import { SequenceIndicator } from '@/components/UI/SequenceIndicator';
import { HomePage } from './HomePage';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog/ConfirmDialog';
import { Home, Shield, FileText, BarChart3, Settings, Archive, Layers } from 'lucide-react';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import { getActiveTabGroupId } from '@/utils/tabCapture';
import { lazyWithTiming } from '@/utils/lazyWithTiming.js';
import { preloadPage } from './pagePreloaders.js';
import { DomainRulesPageSkeleton } from './skeletons/DomainRulesPageSkeleton';
import { SessionsPageSkeleton } from './skeletons/SessionsPageSkeleton';
import { WorkspacesPageSkeleton } from './skeletons/WorkspacesPageSkeleton';
import { ImportExportPageSkeleton } from './skeletons/ImportExportPageSkeleton';
import { StatisticsPageSkeleton } from './skeletons/StatisticsPageSkeleton';
import { SettingsPageSkeleton } from './skeletons/SettingsPageSkeleton';

const DomainRulesPage = lazyWithTiming('DomainRulesPage', () =>
    import('./DomainRulesPage').then((m) => ({ default: m.DomainRulesPage })),
);
const SessionsPage = lazyWithTiming('SessionsPage', () =>
    import('./SessionsPage').then((m) => ({ default: m.SessionsPage })),
);
const ImportExportPage = lazyWithTiming('ImportExportPage', () =>
    import('./ImportExportPage').then((m) => ({ default: m.ImportExportPage })),
);
const StatisticsPage = lazyWithTiming('StatisticsPage', () =>
    import('./StatisticsPage').then((m) => ({ default: m.StatisticsPage })),
);
const SettingsPage = lazyWithTiming('SettingsPage', () =>
    import('@/components/UI/SettingsPage/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const WorkspacesPage = lazyWithTiming('WorkspacesPage', () =>
    import('./WorkspacesPage').then((m) => ({ default: m.WorkspacesPage })),
);
import type { Session } from '@/types/session';
import type { HomeRestoreTarget } from '@/components/HomePage/types';
import { Toaster } from '@/components/UI/Toaster/Toaster';
import type { DomainRuleSettings } from '@/types/syncSettings';

function renderLazyFallback(currentTab: string, statsTab: StatsSubTab): React.ReactNode {
    switch (currentTab) {
        case 'rules':
            return <DomainRulesPageSkeleton />;
        case 'sessions':
            return <SessionsPageSkeleton />;
        case 'workspaces':
            return <WorkspacesPageSkeleton />;
        case 'importexport':
            return <ImportExportPageSkeleton />;
        case 'stats':
            return <StatisticsPageSkeleton statsTab={statsTab} />;
        case 'settings':
            return <SettingsPageSkeleton />;
        default:
            return null;
    }
}

export function OptionsContent() {
    const { settings, updateSettings } = useSettings();
    const { workspaces } = useActiveWorkspaceContext();
    const { activeSessions } = useActiveSessions();
    const { pinnedSessions } = usePinnedSessions();
    const { statisticsAggregates, resetStatistics } = useStatistics(settings?.domainRules ?? []);
    const { snapshot: sessionStatsSnapshot } = useSessionStatistics();
    const storageUsage = useStorageUsage();
    const {
        currentTab, setCurrentTab,
        openSnapshotWizard, setOpenSnapshotWizard,
        rulesPendingAction, setRulesPendingAction,
        snapshotGroupId, setSnapshotGroupId,
        restoreSessionId, setRestoreSessionId,
        refreshSessionId, setRefreshSessionId,
        sessionsTab, setSessionsTab,
        statsTab, setStatsTab,
    } = useDeepLinking();

    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [shortcutsAsideOpen, setShortcutsAsideOpen] = useState(false);
    const [sequencePrefix, setSequencePrefix] = useState<string[] | null>(null);

    const updateRules = useCallback((newRules: DomainRuleSettings) => {
        updateSettings({ domainRules: newRules });
    }, [updateSettings]);

    const handleResetStats = useCallback(() => setResetConfirmOpen(true), []);

    const handleTabChange = useCallback((tab: string) => {
        window.location.hash = tab;
        setCurrentTab(tab);
    }, [setCurrentTab]);

    const handleOpenSnapshotWizardFromHome = useCallback(() => {
        setOpenSnapshotWizard(true);
        handleTabChange('sessions');
    }, [setOpenSnapshotWizard, handleTabChange]);

    const handleOpenRuleWizardFromHome = useCallback(() => {
        setRulesPendingAction('create');
        handleTabChange('rules');
    }, [setRulesPendingAction, handleTabChange]);

    const handleRestoreFromHome = useCallback(async (session: Session, target: HomeRestoreTarget) => {
        if (target === 'custom') {
            setRestoreSessionId(session.id);
            handleTabChange('sessions');
            return;
        }
        if (target === 'refresh') {
            const groupId = await getActiveTabGroupId();
            setSnapshotGroupId(groupId);
            setRefreshSessionId(session.id);
            handleTabChange('sessions');
            return;
        }
        await restoreSessionTabs(session, target as RestoreTarget);
    }, [setRestoreSessionId, setRefreshSessionId, setSnapshotGroupId, handleTabChange]);

    const rulesCount = useMemo(
        () => (settings?.domainRules ?? []).filter((rule) => rule.enabled).length,
        [settings?.domainRules],
    );
    const sessionsCount = activeSessions.length + pinnedSessions.length;
    const workspacesCount = workspaces.length;

    const sidebarSections: SidebarSection[] = useMemo(() => [
        {
            id: 'tools',
            label: getMessage('sidebarSectionTools'),
            items: [
                { id: 'home', label: getMessage('homeTab'), icon: Home, accentColor: 'indigo' },
                { id: 'rules', label: getMessage('domainRulesTab'), icon: Shield, accentColor: 'indigo', badge: rulesCount || undefined },
                { id: 'sessions', label: getMessage('sessionsTab'), icon: Archive, accentColor: 'indigo', badge: sessionsCount || undefined },
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
                { id: 'workspaces', label: getMessage('workspacesTab'), icon: Layers, accentColor: 'indigo', badge: workspacesCount || undefined },
            ],
        },
    ], [rulesCount, sessionsCount, workspacesCount]);

    const activePageTitle = useMemo(() => {
        for (const section of sidebarSections) {
            const match = section.items.find((item) => item.id === currentTab);
            if (match) return match.label;
        }
        return getMessage('homeTab');
    }, [sidebarSections, currentTab]);

    const breadcrumb = useMemo<{ pageSubtitle?: string; parentHref?: string }>(() => {
        if (currentTab === 'sessions' && sessionsTab === 'archived') {
            return { pageSubtitle: getMessage('archivedSessionsTab'), parentHref: '#sessions' };
        }
        if (currentTab === 'stats' && statsTab !== 'summary') {
            const statsTabKeys = {
                rules: 'statsRulesTab',
                sessions: 'statsSessionsTab',
                storage: 'statsStorageTab',
            } as const;
            return { pageSubtitle: getMessage(statsTabKeys[statsTab]), parentHref: '#stats' };
        }
        return {};
    }, [currentTab, sessionsTab, statsTab]);


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

    const handleOpenContextualDocs = useCallback(() => {
        window.open(getDocsUrlForTab(currentTab), '_blank', 'noopener,noreferrer');
    }, [currentTab]);

    const shortcutBindings = useMemo<Record<string, ShortcutAction>>(() => ({
        'options.search.focus': focusActiveSearch,
        'options.help': () => setShortcutsAsideOpen((open) => !open),
        'options.search.clear': handleEscape,
        'options.docs.open': handleOpenContextualDocs,
        'options.nav.home': () => handleTabChange('home'),
        'options.nav.rules': () => handleTabChange('rules'),
        'options.nav.sessions': () => handleTabChange('sessions'),
        'options.nav.stats': () => handleTabChange('stats'),
        'options.nav.importexport': () => handleTabChange('importexport'),
        'options.nav.settings': () => handleTabChange('settings'),
        'options.nav.workspaces': () => handleTabChange('workspaces'),
    }), [handleTabChange, focusActiveSearch, handleEscape, handleOpenContextualDocs]);

    useShortcuts(shortcutBindings, {
        scope: 'global',
        onSequenceState: ({ activePrefix }) => setSequencePrefix(activePrefix),
    });

    useThemeToggleShortcut();

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
        <ShortcutsControlProvider openShortcuts={openShortcuts}>
        <ImportExportWizardsProvider>
        <div id="options-inner" data-testid="options" style={{ display: 'flex', height: '100vh' }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={currentTab}
                onItemClick={handleTabChange}
                onItemPreload={preloadPage}
                sections={sidebarSections}
                headerContent={<OptionsHeader />}
                headerCollapsedContent={<OptionsHeaderCollapsed />}
                showFooter={true}
                footerContent={<WorkspaceFooter onManage={() => handleTabChange('workspaces')} />}
                footerCollapsedContent={<WorkspaceFooterCollapsed onManage={() => handleTabChange('workspaces')} />}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <OptionsTopbar
                    pageTitle={activePageTitle}
                    pageSubtitle={breadcrumb.pageSubtitle}
                    parentHref={breadcrumb.parentHref}
                    currentTab={currentTab}
                />
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                    <main data-testid="options-content" style={{ flex: 1, overflow: 'auto', padding: '20px 20px 0 20px', minWidth: 0 }}>
                        <Suspense fallback={renderLazyFallback(currentTab, statsTab)}>
                            {currentTab === 'home' && (
                                <HomePage
                                    syncSettings={settings}
                                    statisticsAggregates={statisticsAggregates}
                                    onNavigate={handleTabChange}
                                    onOpenSnapshotWizard={handleOpenSnapshotWizardFromHome}
                                    onOpenRuleWizard={handleOpenRuleWizardFromHome}
                                    onOpenShortcutsAside={openShortcuts}
                                    onRestore={handleRestoreFromHome}
                                    onDefaultRestoreActionChange={(value) => updateSettings({ defaultRestoreAction: value })}
                                />
                            )}
                            {currentTab === 'rules' && (
                                <DomainRulesPage
                                    syncSettings={settings}
                                    updateRules={updateRules}
                                    pendingAction={rulesPendingAction}
                                    onPendingActionConsumed={() => setRulesPendingAction(null)}
                                />
                            )}
                            {currentTab === 'importexport' && (
                                <ImportExportPage
                                    syncSettings={settings}
                                    onSequencePrefixChange={setSequencePrefix}
                                />
                            )}
                            {currentTab === 'sessions' && (
                                <SessionsPage
                                    syncSettings={settings}
                                    updateSettings={updateSettings}
                                    snapshotWizardOpen={openSnapshotWizard}
                                    onSnapshotWizardOpenChange={setOpenSnapshotWizard}
                                    snapshotGroupId={snapshotGroupId}
                                    onSnapshotGroupIdChange={setSnapshotGroupId}
                                    restoreSessionId={restoreSessionId}
                                    onRestoreSessionIdChange={setRestoreSessionId}
                                    refreshSessionId={refreshSessionId}
                                    onRefreshSessionIdChange={setRefreshSessionId}
                                    sessionsTab={sessionsTab}
                                    onSessionsTabChange={setSessionsTab}
                                />
                            )}
                            {currentTab === 'stats' && (
                                <StatisticsPage
                                    syncSettings={settings}
                                    statisticsData={statisticsAggregates}
                                    sessionStats={sessionStatsSnapshot}
                                    storageUsage={storageUsage}
                                    onReset={handleResetStats}
                                    statsTab={statsTab}
                                    onStatsTabChange={setStatsTab}
                                />
                            )}
                            {currentTab === 'settings' && (
                                <SettingsPage syncSettings={settings} updateSettings={updateSettings} />
                            )}
                            {currentTab === 'workspaces' && (
                                <WorkspacesPage syncSettings={settings} />
                            )}
                        </Suspense>
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
        </ImportExportWizardsProvider>
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
