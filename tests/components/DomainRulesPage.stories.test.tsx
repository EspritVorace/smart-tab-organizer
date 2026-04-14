import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/pages/DomainRulesPage.stories';

const { DomainRulesPageDefault, DomainRulesPageEmpty } = composeStories(stories);

describe('DomainRulesPage (portable stories)', () => {
  it('renders the page with toolbar and rules list', () => {
    render(<DomainRulesPageDefault />);

    expect(screen.getByTestId('page-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    expect(screen.getByTestId('page-rules-list')).toBeInTheDocument();
  });

  it('shows empty state when no rules and hides the toolbar', () => {
    render(<DomainRulesPageEmpty />);
    expect(screen.getByTestId('page-rules-empty')).toBeInTheDocument();
    // Add button is present in the empty placeholder (same testid as the toolbar button, mutually exclusive).
    expect(screen.getByTestId('page-rules-btn-add')).toBeInTheDocument();
    // Toolbar is hidden when there are no rules (search is useless, add is already in the placeholder).
    expect(screen.queryByTestId('page-rules-toolbar')).not.toBeInTheDocument();
  });
});
