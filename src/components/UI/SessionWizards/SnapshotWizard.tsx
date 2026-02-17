import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, Flex, Button, Text, Separator, Box, TextField, Callout } from '@radix-ui/themes';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { WizardStepper } from '../WizardStepper';
import { TabTree } from '../../Core/TabTree/TabTree';
import { getMessage } from '../../../utils/i18n';
import { captureCurrentTabs } from '../../../utils/tabCapture';
import { createSessionFromSelection, formatSessionDate } from '../../../utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '../../../types/session';
import type { TabTreeData } from '../../Core/TabTree/tabTreeTypes';

interface SnapshotWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: Session) => Promise<void>;
}

export function SnapshotWizard({ open, onOpenChange, onSave }: SnapshotWizardProps) {
  const [step, setStep] = useState(0);
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
  const [saveDone, setSaveDone] = useState(false);

  const steps = [
    { label: getMessage('snapshotStepSelection') },
    { label: getMessage('snapshotStepConfirmation') },
  ];

  // Reset and capture on open
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSessionName(
      `${getMessage('snapshotDefaultName')} ${formatSessionDate(new Date().toISOString())}`,
    );
    setTreeData(null);
    setSelectedTabIds(new Set());
    setSaveError(null);
    setSaveDone(false);
    setIsCapturing(true);

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
  }, [open]);

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
      );
      await onSave(session);
      setSaveDone(true);
    } catch {
      setSaveError(getMessage('sessionSaveError'));
    } finally {
      setIsSaving(false);
    }
  }, [ungroupedTabs, groups, selectedSavedTabIds, sessionName, onSave]);

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 580 }}>
          <Dialog.Title>{getMessage('snapshotTitle')}</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('snapshotDescription')}
          </Dialog.Description>

          <WizardStepper steps={steps} currentStep={step} />
          <Separator size="4" style={{ opacity: 0.3 }} />

          {/* Step 0: Selection */}
          {step === 0 && (
            <Box mt="4">
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    {getMessage('sessionNameLabel')}
                  </Text>
                  <TextField.Root
                    value={sessionName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSessionName(e.target.value)
                    }
                    placeholder={getMessage('sessionNamePlaceholder')}
                    maxLength={100}
                    aria-label={getMessage('sessionNameLabel')}
                  />
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
                    maxHeight={320}
                  />
                ) : null}
              </Flex>
            </Box>
          )}

          {/* Step 1: Confirmation */}
          {step === 1 && !saveDone && (
            <Box mt="4">
              <Flex direction="column" gap="2">
                <Text size="2">
                  {getMessage('snapshotConfirmMessage', [
                    sessionName.trim(),
                    String(selectedSavedTabIds.size),
                  ])}
                </Text>
              </Flex>
              {saveError && (
                <Callout.Root color="red" variant="soft" mt="3">
                  <Callout.Icon>
                    <AlertCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>{saveError}</Callout.Text>
                </Callout.Root>
              )}
            </Box>
          )}

          {step === 1 && saveDone && (
            <Box mt="4">
              <Callout.Root color="green" variant="soft">
                <Callout.Icon>
                  <CheckCircle size={16} />
                </Callout.Icon>
                <Callout.Text>
                  {getMessage('snapshotSaveSuccess', [sessionName.trim()])}
                </Callout.Text>
              </Callout.Root>
            </Box>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          {/* Footer */}
          <Flex gap="3" justify="end" mt="3">
            {step === 0 && (
              <>
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {getMessage('cancel')}
                  </Button>
                </Dialog.Close>
                <Button
                  onClick={() => setStep(1)}
                  disabled={!sessionName.trim() || selectedTabIds.size === 0 || isCapturing}
                >
                  {getMessage('next')}
                </Button>
              </>
            )}
            {step === 1 && !saveDone && (
              <>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setStep(0)}
                  disabled={isSaving}
                >
                  {getMessage('previous')}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Camera size={14} aria-hidden="true" />
                  {getMessage('snapshotSaveButton')}
                </Button>
              </>
            )}
            {step === 1 && saveDone && (
              <Dialog.Close>
                <Button variant="soft">{getMessage('close')}</Button>
              </Dialog.Close>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
