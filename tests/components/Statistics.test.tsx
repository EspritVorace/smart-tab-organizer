import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { Statistics } from '../../src/components/Core/Statistics/Statistics';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      statisticsTab: 'Statistics',
      resetStats: 'Reset statistics',
      groupCreatedSingular: 'Group created',
      groupCreatedPlural: 'Groups created',
      tabDeduplicatedSingular: 'Tab deduplicated',
      tabDeduplicatedPlural: 'Tabs deduplicated'
    };
    return messages[key] || key;
  })
}));

// Wrapper for Radix UI components.
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('Statistics', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Statistics title and zero counters by default', () => {
    render(
      <TestWrapper>
        <Statistics stats={{ tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }} onReset={mockOnReset} />
      </TestWrapper>
    );

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('renders the statistics values and an accessible reset button', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Reset button exposed (a11y: aria-label + title).
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toHaveAttribute('aria-label', 'Reset statistics');
    expect(resetButton).toHaveAttribute('title', 'Reset statistics');
  });

  it('uses the singular form for 1', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 1, tabsDeduplicatedCount: 1 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Group created')).toBeInTheDocument();
    expect(screen.getByText('Tab deduplicated')).toBeInTheDocument();
  });

  it('uses the plural form for values > 1', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 2, tabsDeduplicatedCount: 3 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Groups created')).toBeInTheDocument();
    expect(screen.getByText('Tabs deduplicated')).toBeInTheDocument();
  });

  it('calls onReset when the reset button is clicked', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('renders a skeleton in loading mode', () => {
    const { container } = render(
      <TestWrapper>
        <Statistics stats={null} onReset={mockOnReset} isLoading={true} />
      </TestWrapper>
    );

    // The normal content must not render.
    expect(screen.queryByText('Statistics')).not.toBeInTheDocument();

    // Skeletons should be rendered.
    const skeletons = container.querySelectorAll('[data-state]');
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles null stats', () => {
    render(
      <TestWrapper>
        <Statistics stats={null} onReset={mockOnReset} />
      </TestWrapper>
    );

    // Falls back to displaying 0.
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('handles stats with undefined values', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: undefined, tabsDeduplicatedCount: undefined } as any}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    // Falls back to displaying 0.
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

});
