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
  it('renders the gallery grouped by category', () => {
    render(<PackGalleryDefault />);
    expect(screen.getByTestId('pack-gallery')).toBeInTheDocument();
    expect(screen.getByText('Cloud Console')).toBeInTheDocument();
    expect(screen.getByText('Code Hosting')).toBeInTheDocument();
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

  it('reflects the selected state on a pack card after clicking its checkbox', () => {
    render(<PackGalleryDefault />);

    const checkbox = screen.getByTestId('pack-card-pk-github-checkbox');
    expect(checkbox.getAttribute('data-state')).toBe('unchecked');
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('shows the no-result message when search matches nothing', () => {
    render(<PackGalleryDefault />);
    const search = within(screen.getByTestId('pack-gallery')).getByRole('textbox');
    fireEvent.change(search, { target: { value: 'no-match-xyz' } });
    expect(screen.getByTestId('pack-gallery-search-empty')).toBeInTheDocument();
  });
});
