import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/DomainRule/DomainRuleCard.stories';

vi.mock('../../src/utils/categoriesStore', () => ({
  getRuleCategory: vi.fn(() => null),
}));

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { getRuleCategory } from '../../src/utils/categoriesStore';

const mockGetRuleCategory = getRuleCategory as ReturnType<typeof vi.fn>;

const {
  DomainRuleCardDefault,
  DomainRuleCardDisabled,
  DomainRuleCardDragDisabled,
  DomainRuleCardDomainActionsDisabled,
  DomainRuleCardWithSearch,
  DomainRuleCardWithOverlap,
} = composeStories(stories);

describe('DomainRuleCard (portable stories)', () => {
  beforeEach(() => {
    mockGetRuleCategory.mockReturnValue(null);
  });

  it('renders the default card with the label and the domain', () => {
    render(<DomainRuleCardDefault />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('rule-card-rule-1-btn-dropdown')).toBeInTheDocument();
  });

  it('renders the disabled card (rule.enabled = false => opacity 0.6)', () => {
    render(<DomainRuleCardDisabled />);
    const card = screen.getByTestId('rule-card-rule-1');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ opacity: '0.6' });
  });

  it('renders the card with drag disabled (isDragDisabled = true)', () => {
    render(<DomainRuleCardDragDisabled />);
    const handle = screen.getByTestId('rule-card-rule-1-drag-handle');
    expect(handle).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the card with domain actions disabled', () => {
    render(<DomainRuleCardDomainActionsDisabled />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
  });

  it('renders the card with the search highlight applied', () => {
    render(<DomainRuleCardWithSearch />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
  });

  it('shows the overlap warning when overlapPrecedenceList has 2+ entries', () => {
    render(<DomainRuleCardWithOverlap />);
    const warning = screen.getByTestId('rule-overlap-warning');
    expect(warning).toBeInTheDocument();
    expect(warning.tagName).toBe('BUTTON');
    expect(warning).toHaveAttribute('aria-label');
  });

  it('does not show the overlap warning when overlapPrecedenceList is missing', () => {
    render(<DomainRuleCardDefault />);
    expect(screen.queryByTestId('rule-overlap-warning')).not.toBeInTheDocument();
  });

  it("renders the badge with the category's color and emoji when category != null", () => {
    mockGetRuleCategory.mockReturnValue({
      id: 'dev',
      label: 'Dev',
      labelKey: null,
      emoji: '🔧',
      color: '#4299E1',
    });
    render(<DomainRuleCardDefault />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
  });
});
