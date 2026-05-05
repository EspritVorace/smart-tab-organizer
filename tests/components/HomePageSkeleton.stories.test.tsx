import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/HomePageSkeleton.stories';

const { HomePageSkeletonDefault } = composeStories(stories);

describe('HomePageSkeleton (portable stories)', () => {
  it('renders an aria-busy container with skeleton placeholders', () => {
    render(<HomePageSkeletonDefault />);
    const container = screen.getByTestId('home-skeleton');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-busy', 'true');
  });
});
