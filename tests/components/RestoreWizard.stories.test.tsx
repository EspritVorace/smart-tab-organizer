import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/SessionWizards/RestoreWizard.stories';

const {
  RestoreWizardOpen,
  RestoreWizardNoSession,
  RestoreWizardClosed,
  RestoreWizardSelectNewWindow,
  RestoreWizardSelectReplaceWindow,
} = composeStories(stories);

describe('RestoreWizard — static renders', () => {
  it('renders the dialog with step 0 and restore controls', () => {
    render(<RestoreWizardOpen />);

    expect(screen.getByTestId('wizard-restore')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-restore-step-0')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-restore-radio-destination')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-restore-btn-restore')).toBeInTheDocument();
  });

  it('renders nothing when session is null', () => {
    const { container } = render(<RestoreWizardNoSession />);
    expect(container.querySelector('[data-testid="wizard-restore"]')).not.toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<RestoreWizardClosed />);
    expect(container.querySelector('[data-testid="wizard-restore"]')).not.toBeInTheDocument();
  });
});

describe('RestoreWizard — destination interactions', () => {
  it('switches destination to new window', async () => {
    await RestoreWizardSelectNewWindow.run();

    expect(screen.getByTestId('wizard-restore-radio-new-window')).toBeInTheDocument();
  });

  it('switches destination to replace current window', async () => {
    await RestoreWizardSelectReplaceWindow.run();

    expect(screen.getByTestId('wizard-restore-radio-replace-window')).toBeInTheDocument();
  });
});
