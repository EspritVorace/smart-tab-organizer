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
  RuleDetailPopoverWithTimestampsCreatedOnly,
  RuleDetailPopoverWithTimestampsModified,
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

  it('shows the created prefix with createdAt when timestamps match', () => {
    render(<RuleDetailPopoverWithTimestampsCreatedOnly />);
    const node = screen.getByTestId('rule-detail-relative-time');
    expect(node.textContent).toContain('created');
    expect(node.querySelector('time')?.getAttribute('dateTime')).toBe(
      '2025-06-01T10:00:00.000Z',
    );
  });

  it('shows the modified prefix with updatedAt when distinct', () => {
    render(<RuleDetailPopoverWithTimestampsModified />);
    const node = screen.getByTestId('rule-detail-relative-time');
    expect(node.textContent).toContain('modified');
    expect(node.querySelector('time')?.getAttribute('dateTime')).toBe(
      '2025-06-15T14:30:00.000Z',
    );
  });

  it('omits the timestamp line when both timestamps are absent (backward compat)', () => {
    render(<RuleDetailPopoverEnabled />);
    expect(screen.queryByTestId('rule-detail-relative-time')).toBeNull();
  });
});
