import React, { useState, useCallback } from 'react';
import { Button, Flex, Box, Card, Text, Grid } from '@radix-ui/themes';
import { Download, Upload, FileText } from 'lucide-react';
import { PageLayout } from '../PageLayout/PageLayout';
import { getMessage } from '../../../utils/i18n';
import { ExportWizard } from './ExportWizard';
import { ImportWizard } from './ImportWizard';
import type { SyncSettings, DomainRuleSetting } from '../../../types/syncSettings';

interface ImportExportPageProps {
  syncSettings: SyncSettings;
  onSettingsUpdate: (settings: SyncSettings) => void;
}

export function ImportExportPage({ syncSettings, onSettingsUpdate }: ImportExportPageProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

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
        <Box>
          <Grid
            columns={{ initial: '1', sm: '2' }}
            gap="4"
          >
            {/* Export Card */}
            <Card size="3">
              <Flex direction="column" gap="3" align="start" style={{ height: '100%' }}>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-2)',
                      backgroundColor: 'var(--accent-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Download size={20} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
                  </Box>
                  <Text size="4" weight="bold">
                    {getMessage('exportRulesTitle')}
                  </Text>
                </Flex>

                <Text size="2" color="gray" style={{ flex: 1 }}>
                  {getMessage('exportRulesDescription')}
                </Text>

                <Button
                  variant="solid"
                  onClick={() => setExportOpen(true)}
                  disabled={syncSettings.domainRules.length === 0}
                >
                  <Download size={16} aria-hidden="true" />
                  {getMessage('exportButton')}
                </Button>
              </Flex>
            </Card>

            {/* Import Card */}
            <Card size="3">
              <Flex direction="column" gap="3" align="start" style={{ height: '100%' }}>
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-2)',
                      backgroundColor: 'var(--accent-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Upload size={20} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
                  </Box>
                  <Text size="4" weight="bold">
                    {getMessage('importRulesTitle')}
                  </Text>
                </Flex>

                <Text size="2" color="gray" style={{ flex: 1 }}>
                  {getMessage('importRulesDescription')}
                </Text>

                <Button variant="solid" onClick={() => setImportOpen(true)}>
                  <Upload size={16} aria-hidden="true" />
                  {getMessage('importButton')}
                </Button>
              </Flex>
            </Card>
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
        </Box>
      )}
    </PageLayout>
  );
}
