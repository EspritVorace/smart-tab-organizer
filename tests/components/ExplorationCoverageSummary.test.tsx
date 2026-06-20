import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { ExplorationCoverageSummary } from '../../src/components/Core/Exploration/ExplorationCoverageSummary';
import { computeCoverage } from '../../src/exploration/coverage';
import type { ExplorationProgress } from '../../src/types/exploration';
import { CATALOG } from '../../src/exploration/catalog';

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

function progress(p: Partial<ExplorationProgress> = {}): ExplorationProgress {
  return { discovered: [], manuallyMarked: [], values: {}, initializedAt: 1, ...p };
}

// matchMedia is consulted by the count-up animation. Default it to "no reduced
// motion" so the requestAnimationFrame path runs; individual tests override it.
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ExplorationCoverageSummary', () => {
  it('renders the coverage ratio and the phase bar bands', async () => {
    const someIds = CATALOG.slice(0, 5).map((c) => c.id);
    const coverage = computeCoverage(progress({ discovered: someIds }));

    renderWithTheme(<ExplorationCoverageSummary coverage={coverage} />);

    expect(screen.getByTestId('exploration-coverage-summary')).toBeInTheDocument();
    // The exact ratio text ("5 of N capabilities discovered") is rendered
    // regardless of the count-up animation.
    expect(
      screen.getByText(new RegExp(`${coverage.discovered} of ${coverage.total}`)),
    ).toBeInTheDocument();
    // Four phase bands, each exposed as a labelled group.
    expect(screen.getAllByRole('group').length).toBe(4);
  });

  it('jumps straight to the final percentage under prefers-reduced-motion', async () => {
    stubMatchMedia(true);
    const allIds = CATALOG.map((c) => c.id);
    const coverage = computeCoverage(progress({ discovered: allIds }));

    renderWithTheme(<ExplorationCoverageSummary coverage={coverage} />);

    // 100% coverage, no animation: the big number is the final value immediately.
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
  });

  it('handles an empty (0%) coverage without throwing', () => {
    const coverage = computeCoverage(progress());
    renderWithTheme(<ExplorationCoverageSummary coverage={coverage} />);
    expect(screen.getByTestId('exploration-coverage-summary')).toBeInTheDocument();
  });
});
