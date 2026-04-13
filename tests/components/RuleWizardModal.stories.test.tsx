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
} = composeStories(stories);

describe('RuleWizardModal (portable stories)', () => {
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
