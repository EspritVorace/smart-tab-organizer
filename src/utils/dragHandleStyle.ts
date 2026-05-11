import type React from 'react';

export function getDragHandleStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'grab',
    touchAction: 'none',
    color: disabled ? 'var(--gray-6)' : 'var(--gray-9)',
    flexShrink: 0,
  };
}
