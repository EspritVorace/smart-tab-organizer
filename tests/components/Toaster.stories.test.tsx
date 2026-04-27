import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/Toaster/Toaster.stories';

const {
  ToasterSuccess,
  ToasterError,
  ToasterInfo,
  ToasterStacked,
} = composeStories(stories);

describe('Toaster (portable stories)', () => {
  it('renders a success toast with export message', async () => {
    render(<ToasterSuccess />);
    expect(await screen.findByText('Rules exported')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
  });

  it('renders an error toast for restore failures', async () => {
    render(<ToasterError />);
    expect(await screen.findByText('Restore failed')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });

  it('renders an info toast', async () => {
    render(<ToasterInfo />);
    expect(await screen.findByText('Snapshot saved')).toBeInTheDocument();
    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
  });

  it('stacks multiple toasts of different variants', async () => {
    render(<ToasterStacked />);
    expect(await screen.findByText('Rules imported')).toBeInTheDocument();
    expect(await screen.findByText('Session exported')).toBeInTheDocument();
    expect(await screen.findByText('Restore failed')).toBeInTheDocument();
    expect(screen.getAllByTestId('toast-success')).toHaveLength(2);
    expect(screen.getAllByTestId('toast-error')).toHaveLength(1);
  });
});
