import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/DomainRule/TabCoveragePanel.stories';

const {
  TabCoveragePanelNotCovered,
  TabCoveragePanelMixed,
  TabCoveragePanelEmpty,
} = composeStories(stories);

describe('TabCoveragePanel — stories', () => {
  it('renders the not-covered list', async () => {
    await TabCoveragePanelNotCovered.run();
    expect(screen.getByLabelText(/news\.ycombinator\.com/)).toBeInTheDocument();
  });

  it('picks a host, shows the level choice, and seeds the registrable domain', async () => {
    await TabCoveragePanelMixed.run();
    expect(screen.getByTestId('seeded-value')).toHaveTextContent('github.com');
  });

  it('shows the empty message when no domain is found', async () => {
    await TabCoveragePanelEmpty.run();
    expect(screen.getByText('No domain found in the open tabs')).toBeInTheDocument();
  });
});
