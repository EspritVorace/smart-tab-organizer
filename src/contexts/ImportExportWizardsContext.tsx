import React, { createContext, Suspense, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/hooks/useSettings.js';
import { lazyWithTiming } from '@/utils/lazyWithTiming.js';
import { OrganizeRewardDialog } from '@/components/UI/OrganizeRewardDialog/OrganizeRewardDialog';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { SourceMode } from '@/components/UI/ImportExportWizards/Source';
import type { PackSelectionState } from '@/components/Core/Pack/PackGallery/usePackSelections';

export interface OpenImportRulesOptions {
  initialSourceMode?: SourceMode;
  /** Pre-selected packs (e.g. from the contextual onboarding hero). */
  initialPackSelections?: Record<string, PackSelectionState>;
  /** Offer the "Organize now" reward dialog once the import completes. */
  organizeAfterImport?: boolean;
}

const ImportWizard = lazyWithTiming('ImportWizard', () =>
  import('@/components/UI/ImportExportWizards/ImportWizard').then((m) => ({ default: m.ImportWizard })),
);
const ExportWizard = lazyWithTiming('ExportWizard', () =>
  import('@/components/UI/ImportExportWizards/ExportWizard').then((m) => ({ default: m.ExportWizard })),
);
const ImportSessionsWizard = lazyWithTiming('ImportSessionsWizard', () =>
  import('@/components/UI/ImportExportWizards/ImportSessionsWizard').then((m) => ({
    default: m.ImportSessionsWizard,
  })),
);
const ExportSessionsWizard = lazyWithTiming('ExportSessionsWizard', () =>
  import('@/components/UI/ImportExportWizards/ExportSessionsWizard').then((m) => ({
    default: m.ExportSessionsWizard,
  })),
);
const ImportWorkspaceDialog = lazyWithTiming('ImportWorkspaceDialog', () =>
  import('@/components/UI/Workspace/ImportWorkspaceDialog').then((m) => ({
    default: m.ImportWorkspaceDialog,
  })),
);
const ExportWorkspaceDialog = lazyWithTiming('ExportWorkspaceDialog', () =>
  import('@/components/UI/Workspace/ExportWorkspaceDialog').then((m) => ({
    default: m.ExportWorkspaceDialog,
  })),
);

type ActiveWizard =
  | {
      kind: 'import-rules';
      initialSourceMode?: SourceMode;
      initialPackSelections?: Record<string, PackSelectionState>;
      organizeAfterImport?: boolean;
    }
  | { kind: 'export-rules' }
  | { kind: 'import-sessions' }
  | { kind: 'export-sessions' }
  | { kind: 'import-workspace' }
  | { kind: 'export-workspace' };

export interface ImportExportWizardsContextValue {
  openImportRules: (options?: OpenImportRulesOptions) => void;
  openExportRules: () => void;
  openImportSessions: () => void;
  openExportSessions: () => void;
  openImportWorkspace: () => void;
  openExportWorkspace: () => void;
}

export const ImportExportWizardsContext = createContext<ImportExportWizardsContextValue | null>(null);

export function useImportExportWizards(): ImportExportWizardsContextValue {
  const ctx = useContext(ImportExportWizardsContext);
  if (!ctx) {
    throw new Error('useImportExportWizards must be used within an ImportExportWizardsProvider');
  }
  return ctx;
}

interface ImportExportWizardsProviderProps {
  children: React.ReactNode;
}

export function ImportExportWizardsProvider({ children }: ImportExportWizardsProviderProps) {
  const { settings, updateSettings } = useSettings();
  const [active, setActive] = useState<ActiveWizard | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  // Set when a hero-initiated import requests the post-import organize reward.
  // Read in `handleImportRules` (fires before the wizard closes) and cleared on
  // either import or cancel.
  const organizeIntentRef = useRef(false);

  const handleImportRules = useCallback(
    (updated: DomainRuleSetting[]) => {
      void updateSettings({ domainRules: updated });
      if (organizeIntentRef.current) {
        organizeIntentRef.current = false;
        setRewardOpen(true);
      }
    },
    [updateSettings],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setActive(null);
      // Cancelled without importing: drop any pending reward intent.
      organizeIntentRef.current = false;
    }
  }, []);

  const value = useMemo<ImportExportWizardsContextValue>(
    () => ({
      openImportRules: (options) => {
        organizeIntentRef.current = options?.organizeAfterImport ?? false;
        setActive({
          kind: 'import-rules',
          initialSourceMode: options?.initialSourceMode,
          initialPackSelections: options?.initialPackSelections,
        });
      },
      openExportRules: () => setActive({ kind: 'export-rules' }),
      openImportSessions: () => setActive({ kind: 'import-sessions' }),
      openExportSessions: () => setActive({ kind: 'export-sessions' }),
      openImportWorkspace: () => setActive({ kind: 'import-workspace' }),
      openExportWorkspace: () => setActive({ kind: 'export-workspace' }),
    }),
    [],
  );

  return (
    <ImportExportWizardsContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        {active?.kind === 'import-rules' && (
          <ImportWizard
            open
            onOpenChange={handleOpenChange}
            existingRules={settings?.domainRules ?? []}
            onImport={handleImportRules}
            initialSourceMode={active.initialSourceMode}
            initialPackSelections={active.initialPackSelections}
          />
        )}
        {active?.kind === 'export-rules' && (
          <ExportWizard
            open
            onOpenChange={handleOpenChange}
            rules={settings?.domainRules ?? []}
          />
        )}
        {active?.kind === 'import-sessions' && (
          <ImportSessionsWizard open onOpenChange={handleOpenChange} />
        )}
        {active?.kind === 'export-sessions' && (
          <ExportSessionsWizard open onOpenChange={handleOpenChange} />
        )}
        {active?.kind === 'import-workspace' && (
          <ImportWorkspaceDialog open onOpenChange={handleOpenChange} />
        )}
        {active?.kind === 'export-workspace' && (
          <ExportWorkspaceDialog open onOpenChange={handleOpenChange} />
        )}
      </Suspense>
      <OrganizeRewardDialog open={rewardOpen} onOpenChange={setRewardOpen} />
    </ImportExportWizardsContext.Provider>
  );
}
