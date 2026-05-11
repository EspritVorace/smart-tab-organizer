import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/QuickActionsSection.stories';

const {
  QuickActionsSectionDefault,
  QuickActionsSectionThree,
  QuickActionsSectionAll,
} = composeStories(stories);

describe('QuickActionsSection (portable stories)', () => {
  it('default story renders 5 cards (no shortcuts/workspaces) and forwards click ids', () => {
    const onAction = vi.fn();
    render(<QuickActionsSectionDefault onAction={onAction} />);

    for (const id of ['organize', 'snapshot', 'rule', 'io', 'stats']) {
      expect(screen.getByTestId(`home-quick-action-${id}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('home-quick-action-shortcuts')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-quick-action-workspaces')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('home-quick-action-stats'));
    expect(onAction).toHaveBeenCalledWith('stats');
    fireEvent.click(screen.getByTestId('home-quick-action-organize'));
    expect(onAction).toHaveBeenCalledWith('organize');
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('compact story renders only the first 3 cards', () => {
    render(<QuickActionsSectionThree />);
    expect(screen.getByTestId('home-quick-action-organize')).toBeInTheDocument();
    expect(screen.getByTestId('home-quick-action-snapshot')).toBeInTheDocument();
    expect(screen.getByTestId('home-quick-action-rule')).toBeInTheDocument();
    expect(screen.queryByTestId('home-quick-action-io')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-quick-action-stats')).not.toBeInTheDocument();
  });

  it('verbose story renders all 7 cards including shortcuts and workspaces', () => {
    render(<QuickActionsSectionAll />);
    expect(screen.getByTestId('home-quick-action-shortcuts')).toBeInTheDocument();
    expect(screen.getByTestId('home-quick-action-workspaces')).toBeInTheDocument();
  });
});
