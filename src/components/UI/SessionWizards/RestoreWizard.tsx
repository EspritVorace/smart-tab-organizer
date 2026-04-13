import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, Flex, Button, Text, Separator, Box, RadioGroup, Callout } from '@radix-ui/themes';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { SessionsTheme } from '../../Form/themes';
import { TabTree } from '../../Core/TabTree/TabTree';
import { ConflictResolutionStep } from './ConflictResolutionStep';
import { getMessage } from '../../../utils/i18n';
import { showSuccessNotification, showNotification } from '../../../utils/notifications';
import { sessionToTabTreeData } from '../../../utils/sessionUtils';
import {
  analyzeConflicts,
  type ConflictAnalysis,
  type DuplicateTabAction,
  type GroupConflictAction,
  type ConflictResolution,
} from '../../../utils/conflictDetection';
import { restoreTabs } from '../../../utils/tabRestore';
import type { Session } from '../../../types/session';
import type { TabTreeData } from '../../../types/tabTree';

type RestoreTarget = 'current' | 'new';

interface RestoreWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
}

export function RestoreWizard({ open, onOpenChange, session }: RestoreWizardProps) {
  // Step management
  const [step, setStep] = useState(0);

  // Step 0 state: tab selection + destination
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [numericIdToSavedTabId, setNumericIdToSavedTabId] = useState<Map<number, string>>(
    new Map(),
  );
  const [treeData, setTreeData] = useState<TabTreeData | null>(null);
  const [target, setTarget] = useState<RestoreTarget>('current');

  // Conflict state
  const [conflictAnalysis, setConflictAnalysis] = useState<ConflictAnalysis | null>(null);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [duplicateTabAction, setDuplicateTabAction] = useState<DuplicateTabAction>('skip');
  const [groupActions, setGroupActions] = useState<Map<string, GroupConflictAction>>(new Map());

  // Restore state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!open || !session) return;
    setStep(0);
    setTarget('current');
    setConflictAnalysis(null);
    setHasConflicts(false);
    setDuplicateTabAction('skip');
    setGroupActions(new Map());
    setRestoreError(null);

    const { treeData: td, numericIdToSavedTabId: idMap } = sessionToTabTreeData(session);
    setTreeData(td);
    setNumericIdToSavedTabId(idMap);
    setSelectedTabIds(new Set(idMap.keys()));
  }, [open, session]);

  // Derive selected SavedTab UUIDs
  const selectedSavedTabIds = useMemo(() => {
    const ids = new Set<string>();
    for (const numId of selectedTabIds) {
      const uuid = numericIdToSavedTabId.get(numId);
      if (uuid) ids.add(uuid);
    }
    return ids;
  }, [selectedTabIds, numericIdToSavedTabId]);

  // Get the selected tabs and groups from the session
  const getSelectedData = useCallback(() => {
    if (!session) return { tabs: [], groups: [] };

    const selectedTabs = session.ungroupedTabs.filter(t => selectedSavedTabIds.has(t.id));
    const selectedGroups = session.groups
      .map(g => ({ ...g, tabs: g.tabs.filter(t => selectedSavedTabIds.has(t.id)) }))
      .filter(g => g.tabs.length > 0);

    return { tabs: selectedTabs, groups: selectedGroups };
  }, [session, selectedSavedTabIds]);

  // Execute restore
  const executeRestore = useCallback(async (
    analysis: ConflictAnalysis | null,
    dupAction: DuplicateTabAction,
    grpActions: Map<string, GroupConflictAction>,
  ) => {
    if (!session) return;
    setIsRestoring(true);
    setRestoreError(null);

    try {
      const { tabs, groups } = getSelectedData();
      const conflictResolution: ConflictResolution = {
        duplicateTabAction: dupAction,
        groupActions: grpActions,
      };

      const result = await restoreTabs({
        tabs,
        groups,
        target,
        conflictResolution: target === 'current' ? conflictResolution : undefined,
        conflictAnalysis: target === 'current' ? analysis ?? undefined : undefined,
      });

      onOpenChange(false);

      if (result.errors.length > 0) {
        showNotification({
          title: getMessage('restoreNotificationTitle'),
          message: getMessage('restoreNotificationError', [String(result.errors.length)]),
          type: 'error',
        });
      } else {
        showSuccessNotification(
          getMessage('restoreNotificationTitle'),
          getMessage('restoreNotificationMessage', [
            String(result.tabsCreated),
            String(result.duplicatesSkipped),
          ]),
        );
      }
    } catch {
      setRestoreError(getMessage('restoreError'));
    } finally {
      setIsRestoring(false);
    }
  }, [session, getSelectedData, target]);

  // Step 0 button: analyze conflicts (if current window), then restore or show conflict step
  const handleRestoreOrNext = useCallback(async () => {
    if (target === 'new') {
      await executeRestore(null, duplicateTabAction, groupActions);
      return;
    }

    // Current window — analyze conflicts first
    setIsAnalyzing(true);
    setRestoreError(null);
    try {
      const { tabs, groups } = getSelectedData();
      const analysis = await analyzeConflicts(tabs, groups);
      setConflictAnalysis(analysis);

      const conflicts =
        analysis.duplicateTabs.length > 0 || analysis.conflictingGroups.length > 0;
      setHasConflicts(conflicts);

      if (conflicts) {
        // Initialize group actions for conflicting groups
        const actions = new Map<string, GroupConflictAction>();
        for (const gc of analysis.conflictingGroups) {
          actions.set(gc.savedGroup.id, 'merge');
        }
        setGroupActions(actions);
        setStep(1);
      } else {
        await executeRestore(analysis, duplicateTabAction, groupActions);
      }
    } catch {
      setRestoreError(getMessage('restoreAnalysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [target, getSelectedData, executeRestore, duplicateTabAction, groupActions]);

  const handleGroupActionChange = useCallback((groupId: string, action: GroupConflictAction) => {
    setGroupActions(prev => {
      const next = new Map(prev);
      next.set(groupId, action);
      return next;
    });
  }, []);

  if (!session) return null;

  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content data-testid="wizard-restore" style={{ maxWidth: 600 }}>
          <Dialog.Title>
            <Flex align="center" gap="2">
              <RotateCcw size={18} aria-hidden="true" />
              {getMessage('restoreTitle', [session.name])}
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('restoreDescription')}
          </Dialog.Description>

          <Separator size="4" mt="3" style={{ opacity: 0.3 }} />

          {/* Step 0: Selection + Destination */}
          {step === 0 && (
            <Box data-testid="wizard-restore-step-0" mt="4">
              <Flex direction="column" gap="3">
                <Text size="2" weight="medium">
                  {getMessage('restoreSelectTabs')}
                </Text>
                {treeData && (
                  <TabTree
                    data={treeData}
                    selectedTabIds={selectedTabIds}
                    onSelectionChange={setSelectedTabIds}
                    maxHeight={280}
                  />
                )}

                <Separator size="4" style={{ opacity: 0.3 }} />

                <Text size="2" weight="medium">
                  {getMessage('restoreDestination')}
                </Text>
                <RadioGroup.Root
                  data-testid="wizard-restore-radio-destination"
                  value={target}
                  onValueChange={v => setTarget(v as RestoreTarget)}
                >
                  <Flex direction="column" gap="2">
                    <Text size="2" asChild>
                      <label>
                        <Flex align="center" gap="2">
                          <RadioGroup.Item data-testid="wizard-restore-radio-current-window" value="current" />
                          {getMessage('restoreTargetCurrent')}
                        </Flex>
                      </label>
                    </Text>
                    <Text size="2" asChild>
                      <label>
                        <Flex align="center" gap="2">
                          <RadioGroup.Item data-testid="wizard-restore-radio-new-window" value="new" />
                          {getMessage('restoreTargetNew')}
                        </Flex>
                      </label>
                    </Text>
                  </Flex>
                </RadioGroup.Root>
              </Flex>
            </Box>
          )}

          {/* Step 1: Conflict resolution */}
          {step === 1 && hasConflicts && conflictAnalysis && (
            <Box data-testid="wizard-restore-step-1" mt="4">
              <ConflictResolutionStep
                analysis={conflictAnalysis}
                duplicateTabAction={duplicateTabAction}
                onDuplicateTabActionChange={setDuplicateTabAction}
                groupActions={groupActions}
                onGroupActionChange={handleGroupActionChange}
              />
            </Box>
          )}

          {restoreError && (
            <Callout.Root color="red" variant="soft" mt="3">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{restoreError}</Callout.Text>
            </Callout.Root>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

          {/* Footer */}
          <Flex gap="3" justify="end" mt="3">
            {step === 0 && (
              <>
                <Dialog.Close>
                  <Button variant="soft" color="gray" disabled={isAnalyzing || isRestoring}>
                    {getMessage('cancel')}
                  </Button>
                </Dialog.Close>
                <Button
                  data-testid="wizard-restore-btn-restore"
                  onClick={handleRestoreOrNext}
                  disabled={selectedTabIds.size === 0 || isAnalyzing || isRestoring}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {isAnalyzing ? getMessage('loadingText') : getMessage('sessionRestore')}
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setStep(0)}
                  disabled={isRestoring}
                >
                  {getMessage('previous')}
                </Button>
                <Button
                  onClick={() => executeRestore(conflictAnalysis, duplicateTabAction, groupActions)}
                  disabled={isRestoring}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {getMessage('sessionRestore')}
                </Button>
              </>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}
