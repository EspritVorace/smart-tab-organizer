import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { WorkspaceMeta } from '../../src/schemas/workspace';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
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

import {
  WorkspaceFooter,
  WorkspaceFooterCollapsed,
} from '../../src/components/UI/Workspace/WorkspaceFooter';
import { PopupWorkspaceSwitcher } from '../../src/components/UI/Workspace/PopupWorkspaceSwitcher';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

beforeEach(() => {
  ctx.active = null;
  ctx.accentColor = 'indigo';
  ctx.workspaces = [];
  ctx.isLoaded = true;
});

const makeWorkspace = (overrides: Partial<WorkspaceMeta> = {}): WorkspaceMeta => ({
  id: 'ws-default',
  name: 'Default',
  accentColor: 'indigo',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('WorkspaceFooter', () => {
  it('renders the trigger inside the footer', () => {
    wrap(<WorkspaceFooter onManage={vi.fn()} />);
    expect(screen.getByTestId('workspace-footer')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-footer-trigger')).toBeInTheDocument();
  });

  it('shows the active workspace name when one is set', () => {
    ctx.active = {
      id: 'ws-1',
      name: 'My Project',
      accentColor: 'jade',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    wrap(<WorkspaceFooter />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('falls back to the default workspace label when no active workspace is set', () => {
    ctx.active = null;
    wrap(<WorkspaceFooter />);
    expect(screen.getByText('workspaceDefaultName')).toBeInTheDocument();
  });
});

describe('WorkspaceFooterCollapsed', () => {
  it('renders the collapsed trigger', () => {
    wrap(<WorkspaceFooterCollapsed />);
    expect(screen.getByTestId('workspace-footer-trigger-collapsed')).toBeInTheDocument();
  });

  it('uses the active workspace name when set', () => {
    ctx.active = {
      id: 'ws-2',
      name: 'Personal',
      accentColor: 'tomato',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    wrap(<WorkspaceFooterCollapsed />);
    const trigger = screen.getByTestId('workspace-footer-trigger-collapsed');
    expect(trigger.getAttribute('title')).toBe('Personal');
  });
});

describe('PopupWorkspaceSwitcher', () => {
  beforeEach(() => {
    ctx.workspaces = [
      makeWorkspace({ id: 'default', name: 'Default' }),
      makeWorkspace({ id: 'ws-2', name: 'Side project', accentColor: 'jade' }),
    ];
  });

  it('renders the popup-specific switcher with trigger', () => {
    wrap(<PopupWorkspaceSwitcher />);
    expect(screen.getByTestId('popup-workspace-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('popup-workspace-trigger')).toBeInTheDocument();
  });

  it('shows the active workspace name', () => {
    ctx.active = {
      id: 'ws-x',
      name: 'Important',
      accentColor: 'crimson',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    wrap(<PopupWorkspaceSwitcher />);
    expect(screen.getByText('Important')).toBeInTheDocument();
  });

  it('renders nothing when only the default workspace exists', () => {
    ctx.workspaces = [makeWorkspace({ id: 'default', name: 'Default' })];
    wrap(<PopupWorkspaceSwitcher />);
    expect(screen.queryByTestId('popup-workspace-switcher')).toBeNull();
    expect(screen.queryByTestId('popup-workspace-trigger')).toBeNull();
  });

  it('renders nothing when the workspace list is empty (pre-migration)', () => {
    ctx.workspaces = [];
    wrap(<PopupWorkspaceSwitcher />);
    expect(screen.queryByTestId('popup-workspace-switcher')).toBeNull();
  });

  it('renders nothing while the workspace list is loading', () => {
    ctx.isLoaded = false;
    ctx.workspaces = [];
    wrap(<PopupWorkspaceSwitcher />);
    expect(screen.queryByTestId('popup-workspace-switcher')).toBeNull();
  });
});
