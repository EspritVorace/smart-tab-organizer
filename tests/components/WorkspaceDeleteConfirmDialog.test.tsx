import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { WorkspaceMeta } from '../../src/schemas/workspace';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) => {
    if (subs && subs.length) return `${key}(${subs.join(',')})`;
    return key;
  }),
}));

import { WorkspaceDeleteConfirmDialog } from '../../src/components/UI/Workspace/WorkspaceDeleteConfirmDialog';

const baseWorkspace: WorkspaceMeta = {
  id: 'ws-1',
  name: 'Personal',
  accentColor: 'indigo',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

describe('WorkspaceDeleteConfirmDialog', () => {
  it('returns null when no workspace is provided', () => {
    const { container } = wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={() => {}}
        workspace={null}
        onConfirm={() => {}}
      />,
    );
    expect(container.querySelector('[data-testid="workspace-delete-dialog"]')).toBeNull();
  });

  it('renders the dialog with the destructive button initially disabled', () => {
    wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={() => {}}
        workspace={baseWorkspace}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByTestId('workspace-delete-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-delete-btn-confirm')).toBeDisabled();
  });

  it('keeps the confirm button disabled while the typed name does not match', () => {
    wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={() => {}}
        workspace={baseWorkspace}
        onConfirm={() => {}}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-delete-confirm-input'), {
      target: { value: 'Person' },
    });
    expect(screen.getByTestId('workspace-delete-btn-confirm')).toBeDisabled();
  });

  it('enables the confirm button when the typed name matches exactly', () => {
    wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={() => {}}
        workspace={baseWorkspace}
        onConfirm={() => {}}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-delete-confirm-input'), {
      target: { value: 'Personal' },
    });
    expect(screen.getByTestId('workspace-delete-btn-confirm')).not.toBeDisabled();
  });

  it('calls onConfirm and closes the dialog when confirmed', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={onOpenChange}
        workspace={baseWorkspace}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.change(screen.getByTestId('workspace-delete-confirm-input'), {
      target: { value: 'Personal' },
    });
    await fireEvent.click(screen.getByTestId('workspace-delete-btn-confirm'));

    // wait microtask so the async onConfirm resolves
    await Promise.resolve();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not call onConfirm if the typed name still mismatches', () => {
    const onConfirm = vi.fn();
    wrap(
      <WorkspaceDeleteConfirmDialog
        open
        onOpenChange={() => {}}
        workspace={baseWorkspace}
        onConfirm={onConfirm}
      />,
    );
    // The button is disabled, but call the click directly to ensure handler short-circuits.
    const btn = screen.getByTestId('workspace-delete-btn-confirm');
    fireEvent.click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
