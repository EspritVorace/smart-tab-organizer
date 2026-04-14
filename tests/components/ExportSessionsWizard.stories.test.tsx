import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ExportSessionsWizard.stories';

const {
  ExportSessionsWizardOpen,
  ExportSessionsWizardClosed,
  ExportSessionsWizardWithSessions,
  ExportSessionsWizardDeselectAll,
} = composeStories(stories);

describe('ExportSessionsWizard (portable stories)', () => {
  it('renders the open dialog with selection controls (no sessions seeded)', () => {
    render(<ExportSessionsWizardOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
    expect(screen.getByText('Note (optional)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ExportSessionsWizardClosed />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('lists pinned and unpinned sessions when storage is seeded', async () => {
    await ExportSessionsWizardWithSessions.run();

    await waitFor(() => {
      // Pinned section header + session name
      expect(screen.getByText('Pinned Profile')).toBeInTheDocument();
      // Unpinned sessions
      expect(screen.getByText('Work tabs')).toBeInTheDocument();
      expect(screen.getByText('Research')).toBeInTheDocument();
      // Selection count (3 selected by default)
      expect(screen.getByText(/3 session\(s\) selected/)).toBeInTheDocument();
    });
  });

  it('updates the selection count to zero after "Deselect All"', async () => {
    await ExportSessionsWizardDeselectAll.run();

    await waitFor(() => {
      expect(screen.getByText(/0 session\(s\) selected/)).toBeInTheDocument();
    });
  });
});
