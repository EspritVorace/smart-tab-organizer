import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { TabTree } from '../../src/components/Core/TabTree/TabTree';
import type { TabTreeData } from '../../src/types/tabTree';

// Mock i18n
vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
    const messages: Record<string, string> = {
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      tabTreeSelectedCount: '$1 / $2 tabs selected',
      tabTreeSelectTab: 'Select tab $1',
      tabTreeSelectGroup: 'Select group $1',
      tabTreeExpandGroup: 'Expand group $1',
      tabTreeCollapseGroup: 'Collapse group $1',
    };
    let msg = messages[key] || key;
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, i) => {
        msg = msg.replace(`$${i + 1}`, sub);
      });
    }
    return msg;
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

/* ─── Test data ─── */

const createSampleData = (): TabTreeData => ({
  groups: [
    {
      id: 1,
      title: 'Jira Tickets',
      color: 'red',
      tabs: [
        { id: 42, title: 'PROJ-123 - Fix bug', url: 'https://jira.company.com/browse/PROJ-123' },
        { id: 43, title: 'PROJ-456 - Add feature', url: 'https://jira.company.com/browse/PROJ-456' },
      ],
    },
  ],
  ungroupedTabs: [
    { id: 99, title: 'Claude.ai', url: 'https://claude.ai/' },
  ],
});

const createEmptyData = (): TabTreeData => ({
  groups: [],
  ungroupedTabs: [],
});

/* ─── Tests ─── */

describe('TabTree', () => {
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('devrait afficher les noms des groupes', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Jira Tickets')).toBeInTheDocument();
    });

    it('devrait afficher les titres des onglets', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('PROJ-123 - Fix bug')).toBeInTheDocument();
      expect(screen.getByText('PROJ-456 - Add feature')).toBeInTheDocument();
      expect(screen.getByText('Claude.ai')).toBeInTheDocument();
    });

    it('devrait afficher les domaines des onglets', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      // Two Jira tabs share the same domain
      expect(screen.getAllByText('jira.company.com')).toHaveLength(2);
      expect(screen.getByText('claude.ai')).toBeInTheDocument();
    });

    it('devrait afficher le nombre d\'enfants du groupe', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('devrait afficher le compteur de sélection', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set([42])}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('1 / 3 tabs selected')).toBeInTheDocument();
    });
  });

  describe('action bar', () => {
    it('devrait afficher "Select All" quand rien n\'est sélectionné', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('devrait afficher "Deselect All" quand tout est sélectionné', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set([42, 43, 99])}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('devrait appeler onSelectionChange avec tous les IDs au clic sur Select All', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Select All'));
      expect(mockOnSelectionChange).toHaveBeenCalledTimes(1);
      const args = mockOnSelectionChange.mock.calls[0][0] as Set<number>;
      expect(args.size).toBe(3);
      expect(args.has(42)).toBe(true);
      expect(args.has(43)).toBe(true);
      expect(args.has(99)).toBe(true);
    });

    it('devrait appeler onSelectionChange avec un Set vide au clic sur Deselect All', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set([42, 43, 99])}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      mockOnSelectionChange.mockClear();
      fireEvent.click(screen.getByText('Deselect All'));
      expect(mockOnSelectionChange).toHaveBeenCalled();
      const lastCall = mockOnSelectionChange.mock.calls[mockOnSelectionChange.mock.calls.length - 1];
      const args = lastCall[0] as Set<number>;
      expect(args.size).toBe(0);
    });
  });

  describe('empty state', () => {
    it('devrait gérer des données vides sans erreur', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createEmptyData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('0 / 0 tabs selected')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('devrait avoir un rôle tree sur le conteneur', () => {
      const { container } = render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
    });

    it('devrait avoir des rôles treeitem sur les nœuds', () => {
      const { container } = render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      const treeitems = container.querySelectorAll('[role="treeitem"]');
      expect(treeitems.length).toBeGreaterThan(0);
    });

    it('devrait avoir des aria-label sur les checkboxes des groupes', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Select group Jira Tickets')).toBeInTheDocument();
    });

    it('devrait avoir des aria-label sur les checkboxes des onglets', () => {
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Select tab PROJ-123 - Fix bug')).toBeInTheDocument();
      expect(screen.getByLabelText('Select tab Claude.ai')).toBeInTheDocument();
    });
  });

  describe('maxHeight', () => {
    it('devrait rendre un ScrollArea quand maxHeight est défini', () => {
      const { container } = render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
            maxHeight={200}
          />
        </TestWrapper>
      );

      // Radix ScrollArea adds a data-radix-scroll-area-viewport element
      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollArea).toBeInTheDocument();
    });

    it('ne devrait pas rendre un ScrollArea quand maxHeight n\'est pas défini', () => {
      const { container } = render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
          />
        </TestWrapper>
      );

      const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
      expect(scrollArea).not.toBeInTheDocument();
    });
  });

  describe('onTabClick', () => {
    it('devrait appeler onTabClick quand on clique sur le titre d\'un onglet', () => {
      const mockTabClick = vi.fn();
      render(
        <TestWrapper>
          <TabTree
            data={createSampleData()}
            selectedTabIds={new Set()}
            onSelectionChange={mockOnSelectionChange}
            onTabClick={mockTabClick}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Claude.ai'));
      expect(mockTabClick).toHaveBeenCalledTimes(1);
      expect(mockTabClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 99,
          title: 'Claude.ai',
          url: 'https://claude.ai/',
        })
      );
    });
  });
});
