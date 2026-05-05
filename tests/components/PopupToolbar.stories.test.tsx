import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { fakeBrowser } from 'wxt/testing';
import * as stories from '../../src/components/UI/PopupToolbar/PopupToolbar.stories';

const composed = composeStories(stories);
const {
  PopupToolbarDefault,
  PopupToolbarOrganizing,
  PopupToolbarNoSessions,
  PopupToolbarSaveDisabled,
  PopupToolbarNoRules,
  PopupToolbarSingleTab,
  PopupToolbarManyTabs,
} = composed;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PopupToolbar (stories)', () => {
  it('renders the default story with hero and meta buttons enabled', async () => {
    render(<PopupToolbarDefault />);
    await waitFor(() => {
      expect(screen.getByTestId('popup-toolbar')).toBeInTheDocument();
    });
    expect(screen.getByTestId('popup-toolbar-btn-organize')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('popup-toolbar-btn-save')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('popup-toolbar-btn-restore')).not.toHaveAttribute('aria-disabled');
  });

  it('marks the organize button aria-disabled while organizing', () => {
    render(<PopupToolbarOrganizing />);
    expect(screen.getByTestId('popup-toolbar-btn-organize')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('popup-toolbar-btn-organize')).not.toHaveAttribute('disabled');
  });

  it('marks the restore button aria-disabled when there are no sessions', () => {
    render(<PopupToolbarNoSessions />);
    expect(screen.getByTestId('popup-toolbar-btn-restore')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('popup-toolbar-btn-restore')).not.toHaveAttribute('disabled');
  });

  it('marks the save button aria-disabled when canSave is false', () => {
    render(<PopupToolbarSaveDisabled />);
    expect(screen.getByTestId('popup-toolbar-btn-save')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('popup-toolbar-btn-save')).not.toHaveAttribute('disabled');
  });

  it('renders without crashing when there are no active rules', () => {
    render(<PopupToolbarNoRules />);
    expect(screen.getByTestId('popup-toolbar')).toBeInTheDocument();
  });

  it('renders the single-tab variant', () => {
    render(<PopupToolbarSingleTab />);
    expect(screen.getByTestId('popup-toolbar')).toBeInTheDocument();
  });

  it('renders the many-tabs variant', () => {
    render(<PopupToolbarManyTabs />);
    expect(screen.getByTestId('popup-toolbar')).toBeInTheDocument();
  });

  it('clicking organize sends an ORGANIZE_ALL_TABS message', async () => {
    const sendMessage = vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(undefined as never);
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
    render(<PopupToolbarDefault />);

    fireEvent.click(screen.getByTestId('popup-toolbar-btn-organize'));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({ type: 'ORGANIZE_ALL_TABS' });
    });
    closeSpy.mockRestore();
  });
});

describe('PopupToolbar (no props)', () => {
  it('queries browser data when props are not provided', async () => {
    const tabsQuery = vi
      .spyOn(fakeBrowser.tabs, 'query')
      .mockResolvedValue([{ id: 1, groupId: -1 } as never]);

    // Import the component directly (not via the story) so it falls into the
    // default-prop branch that triggers loadSessions/hasCapturableTabs/tabs.query.
    const { PopupToolbar } = await import(
      '../../src/components/UI/PopupToolbar/PopupToolbar'
    );
    const { Theme } = await import('@radix-ui/themes');
    const { render: localRender } = await import('@testing-library/react');

    localRender(
      <Theme>
        <PopupToolbar />
      </Theme>,
    );

    await waitFor(() => {
      expect(tabsQuery).toHaveBeenCalled();
    });
  });
});
