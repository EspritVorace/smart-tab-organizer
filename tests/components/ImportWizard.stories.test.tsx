import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ImportWizard.stories';

const {
  ImportWizardOpen,
  ImportWizardClosed,
  ImportWizardStep1Classification,
  ImportWizardConflictDuplicate,
} = composeStories(stories);

describe('ImportWizard (portable stories)', () => {
  it('renders the open dialog with source step controls', () => {
    render(<ImportWizardOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('File').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Text').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).toBeDisabled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ImportWizardClosed />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('parses text JSON and advances to the classification step', async () => {
    await ImportWizardStep1Classification.run();

    // Step 1 group headers (with counts). Match the exact translated format.
    expect(screen.getByText('New rules (1)')).toBeInTheDocument();
    expect(screen.getByText('Conflicting rules (1)')).toBeInTheDocument();
    // Note from payload is rendered
    expect(screen.getByText('Imported from other browser')).toBeInTheDocument();
    // Footer buttons for step 1
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Confirm Import')).toBeInTheDocument();
  });

  it('switches conflict mode to duplicate', async () => {
    await ImportWizardConflictDuplicate.run();

    // Active segmented control now shows "Duplicate"
    const dupButtons = screen.getAllByText('Duplicate').map(el => el.closest('button'));
    const activeDup = dupButtons.find(btn => btn?.getAttribute('data-state') === 'on');
    expect(activeDup).toBeTruthy();
  });
});
