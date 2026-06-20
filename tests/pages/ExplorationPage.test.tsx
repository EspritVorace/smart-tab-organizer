import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { fakeBrowser } from 'wxt/testing';
import { ExplorationPage } from '../../src/pages/ExplorationPage';
import { defaultAppSettings } from '../../src/types/syncSettings';

function stubMatchMedia() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

function renderPage(onSequencePrefixChange?: (p: string[] | null) => void) {
  return render(
    <Theme>
      <ExplorationPage
        syncSettings={defaultAppSettings}
        onSequencePrefixChange={onSequencePrefixChange}
      />
    </Theme>,
  );
}

beforeEach(() => {
  fakeBrowser.reset();
  stubMatchMedia();
  window.location.hash = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ExplorationPage', () => {
  it('renders the coverage summary, filters, search and the per-domain catalogue', async () => {
    renderPage();

    expect(await screen.findByTestId('page-exploration')).toBeInTheDocument();
    expect(screen.getByTestId('exploration-coverage-summary')).toBeInTheDocument();
    expect(screen.getByTestId('exploration-filter')).toBeInTheDocument();
    expect(screen.getByTestId('page-exploration-search')).toBeInTheDocument();

    // Domain groups are rendered (at least the first incomplete one).
    await waitFor(() =>
      expect(document.querySelectorAll('[data-exploration-nav-item]').length).toBeGreaterThan(0),
    );
  });

  it('marks stats.exploration as discovered on mount', async () => {
    renderPage();
    await screen.findByTestId('page-exploration');
    await waitFor(async () => {
      const raw = await fakeBrowser.storage.local.get('explorationProgress');
      const progress = raw.explorationProgress as { discovered?: string[] } | undefined;
      expect(progress?.discovered).toContain('stats.exploration');
    });
  });

  it('filters down to the empty state when a search matches nothing', async () => {
    renderPage();
    await screen.findByTestId('page-exploration');

    const searchRoot = screen.getByTestId('page-exploration-search');
    const search = (searchRoot.tagName === 'INPUT'
      ? searchRoot
      : searchRoot.querySelector('input')) as HTMLInputElement;
    fireEvent.change(search, { target: { value: 'zzz-no-such-capability-zzz' } });

    expect(await screen.findByTestId('exploration-empty')).toBeInTheDocument();
  });

  it('persists the filter choice when a segment is selected', async () => {
    renderPage();
    await screen.findByTestId('page-exploration');

    // Radix SegmentedControl items expose role="radio" with an accessible name.
    const discovered = screen.getByRole('radio', { name: /discovered/i });
    fireEvent.click(discovered);

    await waitFor(async () => {
      const raw = await fakeBrowser.storage.local.get('explorationFilter');
      expect(raw.explorationFilter).toBe('discovered');
    });
  });
});
