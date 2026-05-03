import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { WorkspaceColorPicker } from '../../src/components/UI/Workspace/WorkspaceColorPicker';
import { workspaceAccentColors } from '../../src/schemas/workspace';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

describe('WorkspaceColorPicker', () => {
  it('renders one swatch per accent color', () => {
    wrap(<WorkspaceColorPicker value="indigo" onChange={() => {}} />);
    for (const color of workspaceAccentColors) {
      expect(screen.getByTestId(`workspace-color-swatch-${color}`)).toBeInTheDocument();
    }
  });

  it('marks the selected swatch with aria-checked=true', () => {
    wrap(<WorkspaceColorPicker value="jade" onChange={() => {}} />);
    const jade = screen.getByTestId('workspace-color-swatch-jade');
    expect(jade.getAttribute('aria-checked')).toBe('true');
    expect(jade.dataset.active).toBe('true');

    const indigo = screen.getByTestId('workspace-color-swatch-indigo');
    expect(indigo.getAttribute('aria-checked')).toBe('false');
    expect(indigo.dataset.active).toBeUndefined();
  });

  it('calls onChange with the selected color when a swatch is clicked', () => {
    const onChange = vi.fn();
    wrap(<WorkspaceColorPicker value="indigo" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('workspace-color-swatch-tomato'));
    expect(onChange).toHaveBeenCalledWith('tomato');
  });

  it('uses the provided ariaLabel on the radiogroup', () => {
    wrap(<WorkspaceColorPicker value="indigo" onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
  });

  it('falls back to the i18n label when ariaLabel is omitted', () => {
    wrap(<WorkspaceColorPicker value="indigo" onChange={() => {}} />);
    expect(
      screen.getByRole('radiogroup', { name: 'workspaceColorPickerLabel' }),
    ).toBeInTheDocument();
  });
});
