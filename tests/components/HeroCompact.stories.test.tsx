import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/HeroCompact.stories';

const { HeroCompactDefault } = composeStories(stories);

describe('HeroCompact (portable stories)', () => {
  it('renders the dashboard title', () => {
    render(<HeroCompactDefault />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBeTruthy();
  });
});
