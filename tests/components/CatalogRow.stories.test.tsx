import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/Core/Exploration/CatalogRow.stories';

const composed = composeStories(stories);
const {
  CatalogRowDiscoveredAuto,
  CatalogRowDiscoveredManual,
  CatalogRowToDiscover,
  CatalogRowNotPossible,
} = composed;

describe('CatalogRow (stories)', () => {
  it('renders an automatically discovered capability', () => {
    render(<CatalogRowDiscoveredAuto />);
    expect(screen.getByText('Create a rule')).toBeInTheDocument();
  });

  it('renders a manually marked capability', () => {
    render(<CatalogRowDiscoveredManual />);
    expect(screen.getByText('Create a rule')).toBeInTheDocument();
  });

  it('renders a still-to-discover capability', () => {
    render(<CatalogRowToDiscover />);
    expect(screen.getByText('Create a rule')).toBeInTheDocument();
  });

  it('renders a not-yet-possible capability (unmet prerequisites)', () => {
    render(<CatalogRowNotPossible />);
    expect(screen.getByText('Edit a rule')).toBeInTheDocument();
  });
});
