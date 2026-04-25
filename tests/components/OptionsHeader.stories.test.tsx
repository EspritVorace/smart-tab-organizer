import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/OptionsLayout/OptionsHeader.stories';

const { OptionsHeaderDefault, OptionsHeaderCollapsedStory } = composeStories(stories);

describe('OptionsHeader (portable stories)', () => {
  it('renders the expanded header with version and theme toggle', () => {
    render(<OptionsHeaderDefault />);
    expect(screen.getByTestId('options-header')).toBeInTheDocument();
    expect(screen.getByText('(v1.1.3)')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders the collapsed header with logo only', () => {
    const { container } = render(<OptionsHeaderCollapsedStory />);
    const logo = container.querySelector('img[src="/icons/icon48.png"]');
    expect(logo).toBeInTheDocument();
    expect(screen.queryByTestId('theme-toggle')).not.toBeInTheDocument();
  });
});
