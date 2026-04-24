import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/DomainRulesPage.stories';

const { DomainRulesPageDefault, DomainRulesPageEmpty } = composeStories(stories);

describe('DomainRulesPage (portable stories)', () => {
  it('renders the page with toolbar and rules list', () => {
    render(<DomainRulesPageDefault />);

    expect(screen.getByTestId('page-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-list')).toBeInTheDocument();
  });

  it('shows empty state when no rules and hides the toolbar', () => {
    render(<DomainRulesPageEmpty />);
    expect(screen.getByTestId('page-rules-empty')).toBeInTheDocument();
    // Add button is present in the empty placeholder (same testid as the toolbar button, mutually exclusive).
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    // Toolbar is hidden when there are no rules (search is useless, add is already in the placeholder).
    expect(screen.queryByTestId('page-rules-toolbar')).not.toBeInTheDocument();
  });

  it("affiche l'état vide compact quand la recherche ne retourne aucun résultat", async () => {
    render(<DomainRulesPageDefault />);

    const searchInput = screen.getByTestId('page-rules-search');
    fireEvent.change(searchInput, { target: { value: 'xyznotexist' } });

    await waitFor(() => {
      expect(screen.queryByTestId('page-rules-list')).not.toBeInTheDocument();
    });
    // Full empty state doit être absent (pas 0 règles sans recherche)
    expect(screen.queryByTestId('page-rules-empty')).not.toBeInTheDocument();
    // État vide compact avec message "No rules found"
    expect(screen.getByText('No rules found')).toBeInTheDocument();
  });

  it("ouvre la boite de dialogue de suppression unique avec le bon titre", async () => {
    render(<DomainRulesPageDefault />);

    // Radix UI DropdownMenu s'ouvre sur pointerDown (pas click)
    const trigger = screen.getByTestId('rule-card-rule-1-btn-dropdown');
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    // Attendre l'apparition de l'item de suppression (rendu dans un portal)
    const deleteItem = await screen.findByTestId('rule-card-rule-1-menu-delete');
    fireEvent.click(deleteItem);

    // Le dialog de suppression unitaire doit s'afficher
    await waitFor(() => {
      expect(screen.getByText('Delete this rule?')).toBeInTheDocument();
    });
  });

  it("ouvre la boite de dialogue de suppression en masse avec le bon titre", async () => {
    render(<DomainRulesPageDefault />);

    // Cocher la première règle pour faire apparaître la BulkActionsBar
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Attendre l'apparition de la barre d'actions groupées
    const deleteSelectedBtn = await screen.findByText('Delete Selected');
    fireEvent.click(deleteSelectedBtn);

    // Le dialog de suppression en masse doit s'afficher
    await waitFor(() => {
      expect(screen.getByText('Delete the selected rules?')).toBeInTheDocument();
    });
  });
});
