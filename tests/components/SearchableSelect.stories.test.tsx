import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Form/FormFields/SearchableSelect.stories';

const {
  SearchableSelectDefault,
  SearchableSelectDisabled,
  SearchableSelectInteraction,
  SearchableSelectEmptyResults,
} = composeStories(stories);

describe('SearchableSelect — static renders', () => {
  it('renders the trigger button with placeholder', () => {
    render(<SearchableSelectDefault />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders as disabled when disabled prop is set', () => {
    render(<SearchableSelectDisabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

describe('SearchableSelect — interactions', () => {
  it('opens, filters, selects, and shows the chosen label in the trigger', async () => {
    await SearchableSelectInteraction.run();

    expect(screen.getByRole('combobox')).toHaveTextContent('GitHub Repository');
  });

  it('shows the empty message when no options match the search', async () => {
    await SearchableSelectEmptyResults.run();

    expect(screen.getByText('No preset found.')).toBeInTheDocument();
  });
});
