import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ExportSessionsWizard.stories';

const { ExportSessionsWizardOpen, ExportSessionsWizardClosed } = composeStories(stories);

describe('ExportSessionsWizard (portable stories)', () => {
  it('renders the open dialog with selection controls', () => {
    render(<ExportSessionsWizardOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
    expect(screen.getByText('Note (optional)')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ExportSessionsWizardClosed />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
