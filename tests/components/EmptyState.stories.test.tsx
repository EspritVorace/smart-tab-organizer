import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/EmptyState/EmptyState.stories';

const {
  EmptyStateDefault,
  EmptyStateWithActions,
  EmptyStateCompact,
  EmptyStateSessions,
  EmptyStateSessionsCompact,
} = composeStories(stories);

describe('EmptyState (portable stories)', () => {
  it('renders title and description in default variant', () => {
    render(<EmptyStateDefault />);
    expect(screen.getByText('No domain rules yet')).toBeInTheDocument();
    expect(screen.getByText(/create a rule/i)).toBeInTheDocument();
  });

  it('renders action buttons when provided', () => {
    render(<EmptyStateWithActions />);
    expect(screen.getByRole('button', { name: /add rule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('renders compact variant with message only', () => {
    render(<EmptyStateCompact />);
    expect(screen.getByText('No rules found')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders sessions empty state with two action buttons', () => {
    render(<EmptyStateSessions />);
    expect(screen.getByText('No saved sessions.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('renders sessions compact variant with message only', () => {
    render(<EmptyStateSessionsCompact />);
    expect(screen.getByText('No sessions found')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
