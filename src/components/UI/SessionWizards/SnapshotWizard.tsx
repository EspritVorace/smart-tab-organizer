import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog, Flex, Button, Text, Separator, Box, TextField,
  Callout,
} from '@radix-ui/themes';
import { Camera, AlertCircle, Pin } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { TabTree } from '../../Core/TabTree/TabTree';
import { CategoryPicker } from '../../Core/DomainRule/CategoryPicker';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification } from '../../../utils/notifications';
import { captureCurrentTabs } from '../../../utils/tabCapture';
import { createSessionFromSelection, formatSessionDate } from '../../../utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '../../../types/session';
import type { TabTreeData } from '../../Core/TabTree/tabTreeTypes';

interface SnapshotWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: Session) => Promise<void>;
  /** 'snapshot' (default) or 'profile' for pinned profile creation */
  mode?: 'snapshot' | 'profile';
}

export function SnapshotWizard({ open, onOpenChange, onSave, mode = 'snapshot' }: SnapshotWizardProps) {
  const isProfile = mode === 'profile';

  const [sessionName, setSessionName] = useState('');
  const [treeData, setTreeData] = useState<TabTreeData | null>(null);
  const [ungroupedTabs, setUngroupedTabs] = useState<SavedTab[]>([]);
  const [groups, setGroups] = useState<SavedTabGroup[]>([]);
  const [numericIdToSavedTabId, setNumericIdToSavedTabId] = useState<Map<number, string>>(
    new Map(),
  );
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Reset and capture on open
  useEffect(() => {
    if (!open) return;
    setSessionName(
      isProfile
        ? getMessage('profileDefaultName')
        : `${getMessage('snapshotDefaultName')} ${formatSessionDate(new Date().toISOString())}`,
    );
    setTreeData(null);
    setSelectedTabIds(new Set());
    setSaveError(null);
    setIsCapturing(true);
    setCategoryId(null);

    captureCurrentTabs()
      .then(data => {
        setTreeData(data.treeData);
        setUngroupedTabs(data.ungroupedTabs);
        setGroups(data.groups);
        setNumericIdToSavedTabId(data.numericIdToSavedTabId);
        // Pre-select all tabs
        setSelectedTabIds(new Set(data.numericIdToSavedTabId.keys()));
        setIsCapturing(false);
      })
      .catch(() => {
        setIsCapturing(false);
      });
  }, [open, isProfile]);

  // Derive selected SavedTab UUIDs from selected numeric IDs
  const selectedSavedTabIds = useMemo(() => {
    const ids = new Set<string>();
    for (const numId of selectedTabIds) {
      const uuid = numericIdToSavedTabId.get(numId);
      if (uuid) ids.add(uuid);
    }
    return ids;
  }, [selectedTabIds, numericIdToSavedTabId]);

  const handleSave = useCallback(async () => {
    if (!sessionName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const session = createSessionFromSelection(
        ungroupedTabs,
        groups,
        selectedSavedTabIds,
        sessionName.trim(),
        {
          isPinned: isProfile ? true : undefined,
          categoryId: categoryId ?? null,
        },
      );
      await onSave(session);
      onOpenChange(false);
      const titleKey = isProfile ? 'profileNotificationTitle' : 'snapshotNotificationTitle';
      showSuccessNotification(
        getMessage(titleKey),
        getMessage('sessionNotificationMessage', [sessionName.trim()]),
      );
    } catch {
      setSaveError(getMessage('sessionSaveError'));
    } finally {
      setIsSaving(false);
    }
  }, [ungroupedTabs, groups, selectedSavedTabIds, sessionName, isProfile, categoryId, onSave]);

  const titleKey = isProfile ? 'profileTitle' : 'snapshotTitle';
  const descriptionKey = isProfile ? 'profileDescription' : 'snapshotDescription';
  const saveButtonKey = isProfile ? 'profileSaveButton' : 'snapshotSaveButton';
  const SaveIcon = isProfile ? Pin : Camera;

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content
          style={{ maxWidth: 580 }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[aria-label]');
            input?.focus();
          }}
        >
          <Dialog.Title>
            <Flex align="center" gap="2">
              <SaveIcon size={18} aria-hidden="true" />
              {getMessage(titleKey)}
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage(descriptionKey)}
          </Dialog.Description>

          <Box mt="4">
            <Flex direction="column" gap="3">
              {/* Name + category inline (category icon left of the input) */}
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  {getMessage('sessionNameLabel')}
                </Text>
                <Flex align="center" gap="2">
                  <CategoryPicker value={categoryId as any} onChange={setCategoryId} />
                  <Box style={{ flex: 1 }}>
                    <TextField.Root
                      value={sessionName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSessionName(e.target.value)
                      }
                      placeholder={getMessage('sessionNamePlaceholder')}
                      maxLength={100}
                      aria-label={getMessage('sessionNameLabel')}
                      style={{ width: '100%' }}
                    />
                  </Box>
                </Flex>
              </Flex>

              <Text size="2" weight="medium">
                {getMessage('snapshotSelectTabs')}
              </Text>
              {isCapturing ? (
                <Text size="2" color="gray">
                  {getMessage('loadingText')}
                </Text>
              ) : treeData ? (
                <TabTree
                  data={treeData}
                  selectedTabIds={selectedTabIds}
                  onSelectionChange={setSelectedTabIds}
                  maxHeight={280}
                />
              ) : null}
            </Flex>
          </Box>

          {saveError && (
            <Callout.Root color="red" variant="soft" mt="3">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{saveError}</Callout.Text>
            </Callout.Root>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          {/* Footer */}
          <Flex gap="3" justify="end" mt="3">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isSaving}>
                {getMessage('cancel')}
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSave}
              disabled={!sessionName.trim() || selectedTabIds.size === 0 || isCapturing || isSaving}
            >
              <SaveIcon size={14} aria-hidden="true" />
              {getMessage(saveButtonKey)}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
