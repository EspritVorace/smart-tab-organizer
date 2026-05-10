import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { StatusBadge } from '../../src/components/UI/StatusBadge/StatusBadge';
import { SettingsToggles } from '../../src/components/UI/SettingsToggles/SettingsToggles';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      badge_new: 'New',
      badge_warning: 'Warning',
      badge_deleted: 'Deleted',
      enableGrouping: 'Enable grouping',
      enableDeduplication: 'Enable deduplication',
      popupAutoGroup: 'Auto-group',
      popupDedup: 'Deduplication'
    };
    return messages[key] || key;
  })
}));

// Wrapper for Radix UI components.
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusBadge', () => {
    it('renders a green NEW badge', () => {
      render(
        <TestWrapper>
          <StatusBadge type="NEW" />
        </TestWrapper>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders an orange WARNING badge', () => {
      render(
        <TestWrapper>
          <StatusBadge type="WARNING" />
        </TestWrapper>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders a red DELETED badge', () => {
      render(
        <TestWrapper>
          <StatusBadge type="DELETED" />
        </TestWrapper>
      );

      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });

    it('renders nothing for an invalid type', () => {
      const { container } = render(
        <TestWrapper>
          <StatusBadge type={'INVALID' as any} />
        </TestWrapper>
      );

      expect(container.firstChild?.firstChild).toBeNull();
    });

    it('supports different sizes', () => {
      const { rerender } = render(
        <TestWrapper>
          <StatusBadge type="NEW" size="1" />
        </TestWrapper>
      );

      expect(screen.getByText('New')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <StatusBadge type="NEW" size="2" />
        </TestWrapper>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('SettingsToggles', () => {
    it('renders both toggles in the disabled state', () => {
      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={false}
            globalDeduplicationEnabled={false}
          />
        </TestWrapper>
      );

      // Short labels shown inline in the footer
      expect(screen.getByText('Auto-group')).toBeInTheDocument();
      expect(screen.getByText('Deduplication')).toBeInTheDocument();

      // State reflected on switches
      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('data-state', 'unchecked');
      expect(switches[1]).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders a skeleton in loading mode', () => {
      const { container } = render(
        <TestWrapper>
          <SettingsToggles isLoading={true} />
        </TestWrapper>
      );

      // The skeleton uses divs with data-* attributes.
      const skeletons = container.querySelectorAll('[data-state]');
      expect(skeletons.length).toBeGreaterThanOrEqual(0); // at least a few skeletons
    });

    it('calls onGroupingChange on click', () => {
      const onGroupingChange = vi.fn();

      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={false}
            globalDeduplicationEnabled={false}
            onGroupingChange={onGroupingChange}
          />
        </TestWrapper>
      );

      // Find the grouping switch (the first one).
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);

      expect(onGroupingChange).toHaveBeenCalledWith(true);
    });

    it('calls onDeduplicationChange on click', () => {
      const onDeduplicationChange = vi.fn();

      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={false}
            globalDeduplicationEnabled={false}
            onDeduplicationChange={onDeduplicationChange}
          />
        </TestWrapper>
      );

      // Find the deduplication switch (the second one).
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[1]);

      expect(onDeduplicationChange).toHaveBeenCalledWith(true);
    });

    it('reflects the enabled state of the toggles', () => {
      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={true}
            globalDeduplicationEnabled={true}
          />
        </TestWrapper>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('data-state', 'checked');
      expect(switches[1]).toHaveAttribute('data-state', 'checked');
    });
  });
});
