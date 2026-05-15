import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

const VALID_RULES_ACTIONS = ['create', 'import'] as const;
export type RulesPendingAction = typeof VALID_RULES_ACTIONS[number];

interface DeepLinkState {
  currentTab: string;
  openSnapshotWizard: boolean;
  rulesPendingAction: RulesPendingAction | null;
  snapshotGroupId: number | null;
  restoreSessionId: string | null;
}

const VALID_SECTIONS = ['home', 'rules', 'importexport', 'sessions', 'stats', 'settings', 'workspaces'] as const;

interface ParsedHash {
  section: string;
  params: URLSearchParams;
}

function parseHash(hash: string): ParsedHash | null {
  if (!hash.startsWith('#')) return null;
  const questionMark = hash.indexOf('?');
  const section = questionMark === -1 ? hash.slice(1) : hash.slice(1, questionMark);
  if (!(VALID_SECTIONS as readonly string[]).includes(section)) return null;
  const params = new URLSearchParams(questionMark === -1 ? '' : hash.slice(questionMark + 1));
  return { section, params };
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
} {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [openSnapshotWizard, setOpenSnapshotWizard] = useState(false);
  const [rulesPendingAction, setRulesPendingAction] = useState<RulesPendingAction | null>(null);
  const [snapshotGroupId, setSnapshotGroupId] = useState<number | null>(null);
  const [restoreSessionId, setRestoreSessionId] = useState<string | null>(null);

  useEffect(() => {
    function applySessionsAction(params: URLSearchParams) {
      const action = params.get('action');
      if (action === 'snapshot') {
        setOpenSnapshotWizard(true);
        const groupIdParam = params.get('groupId');
        setSnapshotGroupId(groupIdParam ? parseInt(groupIdParam, 10) : null);
      } else if (action === 'restore') {
        const sid = params.get('sessionId');
        if (sid) setRestoreSessionId(sid);
      }
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
      if (parsed.section === 'sessions') applySessionsAction(parsed.params);
      else if (parsed.section === 'rules') applyRulesAction(parsed.params);
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
  };
}
