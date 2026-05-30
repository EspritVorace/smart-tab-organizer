import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { ShortcutsControlProvider } from '../../src/contexts/ShortcutsControlContext';
import { StatusBar } from '../../src/components/UI/StatusBar/StatusBar';
import * as stories from '../../src/components/UI/StatusBar/StatusBar.stories';

const { StatusBarDefault } = composeStories(stories);

describe('StatusBar (portable stories)', () => {
  it('renders the default story with the shortcut hint', () => {
    render(<StatusBarDefault />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar-shortcuts')).toBeInTheDocument();
  });
});

describe('StatusBar (interaction)', () => {
  it('calls openShortcuts when the hint button is clicked', () => {
    const openShortcuts = vi.fn();
    render(
      <ShortcutsControlProvider openShortcuts={openShortcuts}>
        <StatusBar />
      </ShortcutsControlProvider>,
    );
    fireEvent.click(screen.getByTestId('status-bar-shortcuts'));
    expect(openShortcuts).toHaveBeenCalledTimes(1);
  });
});
