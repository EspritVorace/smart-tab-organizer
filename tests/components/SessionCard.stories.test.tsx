import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Session/SessionCard.stories';

const { SessionCardDefault, SessionCardPinned, SessionCardDeepSearchMatch } =
  composeStories(stories);

// Shared default for the required prop not covered by stories
const existingSessions = [
  { ...stories.default.args?.session, id: 'other', name: 'Other Session' },
];

describe('SessionCard (portable stories)', () => {
  describe('SessionCardDefault', () => {
    it('renders the session name', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      expect(screen.getByTestId('session-card-session-1-name')).toBeInTheDocument();
    });

    it('displays the tab count summary', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      // 5 tabs total (2 Frontend + 2 Backend + 1 ungrouped)
      expect(screen.getByText(/5 tabs/)).toBeInTheDocument();
    });

    it('displays the group count summary', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      // 2 groups (Frontend + Backend APIs)
      expect(screen.getByText(/2 groups/)).toBeInTheDocument();
    });

    it('shows the pin button with "Pin" label', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
    });

    it('shows the rename button', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    });

    it('shows the more actions menu button', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      expect(
        screen.getByRole('button', { name: 'More actions' }),
      ).toBeInTheDocument();
    });

    it('renders group color dots', () => {
      const { container } = render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      // 2 groups = 2 color dots
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      // Filter for the small color dots (8px circles)
      const colorDots = Array.from(dots).filter(
        (el) => (el as HTMLElement).style.borderRadius === '50%',
      );
      expect(colorDots).toHaveLength(2);
    });

    it('preview is collapsed by default', () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      const toggle = screen.getByTestId('session-card-session-1-preview-toggle');
      // Collapsible is closed: the content should not be visible
      expect(toggle.closest('[data-state]')?.getAttribute('data-state')).toBe(
        'closed',
      );
    });
  });

  describe('SessionCardPinned', () => {
    it('shows the "Unpin" button instead of "Pin"', () => {
      render(
        <SessionCardPinned existingSessions={existingSessions as any} />,
      );

      expect(
        screen.getByRole('button', { name: 'Unpin' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Pin' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('SessionCardDeepSearchMatch', () => {
    it('forces the preview open when forcePreviewOpen is true', () => {
      render(
        <SessionCardDeepSearchMatch
          existingSessions={existingSessions as any}
        />,
      );

      const collapsibleRoot = screen
        .getByTestId('session-card-session-1-preview-toggle')
        .closest('[data-state]');
      expect(collapsibleRoot?.getAttribute('data-state')).toBe('open');
    });
  });

  describe('interactions', () => {
    it('enters rename mode when the rename button is clicked', async () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: 'Session name' }),
        ).toBeInTheDocument();
      });
    });

    it('shows confirm and cancel buttons in rename mode', async () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Confirm rename' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Cancel' }),
        ).toBeInTheDocument();
      });
    });

    it('cancels rename mode on cancel click', async () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('calls onPin when the pin button is clicked', () => {
      const onPin = vi.fn();
      render(
        <SessionCardDefault
          existingSessions={existingSessions as any}
          onPin={onPin}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
      expect(onPin).toHaveBeenCalledOnce();
    });

    it('calls onUnpin when the unpin button is clicked on a pinned card', () => {
      const onUnpin = vi.fn();
      render(
        <SessionCardPinned
          existingSessions={existingSessions as any}
          onUnpin={onUnpin}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
      expect(onUnpin).toHaveBeenCalledOnce();
    });

    it('toggles preview open on trigger click', async () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      const toggle = screen.getByTestId('session-card-session-1-preview-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        const root = toggle.closest('[data-state]');
        expect(root?.getAttribute('data-state')).toBe('open');
      });
    });
  });
});
