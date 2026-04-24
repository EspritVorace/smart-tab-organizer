import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/ImportExportPage.stories';

const { ImportExportPageDefault, ImportExportPageWithRules } = composeStories(stories);

describe('ImportExportPage (portable stories)', () => {
  it('renders the page with four action cards', async () => {
    render(<ImportExportPageDefault />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    expect(screen.getByTestId('page-import-export-card-export-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-export-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-sessions')).toBeInTheDocument();
  });

  it('désactive le bouton export-rules quand il n\'y a aucune règle', async () => {
    render(<ImportExportPageDefault />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    const card = screen.getByTestId('page-import-export-card-export-rules');
    expect(card.querySelector('button')).toBeDisabled();
  });

  it('active le bouton export-rules quand des règles existent', async () => {
    render(<ImportExportPageWithRules />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    const card = screen.getByTestId('page-import-export-card-export-rules');
    expect(card.querySelector('button')).not.toBeDisabled();
  });

  it('ouvre le dialog d\'export de règles au clic', async () => {
    render(<ImportExportPageWithRules />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export-card-export-rules')).toBeInTheDocument();
    });
    const exportBtn = screen.getByTestId('page-import-export-card-export-rules').querySelector('button')!;
    fireEvent.click(exportBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('ouvre le dialog d\'import de règles au clic', async () => {
    render(<ImportExportPageDefault />);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export-card-import-rules')).toBeInTheDocument();
    });
    const importBtn = screen.getByTestId('page-import-export-card-import-rules').querySelector('button')!;
    fireEvent.click(importBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
