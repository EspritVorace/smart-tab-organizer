import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/HomePage.stories';

const {
  HomePageEmpty,
  HomePageWithRulesNoSessions,
  HomePageFullyConfigured,
  HomePageLoading,
} = composeStories(stories);

describe('HomePage (portable stories)', () => {
  it('renders the onboarding hero in the empty state', async () => {
    await HomePageEmpty.run();
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument();
      expect(screen.getByTestId('home-hero-import')).toBeInTheDocument();
      expect(screen.getByTestId('home-hero-create-rule')).toBeInTheDocument();
    });
    // No pinned section, no mini-stats in the empty state.
    expect(screen.queryByTestId('home-pinned')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-mini-stats')).not.toBeInTheDocument();
  });

  it('renders the compact hero, quick actions and tips when rules exist but no pinned sessions', async () => {
    await HomePageWithRulesNoSessions.run();
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument();
      // Compact hero: no onboarding CTAs.
      expect(screen.queryByTestId('home-hero-import')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-hero-create-rule')).not.toBeInTheDocument();
      // Quick actions and tips are always visible.
      expect(screen.getByTestId('home-quick')).toBeInTheDocument();
      expect(screen.getByTestId('home-tips')).toBeInTheDocument();
      // No pinned section, no mini-stats (counters are zero).
      expect(screen.queryByTestId('home-pinned')).not.toBeInTheDocument();
      expect(screen.queryByTestId('home-mini-stats')).not.toBeInTheDocument();
    });
  });

  it('renders pinned sessions and mini-stats in the fully configured state', async () => {
    await HomePageFullyConfigured.run();
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument();
      expect(screen.getByTestId('home-pinned')).toBeInTheDocument();
      // 3 pinned sessions seeded in storage.
      expect(screen.getByTestId('home-pinned-tile-s1')).toBeInTheDocument();
      expect(screen.getByTestId('home-pinned-tile-s2')).toBeInTheDocument();
      expect(screen.getByTestId('home-pinned-tile-s3')).toBeInTheDocument();
      // The non-pinned session is excluded.
      expect(screen.queryByTestId('home-pinned-tile-s4')).not.toBeInTheDocument();
      // Mini-stats are visible because totalGrouping > 0.
      expect(screen.getByTestId('home-mini-stats')).toBeInTheDocument();
    });
  });

  it('renders the loading skeleton when statisticsAggregates is null', async () => {
    await HomePageLoading.run();
    await waitFor(() => {
      expect(screen.getByTestId('home-skeleton')).toBeInTheDocument();
    });
    // Skeleton doesn't render the live sections.
    expect(screen.queryByTestId('home-quick')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-tips')).not.toBeInTheDocument();
  });
});
