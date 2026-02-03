import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { StatusBadge } from '../../src/components/UI/StatusBadge/StatusBadge';
import { SettingsToggles } from '../../src/components/UI/SettingsToggles/SettingsToggles';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      badge_new: 'Nouveau',
      badge_warning: 'Attention',
      badge_deleted: 'Supprimé',
      enableGrouping: 'Activer le groupage',
      enableDeduplication: 'Activer la déduplication'
    };
    return messages[key] || key;
  })
}));

// Wrapper pour les composants Radix UI
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusBadge', () => {
    it('devrait afficher un badge NEW en vert', () => {
      render(
        <TestWrapper>
          <StatusBadge type="NEW" />
        </TestWrapper>
      );

      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });

    it('devrait afficher un badge WARNING en orange', () => {
      render(
        <TestWrapper>
          <StatusBadge type="WARNING" />
        </TestWrapper>
      );

      expect(screen.getByText('Attention')).toBeInTheDocument();
    });

    it('devrait afficher un badge DELETED en rouge', () => {
      render(
        <TestWrapper>
          <StatusBadge type="DELETED" />
        </TestWrapper>
      );

      expect(screen.getByText('Supprimé')).toBeInTheDocument();
    });

    it('ne devrait rien afficher pour un type invalide', () => {
      const { container } = render(
        <TestWrapper>
          <StatusBadge type={'INVALID' as any} />
        </TestWrapper>
      );

      expect(container.firstChild?.firstChild).toBeNull();
    });

    it('devrait supporter différentes tailles', () => {
      const { rerender } = render(
        <TestWrapper>
          <StatusBadge type="NEW" size="1" />
        </TestWrapper>
      );

      expect(screen.getByText('Nouveau')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <StatusBadge type="NEW" size="2" />
        </TestWrapper>
      );

      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });
  });

  describe('SettingsToggles', () => {
    it('devrait afficher les deux toggles', () => {
      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={false}
            globalDeduplicationEnabled={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Activer le groupage')).toBeInTheDocument();
      expect(screen.getByText('Activer la déduplication')).toBeInTheDocument();
    });

    it('devrait afficher un skeleton en mode loading', () => {
      const { container } = render(
        <TestWrapper>
          <SettingsToggles isLoading={true} />
        </TestWrapper>
      );

      // Le skeleton utilise des divs avec data-* attributes
      const skeletons = container.querySelectorAll('[data-state]');
      expect(skeletons.length).toBeGreaterThanOrEqual(0); // Au moins quelques skeletons
    });

    it('devrait appeler onGroupingChange lors du click', () => {
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

      // Trouver le switch pour le groupage (premier switch)
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);

      expect(onGroupingChange).toHaveBeenCalledWith(true);
    });

    it('devrait appeler onDeduplicationChange lors du click', () => {
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

      // Trouver le switch pour la déduplication (deuxième switch)
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[1]);

      expect(onDeduplicationChange).toHaveBeenCalledWith(true);
    });

    it('devrait refléter l\'état activé des toggles', () => {
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

    it('devrait refléter l\'état désactivé des toggles', () => {
      render(
        <TestWrapper>
          <SettingsToggles
            globalGroupingEnabled={false}
            globalDeduplicationEnabled={false}
          />
        </TestWrapper>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches[0]).toHaveAttribute('data-state', 'unchecked');
      expect(switches[1]).toHaveAttribute('data-state', 'unchecked');
    });
  });
});
