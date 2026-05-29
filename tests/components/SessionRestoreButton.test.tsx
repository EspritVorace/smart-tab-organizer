import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { Session } from '../../src/types/session';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      sessionRestore: 'Restore',
      sessionRefresh: 'Refresh',
      sessionRestoreCurrentWindow: 'Restore in current window',
      sessionRestoreNewWindow: 'Restore in new window',
      sessionRestoreReplaceCurrentWindow: 'Replace tabs in current window',
      sessionRestoreCustomize: 'Customized restoration',
      sessionRestoreOptions: 'Restore options',
      defaultRestoreActionLabel: 'Default action',
    };
    return messages[key] || key;
  }),
}));

import { SessionRestoreButton } from '../../src/components/Core/Session/SessionRestoreButton/SessionRestoreButton';

const session: Session = {
  id: 's-1',
  name: 'Sample',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [],
  ungroupedTabs: [],
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Theme>{children}</Theme>
);

// Radix DropdownMenu does not open with fireEvent.click under happy-dom; the
// menu item behavior (3 options, customize callback, etc.) is covered by the
// Playwright E2E specs in tests/e2e/sessions.spec.ts and tests/e2e/popup.spec.ts.
describe('SessionRestoreButton', () => {
  let onRestoreCurrentWindow: ReturnType<typeof vi.fn>;
  let onRestoreNewWindow: ReturnType<typeof vi.fn>;
  let onReplaceCurrentWindow: ReturnType<typeof vi.fn>;
  let onCustomize: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRestoreCurrentWindow = vi.fn();
    onRestoreNewWindow = vi.fn();
    onReplaceCurrentWindow = vi.fn();
    onCustomize = vi.fn();
  });

  it('primary click calls onRestoreCurrentWindow with the session', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          data-testid="restore-btn"
        />
      </TestWrapper>,
    );

    const primary = screen.getByRole('button', { name: /Restore in current window/i });
    fireEvent.click(primary);

    expect(onRestoreCurrentWindow).toHaveBeenCalledWith(session);
    expect(onRestoreNewWindow).not.toHaveBeenCalled();
    expect(onCustomize).not.toHaveBeenCalled();
  });

  it('renders the dropdown trigger with the expected aria-label', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
        />
      </TestWrapper>,
    );

    expect(screen.getByRole('button', { name: /Restore options/i })).toBeInTheDocument();
  });

  it('does not render a Refresh button when onRefresh is omitted', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
        />
      </TestWrapper>,
    );

    expect(screen.queryByRole('button', { name: /Refresh/i })).not.toBeInTheDocument();
  });

  it('renders a Refresh button when onRefresh is provided and calls it on click', () => {
    const onRefresh = vi.fn();
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          onRefresh={onRefresh}
          data-testid="restore-btn"
        />
      </TestWrapper>,
    );

    const refreshBtn = screen.getByTestId('restore-btn-refresh');
    fireEvent.click(refreshBtn);

    expect(onRefresh).toHaveBeenCalledWith(session);
    expect(onRestoreCurrentWindow).not.toHaveBeenCalled();
  });

  it('tile presentation renders the textual "Restore" label on the primary button', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          presentation="tile"
          data-testid="restore-btn"
        />
      </TestWrapper>,
    );

    const primary = screen.getByTestId('restore-btn');
    expect(primary).toHaveTextContent('Restore');
    fireEvent.click(primary);
    expect(onRestoreCurrentWindow).toHaveBeenCalledWith(session);
  });

  it('primary click routes to onRestoreNewWindow when defaultRestoreAction is "new"', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          defaultRestoreAction="new"
          data-testid="restore-btn"
        />
      </TestWrapper>,
    );

    const primary = screen.getByRole('button', { name: /Restore in new window/i });
    fireEvent.click(primary);

    expect(onRestoreNewWindow).toHaveBeenCalledWith(session);
    expect(onRestoreCurrentWindow).not.toHaveBeenCalled();
  });

  it('primary click routes to onReplaceCurrentWindow when defaultRestoreAction is "replace"', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          defaultRestoreAction="replace"
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Replace tabs in current window/i }));

    expect(onReplaceCurrentWindow).toHaveBeenCalledWith(session);
    expect(onRestoreCurrentWindow).not.toHaveBeenCalled();
  });

  it('primary click routes to onCustomize when defaultRestoreAction is "customize"', () => {
    render(
      <TestWrapper>
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onCustomize}
          defaultRestoreAction="customize"
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Customized restoration/i }));

    expect(onCustomize).toHaveBeenCalledWith(session);
    expect(onRestoreCurrentWindow).not.toHaveBeenCalled();
  });
});
