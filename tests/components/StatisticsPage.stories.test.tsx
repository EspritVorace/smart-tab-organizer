import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/StatisticsPage.stories';

const {
  StatisticsPageDefault,
  StatisticsPageWithData,
  StatisticsPageRules,
  StatisticsPageResetClick,
} = composeStories(stories);

describe('StatisticsPage — static renders', () => {
  it('renders the summary tab with headline KPIs by default', () => {
    render(<StatisticsPageDefault />);
    expect(screen.getByTestId('page-stats')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-summary')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-card-groups')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-card-dedup')).toBeInTheDocument();
  });

  it('renders populated stat counts on the summary tab', () => {
    render(<StatisticsPageWithData />);
    const groupsCard = screen.getByTestId('page-stats-card-groups');
    const dedupCard = screen.getByTestId('page-stats-card-dedup');
    expect(groupsCard).toHaveTextContent('142');
    expect(dedupCard).toHaveTextContent('57');
  });

  it('exposes the reset button on the rules tab', () => {
    render(<StatisticsPageRules />);
    expect(screen.getByTestId('page-stats-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-stats-btn-reset')).toBeInTheDocument();
  });
});

describe('StatisticsPage — interactions', () => {
  it('reset button is clickable without throwing', async () => {
    await StatisticsPageResetClick.run();
    expect(screen.getByTestId('page-stats-btn-reset')).toBeInTheDocument();
  });
});
