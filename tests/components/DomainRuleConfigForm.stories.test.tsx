import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/DomainRule/DomainRuleConfigForm.stories';

const {
  DomainRuleConfigFormPreset,
  DomainRuleConfigFormLoading,
  DomainRuleConfigFormSwitchToManual,
  DomainRuleConfigFormSwitchToAsk,
  DomainRuleConfigFormManualWithRegex,
} = composeStories(stories);

describe('DomainRuleConfigForm — static renders', () => {
  it('renders in preset mode with the mode selector', () => {
    render(<DomainRuleConfigFormPreset />);
    expect(screen.getByRole('radio', { name: /preset/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /manual/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /ask/i })).toBeInTheDocument();
  });

  it('shows loading callout when presets are loading', () => {
    render(<DomainRuleConfigFormLoading />);
    expect(screen.getByText('Loading presets...')).toBeInTheDocument();
  });
});

describe('DomainRuleConfigForm — mode switching', () => {
  it('switches to Manual mode and Preset radio is no longer checked', async () => {
    await DomainRuleConfigFormSwitchToManual.run();

    expect(screen.getByRole('radio', { name: /manual/i })).toBeChecked();
  });

  it('switches to Ask mode', async () => {
    await DomainRuleConfigFormSwitchToAsk.run();

    expect(screen.getByRole('radio', { name: /ask/i })).toBeChecked();
  });

  it('fills a regex in manual mode without error', async () => {
    await DomainRuleConfigFormManualWithRegex.run();

    expect(screen.getByRole('radio', { name: /manual/i })).toBeInTheDocument();
  });
});
