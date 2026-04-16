import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/SessionsPage.stories';

const {
  SessionsPageDefault,
  SessionsPageAllPinned,
  SessionsPageNonePinned,
} = composeStories(stories);

describe('SessionsPage (portable stories)', () => {
  it('renders the empty state with snapshot button and hides the toolbar', async () => {
    render(<SessionsPageDefault />);

    await waitFor(() => {
      expect(screen.getByTestId('page-sessions')).toBeInTheDocument();
      expect(screen.getByTestId('page-sessions-empty')).toBeInTheDocument();
      // Snapshot button is present in the empty placeholder (same testid, mutually exclusive with the toolbar button).
      expect(screen.getByTestId('page-sessions-btn-snapshot')).toBeInTheDocument();
      // Toolbar is hidden when there are no sessions (search is useless, add is already in the placeholder).
      expect(screen.queryByTestId('page-sessions-toolbar')).not.toBeInTheDocument();
    });
  });

  it('shows "Sessions" subsection empty state when all sessions are pinned', async () => {
    await SessionsPageAllPinned.run();

    await waitFor(() => {
      expect(screen.getByText('All sessions are pinned.')).toBeInTheDocument();
      expect(screen.getByText('Unpin a session to see it here.')).toBeInTheDocument();
    });
  });

  it('shows "Pinned sessions" subsection empty state when no session is pinned', async () => {
    await SessionsPageNonePinned.run();

    await waitFor(() => {
      expect(screen.getByText('No pinned sessions.')).toBeInTheDocument();
      expect(screen.getByText('Pin a session to access it quickly from the popup.')).toBeInTheDocument();
    });
  });
});
