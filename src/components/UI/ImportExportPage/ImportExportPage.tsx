import React from 'react';
import { Button, Flex, Box } from '@radix-ui/themes';
import { Download, Upload, FileText } from 'lucide-react';
import { z } from 'zod';
import { PageLayout } from '../PageLayout/PageLayout';
import { getMessage } from '../../../utils/i18n';
import { showNotification } from '../../../utils/notifications';
import type { SyncSettings } from '../../../types/syncSettings';
import { domainRuleSchema } from '../../../schemas/domainRule';

interface ImportExportPageProps {
  syncSettings: SyncSettings;
  onSettingsUpdate: (settings: SyncSettings) => void;
}

// Schéma Zod pour valider les données exportées/importées
const ExportDataSchema = z.object({
  domainRules: z.array(
    domainRuleSchema.and(z.object({
      enabled: z.boolean()
    }))
  )
  // Espace pour ajouter d'autres paramètres futurs
  // regexPresets: z.array(...).optional(),
  // otherSettings: z.object(...).optional()
});

type ExportData = z.infer<typeof ExportDataSchema>;

export function ImportExportPage({ syncSettings, onSettingsUpdate }: ImportExportPageProps) {
  const handleExport = () => {
    // Créer l'objet d'export avec seulement les domainRules pour l'instant
    const exportData: ExportData = {
      domainRules: syncSettings.domainRules
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "smarttab_organizer_rules.json";
    a.click();
    showNotification({
      title: getMessage('extensionName'),
      message: getMessage('exportMessage'),
      type: 'success'
    });
  };

  const handleImportClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const rawData = JSON.parse(re.target?.result as string);
          
          // Validation avec Zod
          const validatedData = ExportDataSchema.parse(rawData);
          
          // Mise à jour seulement des domainRules
          const updatedSettings: SyncSettings = {
            ...syncSettings,
            domainRules: validatedData.domainRules as SyncSettings['domainRules']
          };
          
          onSettingsUpdate(updatedSettings);
          showNotification({
            title: getMessage('extensionName'),
            message: getMessage('importSuccess'),
            type: 'success'
          });
        } catch (error) {
          const errorMessage = error instanceof z.ZodError
            ? getMessage('importError') + ' Structure de fichier invalide.'
            : getMessage('importError') + (error as Error).message;
          showNotification({
            title: getMessage('extensionName'),
            message: errorMessage,
            type: 'error'
          });
        }
      };
      reader.readAsText(file);
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  return (
    <PageLayout
      titleKey="importExportTab"
      theme="IMPORT"
      icon={FileText}
      syncSettings={syncSettings}
    >
      {() => (
        <Box>
          <Flex gap="3">
            <Button onClick={handleExport} variant="solid">
              <Download size={16} />
              {getMessage('exportSettings')}
            </Button>
            <Button onClick={handleImportClick} variant="solid">
              <Upload size={16} />
              {getMessage('importSettings')}
            </Button>
          </Flex>
        </Box>
      )}
    </PageLayout>
  );
}