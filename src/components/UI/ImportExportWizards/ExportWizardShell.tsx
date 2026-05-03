import React from 'react';
import { Box } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { WizardModal } from '@/components/UI/WizardModal';
import { CountLabel } from './Shared';
import {
  ExportNoteField,
  ExportWizardFooter,
  SelectableListContainer,
  SelectionToolbar,
} from './Export';
import type { ExportWizardState } from './useExportWizardState';

interface ExportWizardShellProps<TItem extends { id: string }> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  state: ExportWizardState<TItem>;
  countLabelKey: string;
  buttonLabelKey: string;
  /** Custom rendering of the selectable list (e.g. flat cards or grouped sections). */
  children: React.ReactNode;
  /** Forwarded to `SelectableListContainer` (use "list" when children are listitems). */
  listRole?: string;
}

/**
 * Single-step export wizard shell shared by every export flow (rules,
 * sessions, ...). Owns the WizardModal frame, the note field, the
 * select-all/none toolbar, the selectable list container, the count label
 * and the file/clipboard footer split-button. Wizards plug in their list
 * rendering as children and provide an `ExportWizardState` from
 * `useExportWizardState`.
 */
export function ExportWizardShell<TItem extends { id: string }>({
  open,
  onOpenChange,
  icon,
  title,
  description,
  state,
  countLabelKey,
  buttonLabelKey,
  children,
  listRole,
}: ExportWizardShellProps<TItem>) {
  const { selection, selectAll, exportNote, setExportNote, actions } = state;

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      icon={icon}
      title={title}
      description={description}
    >
      <WizardModal.Body>
        <Box>
          <ExportNoteField value={exportNote} onChange={setExportNote} />
          <SelectionToolbar onSelectAll={selectAll} onDeselectAll={selection.clearAll} />

          <SelectableListContainer role={listRole}>
            {children}
          </SelectableListContainer>

          <CountLabel messageKey={countLabelKey} count={selection.size} />
        </Box>
      </WizardModal.Body>

      <WizardModal.Footer>
        <ExportWizardFooter
          labelKey={buttonLabelKey}
          actions={actions}
          disabled={selection.size === 0}
        />
      </WizardModal.Footer>
    </WizardModal>
  );
}
