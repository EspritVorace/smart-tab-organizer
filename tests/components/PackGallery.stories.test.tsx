import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Pack/PackGallery/PackGallery.stories';

const composed = composeStories(stories);
const {
  PackGalleryDefault,
  PackGalleryEmpty,
  PackGalleryWithSearch,
  PackGalleryConfigurableExpanded,
} = composed;

describe('PackGallery (stories)', () => {
  it('renders the gallery grouped by category and disables the confirm button initially', () => {
    render(<PackGalleryDefault />);
    expect(screen.getByTestId('pack-gallery')).toBeInTheDocument();
    expect(screen.getByText('Cloud Console')).toBeInTheDocument();
    expect(screen.getByText('Code Hosting')).toBeInTheDocument();
    expect(screen.getByTestId('pack-gallery-confirm')).toBeDisabled();
  });

  it('shows the empty state when there are no packs', () => {
    render(<PackGalleryEmpty />);
    expect(screen.getByTestId('pack-gallery-empty')).toBeInTheDocument();
  });

  it('shows the configurable variant', () => {
    render(<PackGalleryConfigurableExpanded />);
    expect(screen.getByText('Cloud Console')).toBeInTheDocument();
  });

  it('renders the with-search variant', async () => {
    render(<PackGalleryWithSearch />);
    // The story applies its initialSearch via a setTimeout; wait for it.
    await waitFor(() => {
      expect(screen.queryByText('Cloud Console')).toBeNull();
    });
    expect(screen.getByText('Code Hosting')).toBeInTheDocument();
  });

  it('selecting a pack enables the confirm button and updates the global counter', () => {
    render(<PackGalleryDefault />);

    const checkbox = screen.getByTestId('pack-card-pk-github-checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByTestId('pack-gallery-confirm')).not.toBeDisabled();
    const counter = screen.getByTestId('pack-gallery-counter');
    expect(counter.textContent).not.toBe('packGalleryGlobalCounterEmpty');
  });

  it('shows the no-result message when search matches nothing', () => {
    render(<PackGalleryDefault />);
    const search = within(screen.getByTestId('pack-gallery')).getByRole('textbox');
    fireEvent.change(search, { target: { value: 'no-match-xyz' } });
    expect(screen.getByTestId('pack-gallery-search-empty')).toBeInTheDocument();
  });
});
