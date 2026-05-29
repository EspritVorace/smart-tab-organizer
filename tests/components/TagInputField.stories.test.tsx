import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Form/FormFields/TagInputField.stories';

const {
  TagInputFieldDefault,
  TagInputFieldWithValues,
  TagInputFieldAddTag,
  TagInputFieldRemoveTag,
  TagInputFieldRejectInvalid,
} = composeStories(stories);

describe('TagInputField — static renders', () => {
  it('renders the input with no tags by default', () => {
    render(<TagInputFieldDefault />);
    expect(screen.getByLabelText('Ignored query parameters')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders pre-populated tags', () => {
    render(<TagInputFieldWithValues />);
    expect(screen.getByText('utm_*')).toBeInTheDocument();
    expect(screen.getByText('fbclid')).toBeInTheDocument();
    expect(screen.getByText('gclid')).toBeInTheDocument();
  });
});

describe('TagInputField — interactions', () => {
  it('adds a tag on Enter and on comma separator', async () => {
    await TagInputFieldAddTag.run();

    expect(screen.getByText('utm_source')).toBeInTheDocument();
    expect(screen.getByText('fbclid')).toBeInTheDocument();
  });

  it('removes a tag when clicking the remove button', async () => {
    await TagInputFieldRemoveTag.run();

    expect(screen.queryByText('fbclid')).not.toBeInTheDocument();
    expect(screen.getByText('utm_*')).toBeInTheDocument();
    expect(screen.getByText('gclid')).toBeInTheDocument();
  });

  it('does not add an invalid tag when validateTag is set', async () => {
    await TagInputFieldRejectInvalid.run();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
