import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ImportSessionsWizard.stories';

const { ImportSessionsWizardOpen, ImportSessionsWizardClosed, ImportSessionsWizardStep1 } =
  composeStories(stories);

describe('ImportSessionsWizard (portable stories)', () => {
  it('renders the open dialog with source step controls', () => {
    render(<ImportSessionsWizardOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('File').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Text').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).toBeDisabled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ImportSessionsWizardClosed />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('parses text JSON and advances to step 1 (new sessions only)', async () => {
    await ImportSessionsWizardStep1.run();

    // Both imported sessions are new (no existing sessions in fake storage)
    expect(screen.getByText('New sessions (2)')).toBeInTheDocument();
    // Note from payload
    expect(screen.getByText('Exported on 2025-04-01')).toBeInTheDocument();
    // Footer buttons for step 1
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Confirm Import')).toBeInTheDocument();
  });
});
