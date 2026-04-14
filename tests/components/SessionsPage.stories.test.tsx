import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/SessionsPage.stories';

const { SessionsPageDefault } = composeStories(stories);

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
});
