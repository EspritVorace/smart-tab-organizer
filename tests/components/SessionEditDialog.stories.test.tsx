import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Session/SessionEditDialog.stories';

const { SessionEditDialogOpen, SessionEditDialogClosed } = composeStories(stories);

describe('SessionEditDialog (portable stories)', () => {
  it('renders the dialog with name input, note, summary and buttons', () => {
    render(<SessionEditDialogOpen />);

    expect(screen.getByTestId('dialog-session-edit')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-field-name')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-btn-save')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-btn-cancel')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    // 3 tabs (2 grouped + 1 ungrouped), 1 group
    expect(screen.getByText(/3 tabs/)).toBeInTheDocument();
    expect(screen.getByText(/1 group/)).toBeInTheDocument();
  });

  it('renders nothing when session is null', () => {
    const { container } = render(<SessionEditDialogClosed />);
    expect(container.querySelector('[data-testid="dialog-session-edit"]')).not.toBeInTheDocument();
  });
});
