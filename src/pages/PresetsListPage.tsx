
import React, { useState } from 'react';
import { Button, Flex, Box, Text } from '@radix-ui/themes';

import { Plus } from 'lucide-react';
import * as Toast from '@radix-ui/react-toast';

import { PageLayout } from '../components/UI/PageLayout/PageLayout';
import { RegexPresetCard } from '../components/Core/RegexPreset/RegexPresetCard';
import { RegexPresetDialog } from '../components/Core/RegexPreset/RegexPresetDialog';
import { RegexPresetClipboardProvider, useRegexPresetClipboard } from '../providers/clipboard';
import { useSyncedSettings } from '../hooks/useSyncedSettings';
import { useModal } from '../hooks/useModal';
import { getMessage } from '../utils/i18n';
import { type RegexPreset } from '../schemas/regexPreset';

// Wrapper component to use the clipboard context
const PresetsList = () => {
  const { settings, setRegexPresets, isLoaded } = useSyncedSettings();
  const { copy, paste, isPasteAvailable } = useRegexPresetClipboard();
  const { isOpen, openForCreate, openForEdit, close, editingItem } = useModal<RegexPreset>();
  const [toast, setToast] = useState<{ title: string, open: boolean }>({ title: '', open: false });

  const showToast = (title: string) => {
    setToast({ title, open: true });
  };

  const handleCreate = () => openForCreate();

  const handleEdit = (preset: RegexPreset) => {
    console.log('Editing preset:', preset);
    openForEdit(preset);
  };

  const handleDelete = (id: string) => {
    if (!settings) return;
    const presetToDelete = settings.regexPresets.find(p => p.id === id);
    if (presetToDelete) {
      const updatedPresets = settings.regexPresets.filter(p => p.id !== id);
      setRegexPresets(updatedPresets);
      showToast(getMessage('toastDeleted').replace('{item}', presetToDelete.name));
    }
  };

  const handleCopy = (preset: RegexPreset) => {
    copy(preset);
    showToast(getMessage('toastCopied').replace('{item}', preset.name));
  };

  const handlePaste = () => {
    if (!settings) return;
    const newItem = paste(settings.regexPresets);
    if (newItem) {
      const updatedPresets = [...settings.regexPresets, newItem];
      setRegexPresets(updatedPresets);
      showToast(getMessage('toastPasted').replace('{item}', newItem.name));
    }
  };

  const handleSubmit = (preset: RegexPreset) => {
    if (!settings) return;
    const isEditing = settings.regexPresets.some(p => p.id === preset.id);
    const updatedPresets = isEditing
      ? settings.regexPresets.map(p => p.id === preset.id ? preset : p)
      : [...settings.regexPresets, preset];
    setRegexPresets(updatedPresets);
    showToast(isEditing ? `"${preset.name}" saved.` : `"${preset.name}" created.`);
    close();
  };

  if (!isLoaded || !settings) {
    return <Text>{getMessage('loadingText')}</Text>;
  }

  return (
    <>
      <PageLayout
        titleKey="regexPresetsTab"
        theme="regexPresets"
        syncSettings={settings}
        headerActions={<Button onClick={handleCreate}><Plus /> {getMessage('addPreset')}</Button>}
      >
        {(settings) => (
          <>
            <Flex direction="column" gap="3">
              {settings.regexPresets.length === 0 ? (
                <Text>{getMessage('noRegexPresetsDefined')}</Text>
              ) : (
                settings.regexPresets.map(preset => (
                  <RegexPresetCard
                    key={preset.id}
                    preset={preset}
                    onEdit={() => handleEdit(preset)}
                    onDelete={() => handleDelete(preset.id)}
                    onCopy={() => handleCopy(preset)}
                    onPaste={handlePaste}
                    isPasteAvailable={isPasteAvailable}
                    existingItems={settings.regexPresets}
                  />
                ))
              )}
            </Flex>

            <RegexPresetDialog
              isOpen={isOpen}
              onClose={close}
              onSubmit={handleSubmit}
              regexPreset={editingItem}
              syncSettings={settings}
            />
          </>
        )}
      </PageLayout>

      <Toast.Root open={toast.open} onOpenChange={(open) => setToast(prev => ({...prev, open}))} duration={3000}>
        <Toast.Title>{toast.title}</Toast.Title>
      </Toast.Root>
      <Toast.Viewport style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }} />
    </>
  );
};

// Main component with providers
const PresetsListPage = () => (
  <RegexPresetClipboardProvider>
    <Toast.Provider swipeDirection="right">
      <PresetsList />
    </Toast.Provider>
  </RegexPresetClipboardProvider>
);

export default PresetsListPage;
