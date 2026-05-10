import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/DomainRulesPage.stories';

const { DomainRulesPageDefault, DomainRulesPageEmpty } = composeStories(stories);

describe('DomainRulesPage (portable stories)', () => {
  it('renders the page with toolbar, list, and search empty state', async () => {
    render(<DomainRulesPageDefault />);

    expect(screen.getByTestId('page-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-list')).toBeInTheDocument();

    // Compact empty state when the search returns no results.
    const searchInput = screen.getByTestId('page-rules-search');
    fireEvent.change(searchInput, { target: { value: 'xyznotexist' } });

    await waitFor(() => {
      expect(screen.queryByTestId('page-rules-list')).not.toBeInTheDocument();
    });
    // The full empty state must not be rendered (we are not at 0 rules without a search).
    expect(screen.queryByTestId('page-rules-empty')).not.toBeInTheDocument();
    // Compact empty state with the "No rules found" message.
    expect(screen.getByText('No rules found')).toBeInTheDocument();
  });

  it('shows empty state when no rules and hides the toolbar', () => {
    render(<DomainRulesPageEmpty />);
    expect(screen.getByTestId('page-rules-empty')).toBeInTheDocument();
    // Add button is present in the empty placeholder (same testid as the toolbar button, mutually exclusive).
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    // Toolbar is hidden when there are no rules (search is useless, add is already in the placeholder).
    expect(screen.queryByTestId('page-rules-toolbar')).not.toBeInTheDocument();
  });

  it('single delete: opens dialog with correct title and confirms (handleConfirmDelete - single)', async () => {
    render(<DomainRulesPageDefault />);

    // The Radix UI DropdownMenu opens on pointerDown (not click).
    const trigger = screen.getByTestId('rule-card-rule-1-btn-dropdown');
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    // Wait for the delete item (rendered inside a portal).
    const deleteItem = await screen.findByTestId('rule-card-rule-1-menu-delete');
    fireEvent.click(deleteItem);

    // The single-delete dialog must appear.
    await waitFor(() => {
      expect(screen.getByText('Delete this rule?')).toBeInTheDocument();
    });

    const confirmBtn = await screen.findByTestId('confirm-dialog-btn-confirm');
    fireEvent.click(confirmBtn);

    // The dialog closes after confirmation.
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  it('bulk delete: opens dialog with correct title and confirms (handleConfirmDelete - bulk)', async () => {
    render(<DomainRulesPageDefault />);

    // Check the first rule to surface the BulkActionsBar.
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Wait for the bulk actions bar to appear.
    const deleteSelectedBtn = await screen.findByText('Delete Selected');
    fireEvent.click(deleteSelectedBtn);

    // The bulk delete dialog must appear.
    await waitFor(() => {
      expect(screen.getByText('Delete the selected rules?')).toBeInTheDocument();
    });

    const confirmBtn = await screen.findByTestId('confirm-dialog-btn-confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  it("opens the add modal when the Add button is clicked (handleSaveRule)", async () => {
    render(<DomainRulesPageDefault />);

    fireEvent.click(screen.getByTestId('page-rules-btn-add'));

    // The modal opens.
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Close the modal (handleCloseModal).
    const closeBtn = document.querySelector('[aria-label="Close"]') as HTMLElement | null;
    if (closeBtn) fireEvent.click(closeBtn);
  });
});
