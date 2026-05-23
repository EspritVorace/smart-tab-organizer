import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog, Flex, Button, Text,
  TextArea, Callout,
} from '@radix-ui/themes';
import { Camera, AlertCircle, Info, RotateCw } from 'lucide-react';
import { TabTree } from '@/components/Core/TabTree/TabTree';
import { TextFieldWithCategory } from '@/components/Form/FormFields/TextFieldWithCategory';
import { WizardModal } from '@/components/UI/WizardModal';
import { getMessage } from '@/utils/i18n';
import { showSuccessToast } from '@/utils/toast';
import { captureCurrentTabs } from '@/utils/tabCapture';
import { createSessionFromSelection, formatSessionDate, resolveTabUuids } from '@/utils/sessionUtils';
import type { Session, SavedTab, SavedTabGroup } from '@/types/session';
import type { TabTreeData } from '@/types/tabTree';

interface SnapshotWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: Session) => Promise<void>;
  existingSessions: Session[];
  /** Chrome numeric groupId: if set, pre-select only that group's tabs and use the group title as default name. */
  initialGroupId?: number;
  /**
   * When set, switches the wizard to "refresh mode": pre-fills name/note/category from this
   * session, the uniqueness check excludes its id, and `onRefresh` is called instead of `onSave`
   * with an updated Session object preserving id/createdAt/isPinned/position.
   */
  refreshSession?: Session;
  /** Called on save in refresh mode. Receives the updated Session payload to persist via updateSession. */
  onRefresh?: (session: Session) => Promise<void>;
}

export function SnapshotWizard({ open, onOpenChange, onSave, existingSessions, initialGroupId, refreshSession, onRefresh }: SnapshotWizardProps) {
  const isRefresh = refreshSession !== undefined;
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
  const [note, setNote] = useState('');
  const [cameFromActiveGroup, setCameFromActiveGroup] = useState(false);

  // Reset and capture on open
  useEffect(() => {
    if (!open) return;
    setSessionName(
      refreshSession
        ? refreshSession.name
        : `${getMessage('snapshotDefaultName')} ${formatSessionDate(new Date().toISOString())}`,
    );
    setTreeData(null);
    setSelectedTabIds(new Set());
    setSaveError(null);
    setIsCapturing(true);
    setCategoryId(refreshSession?.categoryId ?? null);
    setNote(refreshSession?.note ?? '');
    setCameFromActiveGroup(false);

    captureCurrentTabs()
      .then(data => {
        setTreeData(data.treeData);
        setUngroupedTabs(data.ungroupedTabs);
        setGroups(data.groups);
        setNumericIdToSavedTabId(data.numericIdToSavedTabId);

        if (initialGroupId !== undefined) {
          const savedGroupId = data.chromeGroupIdToSavedGroupId.get(initialGroupId);
          const targetGroup = data.groups.find(g => g.id === savedGroupId);
          if (targetGroup) {
            const groupTabUuids = new Set(targetGroup.tabs.map(t => t.id));
            const preSelected = new Set<number>();
            for (const [numId, uuid] of data.numericIdToSavedTabId) {
              if (groupTabUuids.has(uuid)) preSelected.add(numId);
            }
            setSelectedTabIds(preSelected);
            if (!refreshSession && targetGroup.title) {
              setSessionName(targetGroup.title);
            }
            setCameFromActiveGroup(true);
            setIsCapturing(false);
            return;
          }
        }

        // Default: pre-select all tabs
        setSelectedTabIds(new Set(data.numericIdToSavedTabId.keys()));
        setIsCapturing(false);
      })
      .catch(() => {
        setIsCapturing(false);
      });
  }, [open, initialGroupId, refreshSession]);

  const showGroupCallout =
    cameFromActiveGroup && selectedTabIds.size < numericIdToSavedTabId.size;

  // Derive selected SavedTab UUIDs from selected numeric IDs
  const selectedSavedTabIds = useMemo(
    () => resolveTabUuids(selectedTabIds, numericIdToSavedTabId),
    [selectedTabIds, numericIdToSavedTabId],
  );

  const handleSave = useCallback(async () => {
    const trimmed = sessionName.trim();
    if (!trimmed) return;
    const isDuplicate = existingSessions.some(
      s => s.id !== refreshSession?.id && s.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      setSaveError(getMessage('errorSessionNameUnique'));
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const session = createSessionFromSelection(
        ungroupedTabs,
        groups,
        selectedSavedTabIds,
        trimmed,
        { categoryId: categoryId ?? null, note: note || undefined },
      );
      if (isRefresh && refreshSession && onRefresh) {
        const updated: Session = {
          ...session,
          id: refreshSession.id,
          createdAt: refreshSession.createdAt,
          isPinned: refreshSession.isPinned,
          position: refreshSession.position,
        };
        await onRefresh(updated);
        onOpenChange(false);
        showSuccessToast(
          getMessage('refreshNotificationTitle'),
          getMessage('refreshNotificationMessage', [trimmed]),
        );
      } else {
        await onSave(session);
        onOpenChange(false);
        showSuccessToast(
          getMessage('snapshotNotificationTitle'),
          getMessage('sessionNotificationMessage', [trimmed]),
        );
      }
    } catch {
      setSaveError(getMessage('sessionSaveError'));
    } finally {
      setIsSaving(false);
    }
  }, [ungroupedTabs, groups, selectedSavedTabIds, sessionName, categoryId, note, onSave, onOpenChange, existingSessions, isRefresh, refreshSession, onRefresh]);

  const wizardIcon = isRefresh ? RotateCw : Camera;
  const wizardTitle = isRefresh ? getMessage('refreshTitle') : getMessage('snapshotTitle');
  const wizardDescription = isRefresh ? getMessage('refreshDescription') : getMessage('snapshotDescription');
  const saveLabel = isRefresh ? getMessage('refreshSaveButton') : getMessage('snapshotSaveButton');
  const testIdPrefix = isRefresh ? 'wizard-refresh' : 'wizard-snapshot';

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      data-testid={testIdPrefix}
      icon={wizardIcon}
      title={wizardTitle}
      description={wizardDescription}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[aria-label]');
        input?.focus();
      }}
    >
      <WizardModal.Body>
        <Flex direction="column" gap="3">
          {showGroupCallout && (
            <Callout.Root
              color="blue"
              variant="soft"
              highContrast
              data-testid={`${testIdPrefix}-group-callout`}
            >
              <Callout.Icon>
                <Info size={16} />
              </Callout.Icon>
              <Callout.Text>{getMessage('snapshotActiveGroupCallout')}</Callout.Text>
            </Callout.Root>
          )}
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {getMessage('sessionNameLabel')}
            </Text>
            <TextFieldWithCategory
              data-testid={`${testIdPrefix}-field-name`}
              value={sessionName}
              onChange={setSessionName}
              placeholder={getMessage('sessionNamePlaceholder')}
              maxLength={100}
              aria-label={getMessage('sessionNameLabel')}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
            />
          </Flex>

          <Text size="2" weight="medium">
            {getMessage('snapshotSelectTabs')}
          </Text>
          {isCapturing && (
            <Text size="2" color="gray">
              {getMessage('loadingText')}
            </Text>
          )}
          {!isCapturing && treeData && (
            <TabTree
              data={treeData}
              selectedTabIds={selectedTabIds}
              onSelectionChange={setSelectedTabIds}
              maxHeight={280}
            />
          )}

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">
              {getMessage('sessionNoteLabel')}
            </Text>
            <TextArea
              data-testid={`${testIdPrefix}-field-notes`}
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              placeholder={getMessage('sessionNotePlaceholder')}
              resize="vertical"
              rows={3}
            />
          </Flex>

          {saveError && (
            <Callout.Root color="red" variant="soft">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{saveError}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>
      </WizardModal.Body>

      <WizardModal.Footer>
        <Dialog.Close>
          <Button data-testid={`${testIdPrefix}-btn-cancel`} variant="soft" color="gray" disabled={isSaving}>
            {getMessage('cancel')}
          </Button>
        </Dialog.Close>
        <Button
          data-testid={`${testIdPrefix}-btn-save`}
          onClick={handleSave}
          disabled={!sessionName.trim() || selectedTabIds.size === 0 || isCapturing || isSaving}
        >
          {isRefresh ? <RotateCw size={14} /> : <Camera size={14} />}
          {saveLabel}
        </Button>
      </WizardModal.Footer>
    </WizardModal>
  );
}
