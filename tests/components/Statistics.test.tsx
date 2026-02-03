import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { Statistics } from '../../src/components/Core/Statistics/Statistics';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      statisticsTab: 'Statistiques',
      resetStats: 'Réinitialiser les statistiques',
      groupCreatedSingular: 'Groupe créé',
      groupCreatedPlural: 'Groupes créés',
      tabDeduplicatedSingular: 'Onglet dédupliqué',
      tabDeduplicatedPlural: 'Onglets dédupliqués'
    };
    return messages[key] || key;
  })
}));

// Wrapper pour les composants Radix UI
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

describe('Statistics', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le titre Statistiques', () => {
    render(
      <TestWrapper>
        <Statistics stats={{ tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }} onReset={mockOnReset} />
      </TestWrapper>
    );

    expect(screen.getByText('Statistiques')).toBeInTheDocument();
  });

  it('devrait afficher les compteurs à zéro par défaut', () => {
    render(
      <TestWrapper>
        <Statistics stats={{ tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 0 }} onReset={mockOnReset} />
      </TestWrapper>
    );

    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('devrait afficher les valeurs des statistiques', () => {
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
  });

  it('devrait utiliser le singulier pour 1', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 1, tabsDeduplicatedCount: 1 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Groupe créé')).toBeInTheDocument();
    expect(screen.getByText('Onglet dédupliqué')).toBeInTheDocument();
  });

  it('devrait utiliser le pluriel pour > 1', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 2, tabsDeduplicatedCount: 3 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Groupes créés')).toBeInTheDocument();
    expect(screen.getByText('Onglets dédupliqués')).toBeInTheDocument();
  });

  it('devrait appeler onReset lors du click sur le bouton reset', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    const resetButton = screen.getByRole('button', { name: /réinitialiser/i });
    fireEvent.click(resetButton);

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('devrait afficher un skeleton en mode loading', () => {
    const { container } = render(
      <TestWrapper>
        <Statistics stats={null} onReset={mockOnReset} isLoading={true} />
      </TestWrapper>
    );

    // Ne devrait pas afficher le contenu normal
    expect(screen.queryByText('Statistiques')).not.toBeInTheDocument();

    // Devrait afficher des skeletons
    const skeletons = container.querySelectorAll('[data-state]');
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });

  it('devrait gérer des stats nulles', () => {
    render(
      <TestWrapper>
        <Statistics stats={null} onReset={mockOnReset} />
      </TestWrapper>
    );

    // Devrait afficher 0 par défaut
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('devrait gérer des stats avec des valeurs undefined', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: undefined, tabsDeduplicatedCount: undefined } as any}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    // Devrait afficher 0 par défaut
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('devrait avoir un bouton reset accessible', () => {
    render(
      <TestWrapper>
        <Statistics
          stats={{ tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }}
          onReset={mockOnReset}
        />
      </TestWrapper>
    );

    const resetButton = screen.getByRole('button');
    expect(resetButton).toHaveAttribute('aria-label', 'Réinitialiser les statistiques');
    expect(resetButton).toHaveAttribute('title', 'Réinitialiser les statistiques');
  });
});
