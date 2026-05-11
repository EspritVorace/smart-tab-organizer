import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/ImportExportPage.stories';

const { ImportExportPageDefault, ImportExportPageWithRules } = composeStories(stories);

describe('ImportExportPage (portable stories)', () => {
  it('renders four action cards, disables export-rules without rules, and opens the import dialog', async () => {
    render(<ImportExportPageDefault />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    expect(screen.getByTestId('page-import-export-card-export-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-export-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-sessions')).toBeInTheDocument();

    const exportCard = screen.getByTestId('page-import-export-card-export-rules');
    expect(exportCard.querySelector('button')).toBeDisabled();

    const importBtn = screen
      .getByTestId('page-import-export-card-import-rules')
      .querySelector('button')!;
    fireEvent.click(importBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('enables the export-rules button when rules exist and opens the dialog on click', async () => {
    render(<ImportExportPageWithRules />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    const card = screen.getByTestId('page-import-export-card-export-rules');
    const exportBtn = card.querySelector('button')!;
    expect(exportBtn).not.toBeDisabled();

    fireEvent.click(exportBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
