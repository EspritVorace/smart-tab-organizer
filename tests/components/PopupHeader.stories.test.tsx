import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/PopupHeader/PopupHeader.stories';

const { PopupHeaderDefault, PopupHeaderShort, PopupHeaderLong } = composeStories(stories);

describe('PopupHeader', () => {
  it('renders the default header with title and settings button', () => {
    render(<PopupHeaderDefault />);
    expect(screen.getByTestId('popup-header')).toBeInTheDocument();
    expect(screen.getByText('Smart Tab Organizer')).toBeInTheDocument();
    expect(screen.getByTestId('popup-header-btn-settings')).toBeInTheDocument();
  });

  it('renders a short title', () => {
    render(<PopupHeaderShort />);
    expect(screen.getByText('Tabs')).toBeInTheDocument();
  });

  it('renders a long title', () => {
    render(<PopupHeaderLong />);
    expect(screen.getByText('Smart Tab Organizer Extension')).toBeInTheDocument();
  });
});
