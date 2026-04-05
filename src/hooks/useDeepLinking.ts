import { useState, useEffect } from 'react';

interface DeepLinkState {
  currentTab: string;
  openSnapshotWizard: boolean;
  snapshotGroupId: number | null;
}

const VALID_SECTIONS = ['rules', 'importexport', 'sessions', 'stats', 'settings'] as const;

/**
 * Handles hash-based deep linking for the options page.
 * Parses the URL hash on mount and on every hashchange event.
 */
export function useDeepLinking(): DeepLinkState & {
  setCurrentTab: (tab: string) => void;
  setOpenSnapshotWizard: (open: boolean) => void;
  setSnapshotGroupId: (id: number | null) => void;
} {
  const [currentTab, setCurrentTab] = useState<string>('rules');
  const [openSnapshotWizard, setOpenSnapshotWizard] = useState(false);
  const [snapshotGroupId, setSnapshotGroupId] = useState<number | null>(null);

  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash; // e.g. '#sessions?action=snapshot'
      if (!hash.startsWith('#')) return;
      const questionMark = hash.indexOf('?');
      const section = questionMark === -1 ? hash.slice(1) : hash.slice(1, questionMark);
      if (!(VALID_SECTIONS as readonly string[]).includes(section)) return;
      setCurrentTab(section);
      if (section === 'sessions' && questionMark !== -1) {
        const params = new URLSearchParams(hash.slice(questionMark + 1));
        if (params.get('action') === 'snapshot') {
          setOpenSnapshotWizard(true);
          const groupIdParam = params.get('groupId');
          setSnapshotGroupId(groupIdParam ? parseInt(groupIdParam, 10) : null);
        }
      }
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
    snapshotGroupId,
    setSnapshotGroupId,
  };
}
