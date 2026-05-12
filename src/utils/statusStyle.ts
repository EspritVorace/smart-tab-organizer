import type React from 'react';

export type CardStatus = 'default' | 'conflict' | 'identical';

export function getStatusStyle(status: CardStatus): React.CSSProperties {
  if (status === 'conflict') return { background: 'var(--orange-a2)' };
  if (status === 'identical') return { opacity: 0.6 };
  return {};
}
