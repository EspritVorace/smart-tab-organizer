import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Form/FormFields/SearchableSelect.stories';

const {
  SearchableSelectDefault,
  SearchableSelectDisabled,
  SearchableSelectOpen,
  SearchableSelectFiltered,
  SearchableSelectChosen,
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
  it('opens the dropdown and shows the search input', async () => {
    await SearchableSelectOpen.run();

    expect(screen.getByPlaceholderText('Search a preset...')).toBeInTheDocument();
  });

  it('filters options by search term', async () => {
    await SearchableSelectFiltered.run();

    expect(screen.getByText('Jira Ticket')).toBeInTheDocument();
  });

  it('selects an option and shows it in the trigger', async () => {
    await SearchableSelectChosen.run();

    expect(screen.getByRole('combobox')).toHaveTextContent('GitHub Repository');
  });

  it('shows the empty message when no options match the search', async () => {
    await SearchableSelectEmptyResults.run();

    expect(screen.getByText('No preset found.')).toBeInTheDocument();
  });
});
