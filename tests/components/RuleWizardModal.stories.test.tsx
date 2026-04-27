import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/DomainRule/RuleWizardModal.stories';

const {
  RuleWizardModalCreate,
  RuleWizardModalEdit,
  RuleWizardModalEditAsk,
  RuleWizardModalEditDeduplicationDisabled,
  RuleWizardModalClosed,
  RuleWizardModalStep2,
  RuleWizardModalStep3,
  RuleWizardModalStep4,
  RuleWizardModalCreateComplete,
  RuleWizardModalValidationError,
  RuleWizardModalEditSave,
} = composeStories(stories);

describe('RuleWizardModal — static renders', () => {
  it('renders creation wizard at step 1 with cancel/next', () => {
    render(<RuleWizardModalCreate />);

    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-rule-step-1')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-rule-btn-next')).toBeInTheDocument();
  });

  it('renders edit mode with save button', () => {
    render(<RuleWizardModalEdit />);

    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-rule-btn-save')).toBeInTheDocument();
  });

  it('renders edit ask mode', () => {
    render(<RuleWizardModalEditAsk />);
    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
  });

  it('renders edit with deduplication disabled', () => {
    render(<RuleWizardModalEditDeduplicationDisabled />);
    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<RuleWizardModalClosed />);
    expect(container.querySelector('[data-testid="wizard-rule"]')).not.toBeInTheDocument();
  });
});

describe('RuleWizardModal — step navigation', () => {
  it('advances to step 2 after filling label and domain', async () => {
    await RuleWizardModalStep2.run();

    expect(screen.getByTestId('wizard-rule-step-2')).toBeInTheDocument();
  });

  it('reaches step 3 (options) after navigating through steps 1 and 2', async () => {
    await RuleWizardModalStep3.run();

    expect(screen.getByTestId('wizard-rule-step-3')).toBeInTheDocument();
  });

  it('reaches step 4 (summary) after navigating through all previous steps', async () => {
    await RuleWizardModalStep4.run();

    expect(screen.getByTestId('wizard-rule-step-4')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-rule-btn-create')).toBeInTheDocument();
  });

  it('Create button is clickable on step 4 and wizard remains in DOM', async () => {
    await RuleWizardModalCreateComplete.run();

    // isOpen is controlled externally by the mock args so the dialog stays in DOM,
    // but the create button was successfully reached and clicked (no error thrown).
    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
  });

  it('stays on step 1 when trying to advance with empty fields', async () => {
    await RuleWizardModalValidationError.run();

    expect(screen.getByTestId('wizard-rule-step-1')).toBeInTheDocument();
  });

  it('Save button is clickable in edit mode', async () => {
    await RuleWizardModalEditSave.run();

    // isOpen is controlled externally so dialog stays in DOM after mock onClose
    expect(screen.getByTestId('wizard-rule')).toBeInTheDocument();
  });
});
