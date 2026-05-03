import React from 'react';
import { Flex } from '@radix-ui/themes';
import { Check } from 'lucide-react';
import { workspaceAccentColors, type WorkspaceAccentColor } from '@/schemas/workspace.js';
import { getMessage } from '@/utils/i18n.js';

interface WorkspaceColorPickerProps {
  value: WorkspaceAccentColor;
  onChange: (next: WorkspaceAccentColor) => void;
  ariaLabel?: string;
}

/**
 * Grid of round color swatches (one per Radix accent color allowed for
 * workspaces). Single-select; the chosen swatch shows a checkmark.
 */
export function WorkspaceColorPicker({ value, onChange, ariaLabel }: WorkspaceColorPickerProps) {
  return (
    <Flex
      data-testid="workspace-color-picker"
      role="radiogroup"
      aria-label={ariaLabel ?? getMessage('workspaceColorPickerLabel')}
      gap="2"
      wrap="wrap"
      style={{ maxWidth: 320 }}
    >
      {workspaceAccentColors.map((color) => {
        const isActive = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={color}
            data-testid={`workspace-color-swatch-${color}`}
            data-active={isActive ? 'true' : undefined}
            onClick={() => onChange(color)}
            style={{
              width: 28,
              height: 28,
              border: 'none',
              padding: 0,
              borderRadius: '50%',
              cursor: 'pointer',
              background: `var(--${color}-9)`,
              boxShadow: isActive
                ? '0 0 0 2px var(--color-background), 0 0 0 4px var(--gray-12)'
                : 'inset 0 0 0 1px var(--gray-a4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `var(--${color}-contrast)`,
            }}
          >
            {isActive ? <Check size={14} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </Flex>
  );
}
