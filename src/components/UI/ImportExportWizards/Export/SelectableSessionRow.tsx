import React from 'react';
import { Checkbox } from '@radix-ui/themes';
import type { Session } from '@/types/session';
import { SelectableRowShell, SessionSummary } from '@/components/UI/ImportExportWizards/Shared';

interface SelectableSessionRowProps {
  session: Session;
  checked: boolean;
  onToggle: () => void;
}

export function SelectableSessionRow({ session, checked, onToggle }: SelectableSessionRowProps) {
  return (
    <SelectableRowShell>
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={session.name}
      />
      <SessionSummary session={session} />
    </SelectableRowShell>
  );
}
