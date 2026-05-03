import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Pack/PackGallery/PackCard/PackCard.stories';

const composed = composeStories(stories);
const {
  PackCardSimple,
  PackCardSimpleSelected,
  PackCardConfigurable,
  PackCardConfigurableNoMatch,
} = composed;

describe('PackCard (stories)', () => {
  it('renders the simple pack with name, description and rule count badge', () => {
    render(<PackCardSimple />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('GitHub & GitLab grouping')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
  });

  it('toggles selection when the checkbox is clicked', () => {
    render(<PackCardSimple />);
    const checkbox = screen.getByTestId('pack-card-pk-github-checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(checkbox);
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('renders the configurable pack with the configurable badge and a Select trigger', () => {
    render(<PackCardConfigurable />);
    expect(screen.getByText('Cloud Console')).toBeInTheDocument();
    expect(screen.getByTestId('pack-card-pk-cloud-param-provider')).toBeInTheDocument();
  });

  it('renders an already-selected card variant', () => {
    render(<PackCardSimpleSelected />);
    const checkbox = screen.getByTestId('pack-card-pk-github-checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });

  it('renders a configurable pack with no matching rules', () => {
    render(<PackCardConfigurableNoMatch />);
    expect(screen.getByText('Cloud Console')).toBeInTheDocument();
  });
});
