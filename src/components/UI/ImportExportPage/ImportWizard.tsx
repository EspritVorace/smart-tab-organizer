import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Dialog, Flex, Button, Checkbox, Text, Separator, Badge, Box,
  ScrollArea, TextArea, SegmentedControl, Popover, Callout
} from '@radix-ui/themes';
import { Upload, FileUp, ClipboardPaste, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { z } from 'zod';
import { ImportTheme } from '../../Form/themes';
import { WizardStepper } from '../WizardStepper';
import { getMessage } from '../../../utils/i18n';
import { importDataSchema } from '../../../schemas/importExport';
import {
  classifyImportedRules,
  type RuleClassification,
  type ConflictingRule
} from '../../../utils/importClassification';
import { generateUUID } from '../../../utils/utils';
import type { DomainRuleSetting, SyncSettings } from '../../../types/syncSettings';

type ConflictMode = 'overwrite' | 'duplicate' | 'ignore';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRules: DomainRuleSetting[];
  onImport: (updatedRules: DomainRuleSetting[]) => void;
}

export function ImportWizard({ open, onOpenChange, existingRules, onImport }: ImportWizardProps) {
  const [step, setStep] = useState(0);
  const [sourceMode, setSourceMode] = useState<'file' | 'text'>('file');
  const [jsonText, setJsonText] = useState('');
  const [parsedRules, setParsedRules] = useState<DomainRuleSetting[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Step 2 state
  const [classification, setClassification] = useState<RuleClassification | null>(null);
  const [newRuleSelectedIds, setNewRuleSelectedIds] = useState<Set<string>>(new Set());
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite');

  // Step 3 state
  const [importDone, setImportDone] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; overwritten: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: getMessage('importStepSource') },
    { label: getMessage('importStepSelection') },
    { label: getMessage('importStepConfirm') },
  ];

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setSourceMode('file');
      setJsonText('');
      setParsedRules(null);
      setParseError(null);
      setFileName(null);
      setClassification(null);
      setNewRuleSelectedIds(new Set());
      setConflictMode('overwrite');
      setImportDone(false);
      setImportResult(null);
    }
  }, [open]);

  const validateJson = useCallback((text: string) => {
    if (!text.trim()) {
      setParsedRules(null);
      setParseError(null);
      return;
    }

    try {
      const rawData = JSON.parse(text);
      const validated = importDataSchema.parse(rawData);
      setParsedRules(validated.domainRules as DomainRuleSetting[]);
      setParseError(null);
    } catch (error) {
      setParsedRules(null);
      if (error instanceof SyntaxError) {
        setParseError(getMessage('invalidJson'));
      } else if (error instanceof z.ZodError) {
        const messages = error.issues.map(issue => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });
        setParseError(messages.join('\n'));
      } else {
        setParseError(getMessage('errorImportInvalidStructure'));
      }
    }
  }, []);

  const handleFileRead = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      validateJson(text);
    };
    reader.readAsText(file);
  }, [validateJson]);

  const handleTextChange = useCallback((text: string) => {
    setJsonText(text);
    validateJson(text);
  }, [validateJson]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  // Transition to step 2: classify rules
  const goToStep2 = useCallback(() => {
    if (!parsedRules) return;
    const result = classifyImportedRules(parsedRules, existingRules);
    setClassification(result);
    setNewRuleSelectedIds(new Set(result.newRules.map(r => r.id)));
    setStep(1);
  }, [parsedRules, existingRules]);

  const toggleNewRule = useCallback((id: string) => {
    setNewRuleSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Compute import count
  const importCount = useMemo(() => {
    if (!classification) return 0;
    const newCount = classification.newRules.filter(r => newRuleSelectedIds.has(r.id)).length;
    const conflictCount = conflictMode === 'ignore' ? 0 : classification.conflictingRules.length;
    return newCount + conflictCount;
  }, [classification, newRuleSelectedIds, conflictMode]);

  // Execute import
  const executeImport = useCallback(() => {
    if (!classification) return;

    const updatedRules = [...existingRules];
    let added = 0;
    let overwritten = 0;

    // Add new selected rules
    for (const rule of classification.newRules) {
      if (newRuleSelectedIds.has(rule.id)) {
        updatedRules.push(rule);
        added++;
      }
    }

    // Handle conflicts
    for (const conflict of classification.conflictingRules) {
      if (conflictMode === 'overwrite') {
        const idx = updatedRules.findIndex(
          r => r.label.toLowerCase() === conflict.existing.label.toLowerCase()
        );
        if (idx !== -1) {
          updatedRules[idx] = { ...conflict.imported, id: conflict.existing.id };
          overwritten++;
        }
      } else if (conflictMode === 'duplicate') {
        updatedRules.push({ ...conflict.imported, id: generateUUID() });
        added++;
      }
      // 'ignore': do nothing
    }

    onImport(updatedRules);
    setImportResult({ added, overwritten });
    setImportDone(true);
  }, [classification, existingRules, newRuleSelectedIds, conflictMode, onImport]);

  return (
    <ImportTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>{getMessage('importRulesTitle')}</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('importRulesDescription')}
          </Dialog.Description>

          <WizardStepper steps={steps} currentStep={step} />
          <Separator size="4" style={{ opacity: 0.3 }} />

          {/* Step 1: Source */}
          {step === 0 && (
            <Box mt="4">
              <SegmentedControl.Root
                value={sourceMode}
                onValueChange={(v: string) => setSourceMode(v as 'file' | 'text')}
                size="2"
              >
                <SegmentedControl.Item value="file">
                  {getMessage('sourceFile')}
                </SegmentedControl.Item>
                <SegmentedControl.Item value="text">
                  {getMessage('sourceText')}
                </SegmentedControl.Item>
              </SegmentedControl.Root>

              <Box mt="3">
                {sourceMode === 'file' && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      gap="2"
                      p="5"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      style={{
                        border: `2px dashed ${isDragOver ? 'var(--accent-9)' : 'var(--gray-a6)'}`,
                        borderRadius: 'var(--radius-3)',
                        backgroundColor: isDragOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: 120,
                      }}
                      onClick={handleBrowse}
                    >
                      <FileUp size={32} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
                      <Text size="2" color="gray">
                        {getMessage('dragDropZone')}
                      </Text>
                      <Button variant="soft" size="1" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleBrowse(); }}>
                        {getMessage('browse')}
                      </Button>
                      {fileName && (
                        <Text size="1" color="gray" mt="1">{fileName}</Text>
                      )}
                    </Flex>
                  </>
                )}

                {sourceMode === 'text' && (
                  <TextArea
                    value={jsonText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTextChange(e.target.value)}
                    placeholder='{"domainRules": [...]}'
                    rows={8}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                )}
              </Box>

              {/* Validation feedback */}
              {parseError && (
                <Callout.Root color="red" variant="soft" mt="3">
                  <Callout.Icon>
                    <XCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {parseError}
                  </Callout.Text>
                </Callout.Root>
              )}

              {parsedRules && (
                <Callout.Root color="green" variant="soft" mt="3">
                  <Callout.Icon>
                    <CheckCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    {getMessage('rulesFoundCount').replace('{count}', String(parsedRules.length))}
                  </Callout.Text>
                </Callout.Root>
              )}
            </Box>
          )}

          {/* Step 2: Selection */}
          {step === 1 && classification && (
            <Box mt="4">
              <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '50vh' }}>
                <Flex direction="column" gap="3" pr="3">
                  {/* New rules group */}
                  {classification.newRules.length > 0 && (
                    <>
                      <Text size="3" weight="bold">
                        {getMessage('newRulesGroup').replace('{count}', String(classification.newRules.length))}
                      </Text>
                      <Flex direction="column" gap="2">
                        {classification.newRules.map(rule => (
                          <RuleRow
                            key={rule.id}
                            rule={rule}
                            checkbox
                            checked={newRuleSelectedIds.has(rule.id)}
                            onToggle={() => toggleNewRule(rule.id)}
                          />
                        ))}
                      </Flex>
                    </>
                  )}

                  {/* Conflicting rules group */}
                  {classification.conflictingRules.length > 0 && (
                    <>
                      {classification.newRules.length > 0 && <Separator size="4" />}
                      <Text size="3" weight="bold">
                        {getMessage('conflictingRulesGroup').replace('{count}', String(classification.conflictingRules.length))}
                      </Text>

                      <Flex align="center" gap="2" mb="1">
                        <Text size="2" color="gray">{getMessage('conflictResolutionMode')}</Text>
                        <SegmentedControl.Root
                          value={conflictMode}
                          onValueChange={(v: string) => setConflictMode(v as ConflictMode)}
                          size="1"
                        >
                          <SegmentedControl.Item value="overwrite">
                            {getMessage('conflictModeOverwrite')}
                          </SegmentedControl.Item>
                          <SegmentedControl.Item value="duplicate">
                            {getMessage('conflictModeDuplicate')}
                          </SegmentedControl.Item>
                          <SegmentedControl.Item value="ignore">
                            {getMessage('conflictModeIgnore')}
                          </SegmentedControl.Item>
                        </SegmentedControl.Root>
                      </Flex>

                      <Flex direction="column" gap="2">
                        {classification.conflictingRules.map(conflict => (
                          <ConflictRow key={conflict.imported.id} conflict={conflict} />
                        ))}
                      </Flex>
                    </>
                  )}

                  {/* Identical rules group */}
                  {classification.identicalRules.length > 0 && (
                    <>
                      {(classification.newRules.length > 0 || classification.conflictingRules.length > 0) && (
                        <Separator size="4" />
                      )}
                      <Text size="3" weight="bold">
                        {getMessage('identicalRulesGroup').replace('{count}', String(classification.identicalRules.length))}
                      </Text>
                      <Flex direction="column" gap="2">
                        {classification.identicalRules.map(rule => (
                          <RuleRow
                            key={rule.id}
                            rule={rule}
                            dimmed
                            statusBadge={getMessage('alreadyExists')}
                          />
                        ))}
                      </Flex>
                    </>
                  )}
                </Flex>
              </ScrollArea>

              <Text size="2" color="gray" mt="3">
                {getMessage('rulesToImportCount').replace('{count}', String(importCount))}
              </Text>
            </Box>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && classification && !importDone && (
            <Box mt="4">
              <Flex direction="column" gap="2">
                {classification.newRules.filter(r => newRuleSelectedIds.has(r.id)).length > 0 && (
                  <Text size="2">
                    {getMessage('newRulesToAdd').replace('{count}',
                      String(classification.newRules.filter(r => newRuleSelectedIds.has(r.id)).length)
                    )}
                  </Text>
                )}

                {classification.conflictingRules.length > 0 && (
                  <>
                    {conflictMode === 'overwrite' && (
                      <Text size="2">
                        {getMessage('rulesToOverwrite').replace('{count}', String(classification.conflictingRules.length))}
                      </Text>
                    )}
                    {conflictMode === 'duplicate' && (
                      <Text size="2">
                        {getMessage('rulesToDuplicate').replace('{count}', String(classification.conflictingRules.length))}
                      </Text>
                    )}
                    {conflictMode === 'ignore' && (
                      <Text size="2">
                        {getMessage('rulesToIgnore').replace('{count}', String(classification.conflictingRules.length))}
                      </Text>
                    )}
                  </>
                )}
              </Flex>

              {conflictMode === 'overwrite' && classification.conflictingRules.length > 0 && (
                <Callout.Root color="orange" variant="soft" mt="3">
                  <Callout.Icon>
                    <AlertTriangle size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    {getMessage('overwriteWarning')}
                  </Callout.Text>
                </Callout.Root>
              )}
            </Box>
          )}

          {step === 2 && importDone && importResult && (
            <Box mt="4">
              <Callout.Root color="green" variant="soft">
                <Callout.Icon>
                  <CheckCircle size={16} />
                </Callout.Icon>
                <Callout.Text>
                  {getMessage('importResultSuccess')
                    .replace('{added}', String(importResult.added))
                    .replace('{overwritten}', String(importResult.overwritten))
                  }
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
                <Button onClick={goToStep2} disabled={!parsedRules}>
                  {getMessage('next')}
                </Button>
              </>
            )}
            {step === 1 && (
              <>
                <Button variant="soft" color="gray" onClick={() => setStep(0)}>
                  {getMessage('previous')}
                </Button>
                <Button onClick={() => setStep(2)} disabled={importCount === 0}>
                  {getMessage('next')}
                </Button>
              </>
            )}
            {step === 2 && !importDone && (
              <>
                <Button variant="soft" color="gray" onClick={() => setStep(1)}>
                  {getMessage('previous')}
                </Button>
                <Button onClick={executeImport}>
                  {getMessage('confirmImport')}
                </Button>
              </>
            )}
            {step === 2 && importDone && (
              <Dialog.Close>
                <Button variant="soft">
                  {getMessage('close')}
                </Button>
              </Dialog.Close>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </ImportTheme>
  );
}

// --- Sub-components ---

interface RuleRowProps {
  rule: DomainRuleSetting;
  checkbox?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  dimmed?: boolean;
  statusBadge?: string;
}

function RuleRow({ rule, checkbox, checked, onToggle, dimmed, statusBadge }: RuleRowProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--gray-a2)',
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      {checkbox && (
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={rule.label}
        />
      )}
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{rule.label}</Text>
        <Text size="1" color="gray">{rule.domainFilter}</Text>
      </Flex>
      <Badge color={rule.color as any} variant="soft" size="1">
        {getMessage(`color_${rule.color}`)}
      </Badge>
      {statusBadge && (
        <Badge color="gray" variant="outline" size="1">
          {statusBadge}
        </Badge>
      )}
    </Flex>
  );
}

interface ConflictRowProps {
  conflict: ConflictingRule;
}

function ConflictRow({ conflict }: ConflictRowProps) {
  return (
    <Flex
      align="center"
      gap="3"
      p="2"
      style={{
        borderRadius: 'var(--radius-2)',
        backgroundColor: 'var(--orange-a2)',
      }}
    >
      <AlertTriangle size={16} style={{ color: 'var(--orange-9)', flexShrink: 0 }} aria-hidden="true" />
      <Flex direction="column" gap="1" style={{ flex: 1 }}>
        <Text size="2" weight="medium">{conflict.imported.label}</Text>
        <Text size="1" color="gray">{conflict.imported.domainFilter}</Text>
      </Flex>
      <Badge color={conflict.imported.color as any} variant="soft" size="1">
        {getMessage(`color_${conflict.imported.color}`)}
      </Badge>

      <Popover.Root>
        <Popover.Trigger>
          <Button variant="ghost" size="1" aria-label={getMessage('viewDiff')} title={getMessage('viewDiff')}>
            <Eye size={14} aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Content style={{ maxWidth: 350 }}>
          <Text size="3" weight="bold" mb="2">
            {getMessage('differences')} — {conflict.imported.label}
          </Text>
          <Flex direction="column" gap="3">
            {conflict.differences.map(diff => (
              <Box key={diff.property}>
                <Text size="2" weight="medium" mb="1">
                  {getMessage(diff.property) || diff.property}
                </Text>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2">
                    <Badge color="red" variant="soft" size="1">{getMessage('currentValue')}</Badge>
                    <Text size="1">{String(diff.currentValue)}</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Badge color="green" variant="soft" size="1">{getMessage('importedValue')}</Badge>
                    <Text size="1">{String(diff.importedValue)}</Text>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>
    </Flex>
  );
}
