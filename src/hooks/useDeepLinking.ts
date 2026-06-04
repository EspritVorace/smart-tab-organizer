import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

const VALID_RULES_ACTIONS = ['create', 'import', 'import-pack'] as const;
export type RulesPendingAction = typeof VALID_RULES_ACTIONS[number];

export type SessionsSubTab = 'active' | 'archived';

export type StatsSubTab = 'summary' | 'rules' | 'sessions' | 'storage';

interface DeepLinkState {
  currentTab: string;
  openSnapshotWizard: boolean;
  rulesPendingAction: RulesPendingAction | null;
  snapshotGroupId: number | null;
  restoreSessionId: string | null;
  refreshSessionId: string | null;
  sessionsTab: SessionsSubTab;
  statsTab: StatsSubTab;
}

const VALID_SECTIONS = ['home', 'rules', 'importexport', 'sessions', 'stats', 'settings', 'workspaces'] as const;

interface ParsedHash {
  section: string;
  /** Optional path segment after the section, e.g. "archived" in `#sessions/archived`. */
  sub: string | null;
  params: URLSearchParams;
}

function parseHash(hash: string): ParsedHash | null {
  if (!hash.startsWith('#')) return null;
  const questionMark = hash.indexOf('?');
  const pathPart = questionMark === -1 ? hash.slice(1) : hash.slice(1, questionMark);
  const queryPart = questionMark === -1 ? '' : hash.slice(questionMark + 1);
  const slashIndex = pathPart.indexOf('/');
  const section = slashIndex === -1 ? pathPart : pathPart.slice(0, slashIndex);
  const sub = slashIndex === -1 ? null : pathPart.slice(slashIndex + 1);
  if (!(VALID_SECTIONS as readonly string[]).includes(section)) return null;
  return { section, sub, params: new URLSearchParams(queryPart) };
}

/**
 * Handles hash-based deep linking for the options page.
 * Parses the URL hash on mount and on every hashchange event.
 */
export function useDeepLinking(): DeepLinkState & {
  setCurrentTab: (tab: string) => void;
  setOpenSnapshotWizard: (open: boolean) => void;
  setRulesPendingAction: (action: RulesPendingAction | null) => void;
  setSnapshotGroupId: (id: number | null) => void;
  setRestoreSessionId: (id: string | null) => void;
  setRefreshSessionId: (id: string | null) => void;
  setSessionsTab: (tab: SessionsSubTab) => void;
  setStatsTab: (tab: StatsSubTab) => void;
} {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [openSnapshotWizard, setOpenSnapshotWizard] = useState(false);
  const [rulesPendingAction, setRulesPendingAction] = useState<RulesPendingAction | null>(null);
  const [snapshotGroupId, setSnapshotGroupId] = useState<number | null>(null);
  const [restoreSessionId, setRestoreSessionId] = useState<string | null>(null);
  const [refreshSessionId, setRefreshSessionId] = useState<string | null>(null);
  const [sessionsTab, setSessionsTab] = useState<SessionsSubTab>('active');
  const [statsTab, setStatsTab] = useState<StatsSubTab>('summary');

  useEffect(() => {
    function applySessionsAction(sub: string | null, params: URLSearchParams) {
      // Sub-route drives the active/archived tab. Unknown or absent sub-route
      // falls back to 'active' so navigating `#sessions/archived` -> `#sessions`
      // resets the view as users expect.
      const tab: SessionsSubTab = sub === 'archived' ? 'archived' : 'active';
      setSessionsTab(tab);
      const action = params.get('action');
      if (action === 'snapshot') {
        setOpenSnapshotWizard(true);
        const groupIdParam = params.get('groupId');
        setSnapshotGroupId(groupIdParam ? parseInt(groupIdParam, 10) : null);
      } else if (action === 'restore') {
        const sid = params.get('sessionId');
        if (sid) setRestoreSessionId(sid);
      } else if (action === 'refresh') {
        const sid = params.get('sessionId');
        if (sid) setRefreshSessionId(sid);
        const groupIdParam = params.get('groupId');
        setSnapshotGroupId(groupIdParam ? parseInt(groupIdParam, 10) : null);
      }
    }

    function applyStatsAction(sub: string | null) {
      // Sub-route drives the active statistics tab. Unknown or absent sub-route
      // falls back to 'summary' so navigating `#stats/storage` -> `#stats`
      // resets the view to the overview as users expect.
      const tab: StatsSubTab =
        sub === 'rules' || sub === 'sessions' || sub === 'storage' ? sub : 'summary';
      setStatsTab(tab);
    }

    function applyRulesAction(params: URLSearchParams) {
      const rawAction = params.get('action');
      if (rawAction && (VALID_RULES_ACTIONS as readonly string[]).includes(rawAction)) {
        setRulesPendingAction(rawAction as RulesPendingAction);
      } else if (rawAction) {
        logger.debug('[DEEPLINK] Unknown rules action ignored:', rawAction);
      }
    }

    function handleHash() {
      const parsed = parseHash(window.location.hash);
      if (!parsed) return;
      setCurrentTab(parsed.section);
      if (parsed.section === 'sessions') applySessionsAction(parsed.sub, parsed.params);
      else if (parsed.section === 'rules') applyRulesAction(parsed.params);
      else if (parsed.section === 'stats') applyStatsAction(parsed.sub);
    }

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return {
    currentTab,
    setCurrentTab,
    openSnapshotWizard,
    setOpenSnapshotWizard,
    rulesPendingAction,
    setRulesPendingAction,
    snapshotGroupId,
    setSnapshotGroupId,
    restoreSessionId,
    setRestoreSessionId,
    refreshSessionId,
    setRefreshSessionId,
    sessionsTab,
    setSessionsTab,
    statsTab,
    setStatsTab,
  };
}
