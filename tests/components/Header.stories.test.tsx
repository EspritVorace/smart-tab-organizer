import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/Header/Header.stories';

const { HeaderDefault, HeaderLight, HeaderDark } = composeStories(stories);

describe('Header (portable stories)', () => {
  it('renders the header with a title and theme toggle', () => {
    render(<HeaderDefault />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders in light mode', () => {
    render(<HeaderLight />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders in dark mode', () => {
    render(<HeaderDark />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });
});
