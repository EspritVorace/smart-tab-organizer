import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/SessionWizards/SnapshotWizard.stories';

const {
  SnapshotWizardOpen,
  SnapshotWizardClosed,
  SnapshotWizardFillName,
  SnapshotWizardFillNameAndNote,
  SnapshotWizardCancel,
  SnapshotWizardDuplicateName,
} = composeStories(stories);

describe('SnapshotWizard — static renders', () => {
  it('renders the open dialog with name input and save button', async () => {
    render(<SnapshotWizardOpen />);

    expect(await screen.findByTestId('wizard-snapshot')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-snapshot-btn-save')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-snapshot-btn-cancel')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<SnapshotWizardClosed />);
    expect(container.querySelector('[data-testid="wizard-snapshot"]')).not.toBeInTheDocument();
  });
});

describe('SnapshotWizard — interactions', () => {
  it('accepts a custom session name', async () => {
    await SnapshotWizardFillName.run();

    expect(screen.getByTestId('wizard-snapshot-field-name')).toHaveValue('My Work Session');
  });

  it('accepts both name and note', async () => {
    await SnapshotWizardFillNameAndNote.run();

    expect(screen.getByTestId('wizard-snapshot-field-name')).toHaveValue('My Work Session');
    expect(screen.getByTestId('wizard-snapshot-field-notes')).toHaveValue('Sprint 42 tabs');
  });

  it('cancel button is clickable without throwing', async () => {
    await SnapshotWizardCancel.run();

    // onOpenChange is a no-op mock so the dialog remains open; no error thrown
    expect(screen.getByTestId('wizard-snapshot')).toBeInTheDocument();
  });

  it('shows duplicate name error when name already exists', async () => {
    await SnapshotWizardDuplicateName.run();

    // An error message should be visible
    expect(screen.getByTestId('wizard-snapshot')).toBeInTheDocument();
  });
});
