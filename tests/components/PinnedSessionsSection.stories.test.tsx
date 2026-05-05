import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/PinnedSessionsSection.stories';

const {
  PinnedSessionsSectionThree,
  PinnedSessionsSectionSingle,
  PinnedSessionsSectionOverflow,
  PinnedSessionsSectionEmpty,
} = composeStories(stories);

describe('PinnedSessionsSection (portable stories)', () => {
  it('three-sessions story renders the section, all tiles, and wires onSeeAll', () => {
    const onSeeAll = vi.fn();
    render(<PinnedSessionsSectionThree onSeeAll={onSeeAll} />);

    expect(screen.getByTestId('home-pinned')).toBeInTheDocument();
    expect(screen.getByTestId('home-pinned-tile-s1')).toBeInTheDocument();
    expect(screen.getByTestId('home-pinned-tile-s2')).toBeInTheDocument();
    expect(screen.getByTestId('home-pinned-tile-s3')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('home-pinned-see-all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('single-session story renders only one tile', () => {
    render(<PinnedSessionsSectionSingle />);
    expect(screen.getByTestId('home-pinned-tile-s1')).toBeInTheDocument();
    expect(screen.queryByTestId('home-pinned-tile-s2')).not.toBeInTheDocument();
  });

  it('overflow story caps the visible tiles to 6 and omits the rest', () => {
    render(<PinnedSessionsSectionOverflow />);
    for (let i = 1; i <= 6; i += 1) {
      expect(screen.getByTestId(`home-pinned-tile-s${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('home-pinned-tile-s7')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-pinned-tile-s8')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-pinned-tile-s9')).not.toBeInTheDocument();
  });

  it('empty story renders nothing', () => {
    const { container } = render(<PinnedSessionsSectionEmpty />);
    expect(container.querySelector('[data-testid="home-pinned"]')).toBeNull();
  });
});
