import React, { useState } from 'react';
import { Button, Flex, Box } from '@radix-ui/themes';
import * as Toast from '@radix-ui/react-toast';
import { Download, Upload, FileText } from 'lucide-react';
import { z } from 'zod';
import { PageLayout } from '../PageLayout/PageLayout';
import { getMessage } from '../../../utils/i18n';
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
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

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
    showToast(getMessage("exportMessage"), 'success');
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
            domainRules: validatedData.domainRules
          };
          
          onSettingsUpdate(updatedSettings);
          showToast(getMessage("importSuccess"), 'success');
        } catch (error) {
          if (error instanceof z.ZodError) {
            showToast(getMessage("importError") + " Structure de fichier invalide.", 'error');
          } else {
            showToast(getMessage("importError") + (error as Error).message, 'error');
          }
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
          
          <Toast.Provider swipeDirection="right">
            <Toast.Root open={toastOpen} onOpenChange={setToastOpen}>
              <Toast.Title>
                {toastType === 'success' ? '✓' : '✗'} {toastMessage}
              </Toast.Title>
            </Toast.Root>
            <Toast.Viewport />
          </Toast.Provider>
        </Box>
      )}
    </PageLayout>
  );
}