import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Form/FormFields/SearchableInlineList.stories';

const {
  SearchableInlineListDefault,
  SearchableInlineListCustomRenderItem,
  SearchableInlineListEnterSelectsFirst,
  SearchableInlineListEnterSelectsFirstFiltered,
} = composeStories(stories);

describe('SearchableInlineList — render paths', () => {
  it('default path renders SearchableSelectItem rows and filters on search', async () => {
    await SearchableInlineListDefault.run();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('custom renderItem path renders rich rows', async () => {
    await SearchableInlineListCustomRenderItem.run();
    expect(screen.getByLabelText('Apple (custom)')).toBeInTheDocument();
  });
});

describe('SearchableInlineList — Enter selects the first result', () => {
  it('selects the first item from the empty query', async () => {
    await SearchableInlineListEnterSelectsFirst.run();
    expect(screen.getByText('Apple').closest('[cmdk-item=""]')).toHaveClass(
      'ss-item--selected',
    );
  });

  it('selects the first filtered item after typing', async () => {
    await SearchableInlineListEnterSelectsFirstFiltered.run();
    expect(
      document.querySelector('[cmdk-item=""].ss-item--selected'),
    ).toBeInTheDocument();
  });
});
