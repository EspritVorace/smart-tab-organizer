import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/HomePage/PinnedSessionTile.stories';

const {
  PinnedSessionTileDefault,
  PinnedSessionTileLongName,
  PinnedSessionTileSingleTab,
  PinnedSessionTileEmpty,
} = composeStories(stories);

describe('PinnedSessionTile (portable stories)', () => {
  it('default story renders name, meta, restore button and forwards onRestore("current")', () => {
    const onRestore = vi.fn();
    render(<PinnedSessionTileDefault onRestore={onRestore} />);

    expect(screen.getByText('Current work')).toBeInTheDocument();
    expect(screen.getByTestId('home-pinned-tile-s1')).toBeInTheDocument();
    const restoreBtn = screen.getByTestId('home-pinned-tile-restore-s1');
    expect(restoreBtn).toBeInTheDocument();

    fireEvent.click(restoreBtn);
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore.mock.calls[0][1]).toBe('current');
  });

  it('long-name story still mounts the truncated label', () => {
    render(<PinnedSessionTileLongName />);
    expect(
      screen.getByText(/A session with a deliberately long name/),
    ).toBeInTheDocument();
  });

  it('single-tab and empty stories mount without throwing', () => {
    render(
      <>
        <PinnedSessionTileSingleTab />
        <PinnedSessionTileEmpty />
      </>,
    );
    expect(screen.getByTestId('home-pinned-tile-s-single')).toBeInTheDocument();
    expect(screen.getByTestId('home-pinned-tile-s-empty')).toBeInTheDocument();
  });
});
