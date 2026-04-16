import React, { useState, useCallback } from 'react';
import { Box, Grid } from '@radix-ui/themes';
import { Download, Upload, FileText } from 'lucide-react';
import { PageLayout } from '@/components/UI/PageLayout/PageLayout';
import { getMessage } from '@/utils/i18n';
import { ExportWizard } from '@/components/UI/ImportExportWizards/ExportWizard';
import { ImportWizard } from '@/components/UI/ImportExportWizards/ImportWizard';
import { ExportSessionsWizard } from '@/components/UI/ImportExportWizards/ExportSessionsWizard';
import { ImportSessionsWizard } from '@/components/UI/ImportExportWizards/ImportSessionsWizard';
import { ImportExportActionCard } from '@/components/UI/ImportExportWizards/ImportExportActionCard';
import { useSessions } from '@/hooks/useSessions';
import type { SyncSettings, DomainRuleSetting } from '@/types/syncSettings';

interface ImportExportPageProps {
  syncSettings: SyncSettings;
  onSettingsUpdate: (settings: SyncSettings) => void;
}

export function ImportExportPage({ syncSettings, onSettingsUpdate }: ImportExportPageProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportSessionsOpen, setExportSessionsOpen] = useState(false);
  const [importSessionsOpen, setImportSessionsOpen] = useState(false);

  const { sessions } = useSessions();

  const handleImport = useCallback((updatedRules: DomainRuleSetting[]) => {
    onSettingsUpdate({
      ...syncSettings,
      domainRules: updatedRules
    });
  }, [syncSettings, onSettingsUpdate]);

  return (
    <PageLayout
      titleKey="importExportTab"
      theme="IMPORT"
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
              buttonLabel={getMessage('exportSessionsButton')}
              onClick={() => setExportSessionsOpen(true)}
              disabled={sessions.length === 0}
            />

            <ImportExportActionCard
              testId="page-import-export-card-import-sessions"
              icon={Upload}
              title={getMessage('importSessionsTitle')}
              description={getMessage('importSessionsDescription')}
              buttonLabel={getMessage('importSessionsButton')}
              onClick={() => setImportSessionsOpen(true)}
            />
          </Grid>

          <ExportWizard
            open={exportOpen}
            onOpenChange={setExportOpen}
            rules={syncSettings.domainRules}
          />

          <ImportWizard
            open={importOpen}
            onOpenChange={setImportOpen}
            existingRules={syncSettings.domainRules}
            onImport={handleImport}
          />

          <ExportSessionsWizard
            open={exportSessionsOpen}
            onOpenChange={setExportSessionsOpen}
          />

          <ImportSessionsWizard
            open={importSessionsOpen}
            onOpenChange={setImportSessionsOpen}
          />
        </Box>
      )}
    </PageLayout>
  );
}
