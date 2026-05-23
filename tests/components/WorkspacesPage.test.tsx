import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { WorkspaceMeta } from '../../src/schemas/workspace';
import type { AppSettings } from '../../src/types/syncSettings';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
  getPluralMessage: vi.fn((count: number, oneKey: string, manyKey: string) =>
    count === 1 ? oneKey : manyKey,
  ),
}));

vi.mock('../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const ctx = {
  workspaces: [] as WorkspaceMeta[],
  activeId: 'default',
  active: null as WorkspaceMeta | null,
  accentColor: 'indigo' as const,
  scopedItems: {} as never,
  isLoaded: true,
  switchTo: vi.fn().mockResolvedValue(undefined),
  createWorkspace: vi.fn().mockResolvedValue(undefined),
  renameWorkspace: vi.fn().mockResolvedValue(undefined),
  setWorkspaceColor: vi.fn().mockResolvedValue(undefined),
  removeWorkspace: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../src/contexts/ActiveWorkspaceContext', () => ({
  useActiveWorkspaceContext: () => ctx,
}));

vi.mock('../../src/components/UI/PageLayout/PageLayout', () => ({
  PageLayout: ({ children }: { children: () => React.ReactNode }) => (
    <div data-testid="page-layout">{children()}</div>
  ),
}));

import { WorkspacesPage } from '../../src/pages/WorkspacesPage';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const baseSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: false,
  deduplicationKeepStrategy: 'keep-grouped-or-new',
  categories: [],
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
  domainRules: [],
};

const mkWs = (id: string, name: string, accentColor: WorkspaceMeta['accentColor'] = 'indigo'): WorkspaceMeta => ({
  id,
  name,
  accentColor,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

beforeEach(() => {
  ctx.switchTo.mockClear();
  ctx.createWorkspace.mockClear();
  ctx.renameWorkspace.mockClear();
  ctx.setWorkspaceColor.mockClear();
  ctx.removeWorkspace.mockClear();
});

describe('WorkspacesPage', () => {
  it('renders the create button and a row per workspace', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work', 'jade')];
    ctx.activeId = 'default';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    expect(screen.getByTestId('workspace-create-button')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-row-default')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-row-ws-2')).toBeInTheDocument();
  });

  it('marks the active workspace and shows the default badge', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work', 'jade')];
    ctx.activeId = 'ws-2';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    expect(screen.getByTestId('workspace-row-ws-2-active')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-row-default-default')).toBeInTheDocument();
  });

  it('switch button is hidden on the active row', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work')];
    ctx.activeId = 'ws-2';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    expect(screen.queryByTestId('workspace-row-ws-2-switch')).toBeNull();
    expect(screen.getByTestId('workspace-row-default-switch')).toBeInTheDocument();
  });

  it('disables delete on the default workspace and on the only workspace', () => {
    ctx.workspaces = [mkWs('default', 'Personal')];
    ctx.activeId = 'default';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);
    // default + only -> deleteBlocked
    expect(screen.getByTestId('workspace-row-default-delete')).toBeDisabled();
  });

  it('clicking switch invokes context.switchTo with the workspace id', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work')];
    ctx.activeId = 'default';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    fireEvent.click(screen.getByTestId('workspace-row-ws-2-switch'));
    expect(ctx.switchTo).toHaveBeenCalledWith('ws-2');
  });

  it('clicking create opens the create dialog and submits a new workspace', async () => {
    ctx.workspaces = [mkWs('default', 'Personal')];
    ctx.activeId = 'default';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    fireEvent.click(screen.getByTestId('workspace-create-button'));
    fireEvent.change(screen.getByTestId('workspace-form-name'), {
      target: { value: 'New WS' },
    });
    fireEvent.click(screen.getByTestId('workspace-form-btn-submit'));

    await waitFor(() =>
      expect(ctx.createWorkspace).toHaveBeenCalledWith('New WS', 'jade'),
    );
  });

  it('clicking edit opens the edit dialog with the workspace pre-filled', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work', 'jade')];
    ctx.activeId = 'ws-2';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    fireEvent.click(screen.getByTestId('workspace-row-ws-2-edit'));
    expect(screen.getByTestId('workspace-form-name')).toHaveValue('Work');
  });

  it('clicking delete opens the destructive confirm dialog', () => {
    ctx.workspaces = [mkWs('default', 'Personal'), mkWs('ws-2', 'Work')];
    ctx.activeId = 'default';
    wrap(<WorkspacesPage syncSettings={baseSettings} />);

    fireEvent.click(screen.getByTestId('workspace-row-ws-2-delete'));
    expect(screen.getByTestId('workspace-delete-dialog')).toBeInTheDocument();
  });

  describe('relative time line', () => {
    it('renders a <time> element with the createdAt when timestamps are equal', () => {
      const ws: WorkspaceMeta = {
        id: 'ws-rt',
        name: 'Fresh',
        accentColor: 'indigo',
        createdAt: '2025-06-01T10:00:00.000Z',
        updatedAt: '2025-06-01T10:00:00.000Z',
      };
      ctx.workspaces = [ws];
      ctx.activeId = 'ws-rt';
      wrap(<WorkspacesPage syncSettings={baseSettings} />);

      const node = screen.getByTestId('workspace-row-ws-rt-relative-time');
      expect(node).toBeInTheDocument();
      expect(node.textContent).toContain('workspaceCreatedPrefix');
      const time = node.querySelector('time');
      expect(time).not.toBeNull();
      expect(time?.getAttribute('dateTime')).toBe('2025-06-01T10:00:00.000Z');
    });

    it('switches to the modified prefix and uses updatedAt when distinct', () => {
      const ws: WorkspaceMeta = {
        id: 'ws-mod',
        name: 'Edited',
        accentColor: 'indigo',
        createdAt: '2025-06-01T10:00:00.000Z',
        updatedAt: '2025-06-15T14:30:00.000Z',
      };
      ctx.workspaces = [ws];
      ctx.activeId = 'ws-mod';
      wrap(<WorkspacesPage syncSettings={baseSettings} />);

      const node = screen.getByTestId('workspace-row-ws-mod-relative-time');
      expect(node.textContent).toContain('workspaceModifiedPrefix');
      expect(node.querySelector('time')?.getAttribute('dateTime')).toBe(
        '2025-06-15T14:30:00.000Z',
      );
    });
  });
});
