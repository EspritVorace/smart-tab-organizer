import React from 'react';
import { Checkbox } from '@radix-ui/themes';
import type { Session } from '@/types/session';
import { SessionCard } from '@/components/Core/Session/SessionCard';

interface SelectableSessionRowProps {
  session: Session;
  checked: boolean;
  onToggle: () => void;
}

export function SelectableSessionRow({ session, checked, onToggle }: SelectableSessionRowProps) {
  return (
    <SessionCard
      session={session}
      variant="summary"
      leading={
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={session.name}
        />
      }
    />
  );
}
