import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ImportWizard.stories';

const { ImportWizardOpen, ImportWizardClosed } = composeStories(stories);

describe('ImportWizard (portable stories)', () => {
  it('renders the open dialog with source step controls', () => {
    render(<ImportWizardOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Source mode segmented control (Radix renders active + inactive labels)
    expect(screen.getAllByText('File').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Text').length).toBeGreaterThanOrEqual(1);
    // Footer buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    const nextBtn = screen.getByText('Next').closest('button');
    expect(nextBtn).toBeDisabled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ImportWizardClosed />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});
