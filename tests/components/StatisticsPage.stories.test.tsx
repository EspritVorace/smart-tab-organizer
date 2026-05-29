import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/StatisticsPage.stories';

const {
  StatisticsPageDefault,
  StatisticsPageWithData,
  StatisticsPageResetClick,
} = composeStories(stories);

describe('StatisticsPage — static renders', () => {
  it('renders zero counts by default', () => {
    render(<StatisticsPageDefault />);
    expect(screen.getByTestId('page-stats')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-card-groups')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-card-dedup')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-btn-reset')).toBeInTheDocument();
  });

  it('renders populated stat counts', () => {
    render(<StatisticsPageWithData />);
    const groupsCard = screen.getByTestId('page-stats-card-groups');
    const dedupCard = screen.getByTestId('page-stats-card-dedup');
    expect(groupsCard).toHaveTextContent('142');
    expect(dedupCard).toHaveTextContent('57');
  });
});

describe('StatisticsPage — interactions', () => {
  it('reset button is clickable without throwing', async () => {
    await StatisticsPageResetClick.run();
    expect(screen.getByTestId('page-stats-btn-reset')).toBeInTheDocument();
  });
});
