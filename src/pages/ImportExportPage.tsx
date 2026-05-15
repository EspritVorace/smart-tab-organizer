import React from 'react';
import { Box, Grid } from '@radix-ui/themes';
import { Download, Upload, FileText, Layers } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { ImportExportActionCard } from '@/components/UI/ImportExportWizards/ImportExportActionCard';
import { useSessions } from '@/hooks/useSessions';
import { useShortcuts, type ShortcutAction } from '@/hooks/useShortcuts';
import { useImportExportWizards } from '@/contexts/ImportExportWizardsContext';
import type { AppSettings } from '@/types/syncSettings';

interface ImportExportPageProps {
  syncSettings: AppSettings;
  /** Forwarded sequence-buffer state so a parent can render the global indicator. */
  onSequencePrefixChange?: (prefix: string[] | null) => void;
}

export function ImportExportPage({
  syncSettings,
  onSequencePrefixChange,
}: ImportExportPageProps) {
  const { sessions } = useSessions();
  const {
    openImportRules,
    openExportRules,
    openImportSessions,
    openExportSessions,
    openImportWorkspace,
    openExportWorkspace,
  } = useImportExportWizards();

  const shortcutBindings: Record<string, ShortcutAction> = {
    'importexport.import.rules': () => openImportRules(),
    'importexport.import.sessions': () => openImportSessions(),
    'importexport.import.workspaces': () => openImportWorkspace(),
    'importexport.export.rules': () => {
      if (syncSettings.domainRules.length === 0) return;
      openExportRules();
    },
    'importexport.export.sessions': () => {
      if (sessions.length === 0) return;
      openExportSessions();
    },
    'importexport.export.workspaces': () => openExportWorkspace(),
  };

  useShortcuts(shortcutBindings, {
    scope: 'page:importexport',
    onSequenceState: ({ activePrefix }) => onSequencePrefixChange?.(activePrefix),
  });

  return (
    <PageLayout
      titleKey="importExportTab"
      descriptionKey="importExportPageDescription"
      icon={FileText}
      syncSettings={syncSettings}
    >
      {() => (
        <Box data-testid="page-import-export">
          <Grid
            columns={{ initial: '1', sm: '2' }}
            gap="4"
          >
            <ImportExportActionCard
              testId="page-import-export-card-export-rules"
              icon={Download}
              title={getMessage('exportRulesTitle')}
              description={getMessage('exportRulesDescription')}
              buttonLabel={getMessage('exportButton')}
              onClick={() => openExportRules()}
              disabled={syncSettings.domainRules.length === 0}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-rules"
              icon={Upload}
              title={getMessage('importRulesTitle')}
              description={getMessage('importRulesDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => openImportRules()}
            />

            <ImportExportActionCard
              testId="page-import-export-card-export-sessions"
              icon={Download}
              title={getMessage('exportSessionsTitle')}
              description={getMessage('exportSessionsDescription')}
              buttonLabel={getMessage('exportButton')}
              onClick={() => openExportSessions()}
              disabled={sessions.length === 0}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-sessions"
              icon={Upload}
              title={getMessage('importSessionsTitle')}
              description={getMessage('importSessionsDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => openImportSessions()}
            />

            <ImportExportActionCard
              testId="page-import-export-card-export-workspace"
              icon={Layers}
              title={getMessage('exportWorkspaceTitle')}
              description={getMessage('exportWorkspaceDescription')}
              buttonLabel={getMessage('exportButton')}
              onClick={() => openExportWorkspace()}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-workspace"
              icon={Layers}
              title={getMessage('importWorkspaceTitle')}
              description={getMessage('importWorkspaceDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => openImportWorkspace()}
            />
          </Grid>
        </Box>
      )}
    </PageLayout>
  );
}
