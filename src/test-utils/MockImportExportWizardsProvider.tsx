import React from 'react';
import {
  ImportExportWizardsContext,
  type ImportExportWizardsContextValue,
} from '@/contexts/ImportExportWizardsContext';

const NOOP_VALUE: ImportExportWizardsContextValue = {
  openImportRules: () => undefined,
  openExportRules: () => undefined,
  openImportSessions: () => undefined,
  openExportSessions: () => undefined,
  openImportWorkspace: () => undefined,
  openExportWorkspace: () => undefined,
};

interface MockImportExportWizardsProviderProps {
  value?: Partial<ImportExportWizardsContextValue>;
  children: React.ReactNode;
}

export function MockImportExportWizardsProvider({
  value,
  children,
}: MockImportExportWizardsProviderProps) {
  const merged: ImportExportWizardsContextValue = { ...NOOP_VALUE, ...value };
  return (
    <ImportExportWizardsContext.Provider value={merged}>
      {children}
    </ImportExportWizardsContext.Provider>
  );
}
