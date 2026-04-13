import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/SessionsPage.stories';

const { SessionsPageDefault } = composeStories(stories);

describe('SessionsPage (portable stories)', () => {
  it('renders the page with toolbar and empty state', async () => {
    render(<SessionsPageDefault />);

    await waitFor(() => {
      expect(screen.getByTestId('page-sessions')).toBeInTheDocument();
      expect(screen.getByTestId('page-sessions-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('page-sessions-btn-snapshot')).toBeInTheDocument();
      expect(screen.getByTestId('page-sessions-empty')).toBeInTheDocument();
    });
  });
});
