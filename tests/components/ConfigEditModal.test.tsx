import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { ConfigEditModal, type ConfigEditValues } from '../../src/components/Core/DomainRule/ConfigEditModal';

const baseInitial: ConfigEditValues = {
  configMode: 'manual',
  presetId: null,
  groupNameSource: 'title',
  titleParsingRegEx: 'orig-(.+)',
  urlParsingRegEx: '',
  urlExtractionMode: 'regex',
  urlQueryParamName: '',
  fallbackLabel: '',
};

function renderModal(initial: ConfigEditValues, onApply = vi.fn()) {
  render(
    <Theme>
      <ConfigEditModal
        isOpen
        onClose={vi.fn()}
        onApply={onApply}
        initial={initial}
        presetCategories={[]}
        isLoadingPresets={false}
      />
    </Theme>,
  );
  return { onApply };
}

describe('ConfigEditModal — per-mode state preservation', () => {
  it('label -> manual restores a valid manual source and keeps the regex (no "lose everything")', () => {
    const { onApply } = renderModal(baseInitial);

    fireEvent.click(screen.getByTestId('config-mode-label'));
    fireEvent.click(screen.getByTestId('config-mode-manual'));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
    const values = onApply.mock.calls[0][0] as ConfigEditValues;
    expect(values.configMode).toBe('manual');
    // groupNameSource must NOT stay stuck on 'label' (that hid the regex fields).
    expect(values.groupNameSource).toBe('title');
    expect(values.titleParsingRegEx).toBe('orig-(.+)');
  });

  it('manual -> ask -> manual preserves the manual regex', () => {
    const { onApply } = renderModal(baseInitial);

    fireEvent.click(screen.getByTestId('config-mode-ask'));
    fireEvent.click(screen.getByTestId('config-mode-manual'));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    const values = onApply.mock.calls[0][0] as ConfigEditValues;
    expect(values.groupNameSource).toBe('title');
    expect(values.titleParsingRegEx).toBe('orig-(.+)');
  });

  it('switching to ask persists groupNameSource as the "manual" sentinel', () => {
    const { onApply } = renderModal(baseInitial);

    fireEvent.click(screen.getByTestId('config-mode-ask'));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    const values = onApply.mock.calls[0][0] as ConfigEditValues;
    expect(values.configMode).toBe('ask');
    expect(values.groupNameSource).toBe('manual');
    expect(values.presetId).toBeNull();
  });
});
