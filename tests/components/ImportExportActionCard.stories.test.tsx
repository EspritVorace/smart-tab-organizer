import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { Download } from 'lucide-react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/ImportExportActionCard.stories';
import { ImportExportActionCard } from '../../src/components/UI/ImportExportWizards/ImportExportActionCard';

const { ImportExportActionCardExport, ImportExportActionCardDisabled } = composeStories(stories);

describe('ImportExportActionCard (portable stories)', () => {
  it('renders title, description and button', () => {
    render(<ImportExportActionCardExport />);
    expect(screen.getByTestId('action-card-export')).toBeInTheDocument();
    expect(screen.getByText('Export Rules')).toBeInTheDocument();
    expect(screen.getByText('Export your domain rules to a JSON file.')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('button is disabled when disabled=true', () => {
    render(<ImportExportActionCardDisabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('ImportExportActionCard - branches', () => {
  it('appelle onClick quand le bouton est cliqué', () => {
    const onClick = vi.fn();
    render(
      <Theme>
        <ImportExportActionCard
          testId="card"
          icon={Download}
          title="Export"
          description="Desc"
          buttonLabel="Export"
          onClick={onClick}
        />
      </Theme>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
