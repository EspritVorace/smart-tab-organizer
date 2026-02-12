import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, Flex, Button, Checkbox, Text, Separator, Badge, Box, ScrollArea } from '@radix-ui/themes';
import { FileDown, ClipboardCopy, CheckCircle } from 'lucide-react';
import { ExportTheme } from '../../Form/themes';
import { WizardStepper } from '../WizardStepper';
import { getMessage } from '../../../utils/i18n';
import type { DomainRuleSetting } from '../../../types/syncSettings';

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: DomainRuleSetting[];
}

export function ExportWizard({ open, onOpenChange, rules }: ExportWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportDone, setExportDone] = useState(false);

  const steps = [
    { label: getMessage('exportStepSelection') },
    { label: getMessage('exportStepExport') },
  ];

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedIds(new Set(rules.map(r => r.id)));
      setExportDone(false);
    }
  }, [open, rules]);

  const toggleRule = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(rules.map(r => r.id)));
  }, [rules]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedRules = rules.filter(r => selectedIds.has(r.id));

  const getExportJson = useCallback(() => {
    const exportData = {
      domainRules: selectedRules
    };
    return JSON.stringify(exportData, null, 2);
  }, [selectedRules]);

  const handleExportToFile = useCallback(async () => {
    const json = getExportJson();

    // Use native Save As dialog when available (Chrome)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'smarttab_organizer_rules.json',
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        setExportDone(true);
      } catch (err: any) {
        // User cancelled the dialog
        if (err?.name === 'AbortError') return;
        throw err;
      }
      return;
    }

    // Fallback for Firefox / older browsers
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smarttab_organizer_rules.json';
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
  }, [getExportJson]);

  const handleExportToClipboard = useCallback(async () => {
    const json = getExportJson();
    await navigator.clipboard.writeText(json);
    setExportDone(true);
  }, [getExportJson]);

  return (
    <ExportTheme>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content style={{ maxWidth: 550 }}>
          <Dialog.Title>{getMessage('exportRulesTitle')}</Dialog.Title>
          <Dialog.Description size="2" color="gray">
            {getMessage('exportRulesDescription')}
          </Dialog.Description>

          <WizardStepper steps={steps} currentStep={step} />
          <Separator size="4" style={{ opacity: 0.3 }} />

          {step === 0 && (
            <Box mt="4">
              <Flex gap="2" mb="3">
                <Button variant="soft" size="1" onClick={selectAll}>
                  {getMessage('selectAll')}
                </Button>
                <Button variant="soft" size="1" color="gray" onClick={deselectAll}>
                  {getMessage('deselectAll')}
                </Button>
              </Flex>

              <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '40vh' }}>
                <Flex direction="column" gap="2" pr="3">
                  {rules.map(rule => (
                    <Flex
                      key={rule.id}
                      align="center"
                      gap="3"
                      p="2"
                      style={{
                        borderRadius: 'var(--radius-2)',
                        backgroundColor: 'var(--gray-a2)',
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(rule.id)}
                        onCheckedChange={() => toggleRule(rule.id)}
                        aria-label={rule.label}
                      />
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="2" weight="medium">{rule.label}</Text>
                        <Text size="1" color="gray">{rule.domainFilter}</Text>
                      </Flex>
                      <Badge
                        color={rule.color as any}
                        variant="soft"
                        size="1"
                      >
                        {getMessage(`color_${rule.color}`)}
                      </Badge>
                      {!rule.enabled && (
                        <Badge color="gray" variant="outline" size="1">
                          {getMessage('disabled')}
                        </Badge>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>

              <Text size="2" color="gray" mt="3">
                {getMessage('rulesSelectedCount').replace('{count}', String(selectedIds.size))}
              </Text>
            </Box>
          )}

          {step === 1 && (
            <Box mt="4">
              <Text size="3" weight="medium" mb="3">
                {getMessage('rulesReadyToExport').replace('{count}', String(selectedRules.length))}
              </Text>

              <Text size="2" color="gray" mb="3">
                {getMessage('exportTo')}
              </Text>

              <Flex gap="3" mb="4">
                <Button variant="solid" onClick={handleExportToFile}>
                  <FileDown size={16} aria-hidden="true" />
                  {getMessage('exportToFile')}
                </Button>
                <Button variant="soft" onClick={handleExportToClipboard}>
                  <ClipboardCopy size={16} aria-hidden="true" />
                  {getMessage('exportToClipboard')}
                </Button>
              </Flex>

              {exportDone && (
                <Flex align="center" gap="2" p="3" style={{
                  backgroundColor: 'var(--green-a3)',
                  borderRadius: 'var(--radius-2)',
                }}>
                  <CheckCircle size={16} style={{ color: 'var(--green-11)' }} aria-hidden="true" />
                  <Text size="2" style={{ color: 'var(--green-11)' }}>
                    {getMessage('exportSuccess')}
                  </Text>
                </Flex>
              )}
            </Box>
          )}

          <Separator size="4" mt="4" style={{ opacity: 0.3 }} />

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
                  disabled={selectedIds.size === 0}
                >
                  {getMessage('next')}
                </Button>
              </>
            )}
            {step === 1 && (
              <>
                <Button variant="soft" color="gray" onClick={() => { setStep(0); setExportDone(false); }}>
                  {getMessage('previous')}
                </Button>
                <Dialog.Close>
                  <Button variant="soft">
                    {getMessage('close')}
                  </Button>
                </Dialog.Close>
              </>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </ExportTheme>
  );
}
