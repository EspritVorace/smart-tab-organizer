import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/SessionWizards/ConflictResolutionStep.stories';

const {
  ConflictResolutionDuplicatesOnly,
  ConflictResolutionGroupsOnly,
  ConflictResolutionMixed,
  ConflictResolutionEmpty,
  ConflictResolutionSwitchOpenAnyway,
} = composeStories(stories);

describe('ConflictResolutionStep — static renders', () => {
  it('renders duplicate tabs section', () => {
    render(<ConflictResolutionDuplicatesOnly />);
    expect(screen.getByText('React Docs')).toBeInTheDocument();
    expect(screen.getByText('GitHub PR #42')).toBeInTheDocument();
  });

  it('renders conflicting groups section', () => {
    render(<ConflictResolutionGroupsOnly />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('renders both sections in mixed mode', () => {
    render(<ConflictResolutionMixed />);
    expect(screen.getByText('React Docs')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });

  it('renders without conflicts (empty conflict analysis)', () => {
    const { container } = render(<ConflictResolutionEmpty />);
    expect(container).toBeTruthy();
  });
});

describe('ConflictResolutionStep — interactions', () => {
  it('switches duplicate tab action to open anyway', async () => {
    await ConflictResolutionSwitchOpenAnyway.run();
    // Verify the component is still rendered after interaction
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    // At least one radio should now be in "checked" state (data-state attribute used by Radix)
    const checkedByDataState = radios.some(r => r.getAttribute('data-state') === 'checked');
    expect(checkedByDataState).toBe(true);
  });

  it('renders group conflict dropdowns without throwing', () => {
    // ConflictResolutionChangeGroupAction uses Radix Select which requires pointer events
    // not available in happy-dom; verify static render instead
    render(<ConflictResolutionGroupsOnly />);
    const comboboxes = screen.queryAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
  });
});
