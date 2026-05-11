import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Session/SessionCard.stories';

const {
  SessionCardDefault,
  SessionCardPinned,
  SessionCardDeepSearchMatch,
  SessionCardWithRelativeDates,
} = composeStories(stories);

// Shared default for the required prop not covered by stories
const existingSessions = [
  { ...stories.default.args?.session, id: 'other', name: 'Other Session' },
];

describe('SessionCard (portable stories)', () => {
  describe('SessionCardDefault', () => {
    it('renders metadata, action buttons and collapsed preview', () => {
      const { container } = render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      expect(screen.getByTestId('session-card-session-1-name')).toBeInTheDocument();
      // 5 tabs total (2 Frontend + 2 Backend + 1 ungrouped)
      expect(screen.getByText(/5 tabs/)).toBeInTheDocument();
      // 2 groups (Frontend + Backend APIs)
      expect(screen.getByText(/2 groups/)).toBeInTheDocument();

      // 2 groups = 2 color dots (8px circles with borderRadius 50%)
      const dots = container.querySelectorAll('span[aria-hidden="true"]');
      const colorDots = Array.from(dots).filter(
        (el) => (el as HTMLElement).style.borderRadius === '50%',
      );
      expect(colorDots).toHaveLength(2);

      expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'More actions' }),
      ).toBeInTheDocument();

      const toggle = screen.getByTestId('session-card-session-1-preview-toggle');
      expect(toggle.closest('[data-state]')?.getAttribute('data-state')).toBe(
        'closed',
      );
    });

    it('rename flow: enter mode, show confirm/cancel, cancel exits', async () => {
      render(
        <SessionCardDefault existingSessions={existingSessions as any} />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: 'Session name' }),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: 'Confirm rename' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel' }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('calls onPin and toggles preview open on trigger click', async () => {
      const onPin = vi.fn();
      render(
        <SessionCardDefault
          existingSessions={existingSessions as any}
          onPin={onPin}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
      expect(onPin).toHaveBeenCalledOnce();

      const toggle = screen.getByTestId('session-card-session-1-preview-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        const root = toggle.closest('[data-state]');
        expect(root?.getAttribute('data-state')).toBe('open');
      });
    });
  });

  describe('SessionCardPinned', () => {
    it('shows Unpin button (not Pin) and calls onUnpin when clicked', () => {
      const onUnpin = vi.fn();
      render(
        <SessionCardPinned
          existingSessions={existingSessions as any}
          onUnpin={onUnpin}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Unpin' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Pin' }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
      expect(onUnpin).toHaveBeenCalledOnce();
    });
  });

  describe('SessionCardWithRelativeDates', () => {
    it('renders <time> elements with "modified"/"created" prefixes', () => {
      const { container } = render(<SessionCardWithRelativeDates />);

      const timeElements = container.querySelectorAll('time[datetime]');
      // 8 staggered sessions = 8 <time> elements
      expect(timeElements.length).toBe(8);

      for (const el of Array.from(timeElements)) {
        expect(el.getAttribute('datetime')).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        );
        expect(el.textContent?.trim().length).toBeGreaterThan(0);
      }

      // "Sprint en cours" has updatedAt 5 min ago vs createdAt 30 min ago.
      expect(
        screen.getByTestId('session-card-rt-5min-modified-relative-time')
          .textContent,
      ).toMatch(/modified/);
      // "Recherches du matin" passes updatedOffset null -> createdAt === updatedAt.
      expect(
        screen.getByTestId('session-card-rt-2h-created-relative-time')
          .textContent,
      ).toMatch(/created/);
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
});
