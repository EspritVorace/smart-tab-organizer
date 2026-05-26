import React, { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from '@/hooks/useSettings.js';
import { lazyWithTiming } from '@/utils/lazyWithTiming.js';
import type { DomainRuleSetting } from '@/types/syncSettings';
import type { SourceMode } from '@/components/UI/ImportExportWizards/Source';

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

// Max exit-animation duration of the Radix Themes Dialog (160ms for the
// overlay, 100ms for the content). Used as the unmount delay below so the
// wizard goes through Radix's normal close transition (animation +
// DismissableLayer cleanup) instead of being hard-unmounted while still
// `open`.
const WIZARD_CLOSE_TRANSITION_MS = 200;

export function ImportExportWizardsProvider({ children }: ImportExportWizardsProviderProps) {
  const { settings, updateSettings } = useSettings();
  const [active, setActive] = useState<ActiveWizard | null>(null);
  // Decoupled "is mounted" state: the wizard component stays in the tree for
  // a short window after `active` becomes null, with `open={false}`, so Radix
  // can run its normal close transition (animation + DismissableLayer
  // cleanup). Without this, the wizard was hard-unmounted while `open` was
  // still `true`, and the DismissableLayer race left `body { pointer-events:
  // none }` stuck, freezing the Options page until reload (typical repro:
  // export rules to the clipboard from the split button).
  const [mounted, setMounted] = useState<ActiveWizard | null>(null);

  useEffect(() => {
    if (active) {
      setMounted(active);
      return;
    }
    if (!mounted) return;
    const id = window.setTimeout(() => {
      setMounted(null);
      // Safety net for the Radix react-dismissable-layer race that leaks
      // `body { pointer-events: none }` when a wizard Dialog closes while a
      // nested DropdownMenu (export split button) was open. The cleanup-order
      // logic in `layersWithOutsidePointerEventsDisabled` only restores the
      // body when a non-last layer unmounts, so the final layer's cleanup
      // (or an interrupted close) can leave the style stuck. Clearing the
      // inline value here unfreezes the Options page; if some other layer is
      // still active it will re-apply `none` on its next render.
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    }, WIZARD_CLOSE_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [active, mounted]);

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

  const isOpen = (kind: ActiveWizard['kind']) => active?.kind === kind;

  return (
    <ImportExportWizardsContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        {mounted?.kind === 'import-rules' && (
          <ImportWizard
            open={isOpen('import-rules')}
            onOpenChange={handleOpenChange}
            existingRules={settings?.domainRules ?? []}
            onImport={handleImportRules}
            initialSourceMode={mounted.initialSourceMode}
          />
        )}
        {mounted?.kind === 'export-rules' && (
          <ExportWizard
            open={isOpen('export-rules')}
            onOpenChange={handleOpenChange}
            rules={settings?.domainRules ?? []}
          />
        )}
        {mounted?.kind === 'import-sessions' && (
          <ImportSessionsWizard open={isOpen('import-sessions')} onOpenChange={handleOpenChange} />
        )}
        {mounted?.kind === 'export-sessions' && (
          <ExportSessionsWizard open={isOpen('export-sessions')} onOpenChange={handleOpenChange} />
        )}
        {mounted?.kind === 'import-workspace' && (
          <ImportWorkspaceDialog open={isOpen('import-workspace')} onOpenChange={handleOpenChange} />
        )}
        {mounted?.kind === 'export-workspace' && (
          <ExportWorkspaceDialog open={isOpen('export-workspace')} onOpenChange={handleOpenChange} />
        )}
      </Suspense>
    </ImportExportWizardsContext.Provider>
  );
}
