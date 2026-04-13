import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/TabTree/TabTreeEditor.stories';

const { TabTreeEditorDefault, TabTreeEditorWithMaxHeight, TabTreeEditorEmptyUngrouped } =
  composeStories(stories);

describe('TabTreeEditor (portable stories)', () => {
  it('renders groups, ungrouped tabs and action buttons', () => {
    render(<TabTreeEditorDefault />);

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Figma Designs')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getAllByTitle('Edit group').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByTitle('Move up').length).toBeGreaterThanOrEqual(2);
  });

  it('wraps content in ScrollArea when maxHeight is set', () => {
    const { container } = render(<TabTreeEditorWithMaxHeight />);
    expect(container.querySelector('[data-radix-scroll-area-viewport]')).toBeInTheDocument();
  });

  it('renders groups only when ungrouped tabs are empty', () => {
    render(<TabTreeEditorEmptyUngrouped />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.queryByText('Figma Designs')).not.toBeInTheDocument();
  });
});
