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
} = composeStories(stories);

describe('DomainRuleCard (portable stories)', () => {
  beforeEach(() => {
    mockGetRuleCategory.mockReturnValue(null);
  });

  it('rend la carte par défaut avec le label et le domaine', () => {
    render(<DomainRuleCardDefault />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
    expect(screen.getByTestId('rule-card-rule-1-btn-dropdown')).toBeInTheDocument();
  });

  it('rend la carte désactivée (rule.enabled = false => opacité 0.6)', () => {
    render(<DomainRuleCardDisabled />);
    const card = screen.getByTestId('rule-card-rule-1');
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle({ opacity: '0.6' });
  });

  it('rend la carte avec drag désactivé (isDragDisabled = true)', () => {
    render(<DomainRuleCardDragDisabled />);
    const handle = screen.getByTestId('rule-card-rule-1-drag-handle');
    expect(handle).toHaveAttribute('aria-disabled', 'true');
  });

  it('rend la carte avec actions domaine désactivées', () => {
    render(<DomainRuleCardDomainActionsDisabled />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
  });

  it('rend la carte avec mise en évidence de la recherche', () => {
    render(<DomainRuleCardWithSearch />);
    expect(screen.getByTestId('rule-card-rule-1')).toBeInTheDocument();
  });

  it('rend le badge avec la couleur et l\'emoji de la catégorie quand category != null', () => {
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
