import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { WorkspaceMeta } from '../../src/schemas/workspace';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { WorkspaceFormDialog } from '../../src/components/UI/Workspace/WorkspaceFormDialog';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const baseWorkspace: WorkspaceMeta = {
  id: 'ws-1',
  name: 'Personal',
  accentColor: 'indigo',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('WorkspaceFormDialog (create mode)', () => {
  it('renders the create title and create button label', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={[]}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId('workspace-form-dialog')).toBeInTheDocument();
    expect(screen.getByText('workspaceCreateTitle')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-form-btn-submit')).toHaveTextContent(
      'workspaceFormBtnCreate',
    );
  });

  it('disables the submit button while the name is empty', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={[]}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByTestId('workspace-form-btn-submit')).toBeDisabled();
  });

  it('shows the duplicate error when the name is already taken', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={['Personal']}
        onSubmit={() => {}}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-form-name'), {
      target: { value: 'personal' },
    });
    expect(screen.getByTestId('workspace-form-error-duplicate')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-form-btn-submit')).toBeDisabled();
  });

  it('calls onSubmit with trimmed name when valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={onOpenChange}
        takenNames={[]}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-form-name'), {
      target: { value: '  My WS  ' },
    });
    fireEvent.click(screen.getByTestId('workspace-form-btn-submit'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: 'My WS', accentColor: 'jade' }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('submits when Enter is pressed in the name field', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={[]}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByTestId('workspace-form-name');
    fireEvent.change(input, { target: { value: 'New WS' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: 'New WS', accentColor: 'jade' }),
    );
  });
});

describe('WorkspaceFormDialog (edit mode)', () => {
  it('pre-fills the form fields and shows the save button', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={['Personal']}
        initial={baseWorkspace}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText('workspaceEditTitle')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-form-name')).toHaveValue('Personal');
    expect(screen.getByTestId('workspace-form-btn-submit')).toHaveTextContent('save');
  });

  it('does not flag the original name as a duplicate of itself', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={['Personal', 'Other']}
        initial={baseWorkspace}
        onSubmit={() => {}}
      />,
    );
    expect(screen.queryByTestId('workspace-form-error-duplicate')).toBeNull();
    expect(screen.getByTestId('workspace-form-btn-submit')).not.toBeDisabled();
  });

  it('flags a clash with another existing workspace name', () => {
    wrap(
      <WorkspaceFormDialog
        open
        onOpenChange={() => {}}
        takenNames={['Personal', 'Other']}
        initial={baseWorkspace}
        onSubmit={() => {}}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-form-name'), {
      target: { value: 'other' },
    });
    expect(screen.getByTestId('workspace-form-error-duplicate')).toBeInTheDocument();
  });
});
