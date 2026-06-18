import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Form/FormFields/SearchableInlineList.stories';

const { SearchableInlineListDefault, SearchableInlineListCustomRenderItem } =
  composeStories(stories);

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
