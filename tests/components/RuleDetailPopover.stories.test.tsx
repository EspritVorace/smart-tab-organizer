import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/DomainRule/RuleDetailPopover.stories';

const {
  RuleDetailPopoverEnabled,
  RuleDetailPopoverDisabled,
  RuleDetailPopoverWithPreset,
  RuleDetailPopoverDeduplicationDisabled,
  RuleDetailPopoverWithSearchHighlight,
  RuleDetailPopoverUrlMode,
  RuleDetailPopoverManualMode,
} = composeStories(stories);

describe('RuleDetailPopover', () => {
  it('renders label and domain filter for an enabled rule', () => {
    render(<RuleDetailPopoverEnabled />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows Disabled badge for a disabled rule', () => {
    render(<RuleDetailPopoverDisabled />);
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('renders a rule with preset groupNameSource', () => {
    render(<RuleDetailPopoverWithPreset />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders a rule with deduplication disabled', () => {
    render(<RuleDetailPopoverDeduplicationDisabled />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders with search highlight (no crash)', () => {
    const { container } = render(<RuleDetailPopoverWithSearchHighlight />);
    // AccessibleHighlight splits text across spans; verify the popover is rendered
    expect(container.textContent).toContain('Enabled');
  });

  it('renders a rule in URL mode', () => {
    render(<RuleDetailPopoverUrlMode />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('renders a rule in manual mode', () => {
    render(<RuleDetailPopoverManualMode />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
