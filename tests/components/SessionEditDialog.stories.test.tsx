import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Session/SessionEditDialog.stories';

const { SessionEditDialogOpen, SessionEditDialogClosed } = composeStories(stories);

describe('SessionEditDialog (portable stories)', () => {
  it('renders the dialog content and closes on cancel without dirty edits', () => {
    render(<SessionEditDialogOpen />);

    expect(screen.getByTestId('dialog-session-edit')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-field-name')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-btn-save')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-session-edit-btn-cancel')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
    // 3 tabs (2 grouped + 1 ungrouped), 1 group
    expect(screen.getByText(/3 tabs/)).toBeInTheDocument();
    expect(screen.getByText(/1 group/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dialog-session-edit-btn-cancel'));
    // No alert should appear since no changes were made.
    expect(screen.queryByText(/unsaved/i)).toBeNull();
  });

  it('renders nothing when session is null', () => {
    const { container } = render(<SessionEditDialogClosed />);
    expect(container.querySelector('[data-testid="dialog-session-edit"]')).not.toBeInTheDocument();
  });

  it('typing in the name and note fields updates their values', () => {
    render(<SessionEditDialogOpen />);

    const input = screen.getByTestId('dialog-session-edit-field-name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Renamed session' } });
    expect(input.value).toBe('Renamed session');

    const textarea = document.getElementById('session-edit-note') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Some note text' } });
    expect(textarea.value).toBe('Some note text');
  });
});
