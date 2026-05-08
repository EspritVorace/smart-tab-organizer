import React, { useState, useCallback, useEffect } from 'react';
import { Box, Grid } from '@radix-ui/themes';
import { Download, Upload, FileText, Layers } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { ExportWizard } from '@/components/UI/ImportExportWizards/ExportWizard';
import { ImportWizard } from '@/components/UI/ImportExportWizards/ImportWizard';
import { ExportSessionsWizard } from '@/components/UI/ImportExportWizards/ExportSessionsWizard';
import { ImportSessionsWizard } from '@/components/UI/ImportExportWizards/ImportSessionsWizard';
import { ImportExportActionCard } from '@/components/UI/ImportExportWizards/ImportExportActionCard';
import { ExportWorkspaceDialog } from '@/components/UI/Workspace/ExportWorkspaceDialog';
import { ImportWorkspaceDialog } from '@/components/UI/Workspace/ImportWorkspaceDialog';
import { useSessions } from '@/hooks/useSessions';
import type { ImportExportAction, ImportExportFrom } from '@/hooks/useDeepLinking';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings';

interface ImportExportPageProps {
  syncSettings: AppSettings;
  onSettingsUpdate: (settings: AppSettings) => void;
  /** When set, opens the matching wizard automatically (deep-link entry). */
  deepLinkAction?: ImportExportAction | null;
  /** Origin of the deep-link, used to navigate back when the wizard closes. */
  deepLinkFrom?: ImportExportFrom | null;
  /** Called once the deep-link has been consumed so the parent can clear its state. */
  onDeepLinkConsumed?: () => void;
  /** Section navigator used to return to the referrer once the wizard closes. */
  onNavigate?: (tab: string) => void;
}

export function ImportExportPage({
  syncSettings,
  onSettingsUpdate,
  deepLinkAction,
  deepLinkFrom,
  onDeepLinkConsumed,
  onNavigate,
}: ImportExportPageProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportSessionsOpen, setExportSessionsOpen] = useState(false);
  const [importSessionsOpen, setImportSessionsOpen] = useState(false);
  const [exportWorkspaceOpen, setExportWorkspaceOpen] = useState(false);
  const [importWorkspaceOpen, setImportWorkspaceOpen] = useState(false);

  const [triggeredByDeepLink, setTriggeredByDeepLink] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<ImportExportFrom | null>(null);

  const { sessions } = useSessions();

  const handleImport = useCallback((updatedRules: DomainRuleSetting[]) => {
    onSettingsUpdate({
      ...syncSettings,
      domainRules: updatedRules
    });
  }, [syncSettings, onSettingsUpdate]);

  useEffect(() => {
    if (!deepLinkAction) return;

    setPendingFrom(deepLinkFrom ?? null);
    setTriggeredByDeepLink(true);

    const action: ImportExportAction = deepLinkAction;
    if (action === 'import-rules') setImportOpen(true);
    else if (action === 'export-rules') setExportOpen(true);
    else if (action === 'import-sessions') setImportSessionsOpen(true);
    else if (action === 'export-sessions') setExportSessionsOpen(true);
    else if (action === 'import-workspace') setImportWorkspaceOpen(true);
    else if (action === 'export-workspace') setExportWorkspaceOpen(true);

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}#importexport`);
    }
    onDeepLinkConsumed?.();
  }, [deepLinkAction, deepLinkFrom, onDeepLinkConsumed]);

  const makeCloseHandler = useCallback(
    (setter: (open: boolean) => void) => (open: boolean) => {
      setter(open);
      if (open) return;
      if (!triggeredByDeepLink) return;
      const from = pendingFrom;
      setTriggeredByDeepLink(false);
      setPendingFrom(null);
      if (from && from !== 'popup' && onNavigate) {
        onNavigate(from);
      }
    },
    [triggeredByDeepLink, pendingFrom, onNavigate],
  );

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
              onClick={() => setExportOpen(true)}
              disabled={syncSettings.domainRules.length === 0}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-rules"
              icon={Upload}
              title={getMessage('importRulesTitle')}
              description={getMessage('importRulesDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => setImportOpen(true)}
            />

            <ImportExportActionCard
              testId="page-import-export-card-export-sessions"
              icon={Download}
              title={getMessage('exportSessionsTitle')}
              description={getMessage('exportSessionsDescription')}
              buttonLabel={getMessage('exportButton')}
              onClick={() => setExportSessionsOpen(true)}
              disabled={sessions.length === 0}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-sessions"
              icon={Upload}
              title={getMessage('importSessionsTitle')}
              description={getMessage('importSessionsDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => setImportSessionsOpen(true)}
            />

            <ImportExportActionCard
              testId="page-import-export-card-export-workspace"
              icon={Layers}
              title={getMessage('exportWorkspaceTitle')}
              description={getMessage('exportWorkspaceDescription')}
              buttonLabel={getMessage('exportButton')}
              onClick={() => setExportWorkspaceOpen(true)}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-workspace"
              icon={Layers}
              title={getMessage('importWorkspaceTitle')}
              description={getMessage('importWorkspaceDescription')}
              buttonLabel={getMessage('importButton')}
              onClick={() => setImportWorkspaceOpen(true)}
            />
          </Grid>

          <ExportWizard
            open={exportOpen}
            onOpenChange={makeCloseHandler(setExportOpen)}
            rules={syncSettings.domainRules}
          />

          <ImportWizard
            open={importOpen}
            onOpenChange={makeCloseHandler(setImportOpen)}
            existingRules={syncSettings.domainRules}
            onImport={handleImport}
          />

          <ExportSessionsWizard
            open={exportSessionsOpen}
            onOpenChange={makeCloseHandler(setExportSessionsOpen)}
          />

          <ImportSessionsWizard
            open={importSessionsOpen}
            onOpenChange={makeCloseHandler(setImportSessionsOpen)}
          />

          <ExportWorkspaceDialog
            open={exportWorkspaceOpen}
            onOpenChange={makeCloseHandler(setExportWorkspaceOpen)}
          />

          <ImportWorkspaceDialog
            open={importWorkspaceOpen}
            onOpenChange={makeCloseHandler(setImportWorkspaceOpen)}
          />
        </Box>
      )}
    </PageLayout>
  );
}
