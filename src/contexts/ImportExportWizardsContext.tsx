import React, { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from 'react';
import { useSettings } from '@/hooks/useSettings.js';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { SourceMode } from '@/components/UI/ImportExportWizards/Source';

const ImportWizard = lazy(() =>
  import('@/components/UI/ImportExportWizards/ImportWizard').then((m) => ({ default: m.ImportWizard })),
);
const ExportWizard = lazy(() =>
  import('@/components/UI/ImportExportWizards/ExportWizard').then((m) => ({ default: m.ExportWizard })),
);
const ImportSessionsWizard = lazy(() =>
  import('@/components/UI/ImportExportWizards/ImportSessionsWizard').then((m) => ({
    default: m.ImportSessionsWizard,
  })),
);
const ExportSessionsWizard = lazy(() =>
  import('@/components/UI/ImportExportWizards/ExportSessionsWizard').then((m) => ({
    default: m.ExportSessionsWizard,
  })),
);
const ImportWorkspaceDialog = lazy(() =>
  import('@/components/UI/Workspace/ImportWorkspaceDialog').then((m) => ({
    default: m.ImportWorkspaceDialog,
  })),
);
const ExportWorkspaceDialog = lazy(() =>
  import('@/components/UI/Workspace/ExportWorkspaceDialog').then((m) => ({
    default: m.ExportWorkspaceDialog,
  })),
);

type ActiveWizard =
  | { kind: 'import-rules'; initialSourceMode?: SourceMode }
  | { kind: 'export-rules' }
  | { kind: 'import-sessions' }
  | { kind: 'export-sessions' }
  | { kind: 'import-workspace' }
  | { kind: 'export-workspace' };

export interface ImportExportWizardsContextValue {
  openImportRules: (options?: { initialSourceMode?: SourceMode }) => void;
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

  const handleImportRules = useCallback(
    (updated: DomainRuleSetting[]) => {
      void updateSettings({ domainRules: updated });
    },
    [updateSettings],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setActive(null);
  }, []);

  const value = useMemo<ImportExportWizardsContextValue>(
    () => ({
      openImportRules: (options) =>
        setActive({ kind: 'import-rules', initialSourceMode: options?.initialSourceMode }),
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
    </ImportExportWizardsContext.Provider>
  );
}
