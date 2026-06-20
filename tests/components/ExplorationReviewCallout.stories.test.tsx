import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Exploration/ExplorationReviewCallout.stories';

const composed = composeStories(stories);

describe('ExplorationReviewCallout (stories)', () => {
  it('shows the discreet prompt once eligible and the dismissed flag has loaded', async () => {
    render(<composed.ExplorationReviewCalloutEligible />);
    const prompt = await screen.findByTestId('exploration-review-prompt');
    expect(prompt).toBeInTheDocument();
    // The review link points at the store reviews page.
    expect(screen.getByTestId('exploration-review-link')).toHaveAttribute('href');
  });

  it('hides the prompt after the user dismisses it', async () => {
    render(<composed.ExplorationReviewCalloutEligible />);
    const dismiss = await screen.findByTestId('exploration-review-dismiss');
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByTestId('exploration-review-prompt')).not.toBeInTheDocument(),
    );
  });

  it('renders nothing when below the eligibility milestone', () => {
    const { container } = render(<composed.ExplorationReviewCalloutNotEligible />);
    expect(container.textContent?.trim()).toBe('');
  });
});
