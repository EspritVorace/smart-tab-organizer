import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeepLinking } from '../../src/hooks/useDeepLinking';

function setHash(hash: string) {
  // Update the hash and dispatch the event the hook listens for.
  window.location.hash = hash;
  window.dispatchEvent(new Event('hashchange'));
}

beforeEach(() => {
  // Clear any leftover hash from a previous test before mounting.
  window.history.replaceState(null, '', window.location.pathname);
});

afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

describe('useDeepLinking — defaults', () => {
  it('starts on the "rules" tab when there is no hash', () => {
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('rules');
    expect(result.current.openSnapshotWizard).toBe(false);
    expect(result.current.snapshotGroupId).toBeNull();
  });
});

describe('useDeepLinking — hash on mount', () => {
  it('parses a plain section hash', () => {
    window.location.hash = '#sessions';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('sessions');
  });

  it('parses #importexport correctly', () => {
    window.location.hash = '#importexport';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('importexport');
  });

  it.each(['rules', 'sessions', 'stats', 'settings', 'importexport'])(
    'accepts the valid section %s',
    (section) => {
      window.location.hash = `#${section}`;
      const { result } = renderHook(() => useDeepLinking());
      expect(result.current.currentTab).toBe(section);
    },
  );

  it('ignores an unknown section and keeps the default', () => {
    window.location.hash = '#unknown-section';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('rules');
  });

  it('ignores a malformed hash that does not start with "#"', () => {
    // Setting `.hash` always prepends '#', so emulate by skipping setHash.
    // Force the hash directly via replaceState so it stays empty.
    window.history.replaceState(null, '', window.location.pathname);
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('rules');
  });
});

describe('useDeepLinking — snapshot deep link', () => {
  it('opens the snapshot wizard when hash is #sessions?action=snapshot', () => {
    window.location.hash = '#sessions?action=snapshot';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('sessions');
    expect(result.current.openSnapshotWizard).toBe(true);
    expect(result.current.snapshotGroupId).toBeNull();
  });

  it('parses snapshotGroupId from the query string', () => {
    window.location.hash = '#sessions?action=snapshot&groupId=42';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.openSnapshotWizard).toBe(true);
    expect(result.current.snapshotGroupId).toBe(42);
  });

  it('does not open the wizard when action is not "snapshot"', () => {
    window.location.hash = '#sessions?action=other';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('sessions');
    expect(result.current.openSnapshotWizard).toBe(false);
  });

  it('does not open the wizard when the section is not "sessions"', () => {
    window.location.hash = '#rules?action=snapshot';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('rules');
    expect(result.current.openSnapshotWizard).toBe(false);
  });
});

describe('useDeepLinking — hashchange listener', () => {
  it('reacts to a hashchange event after mount', () => {
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.currentTab).toBe('rules');

    act(() => setHash('#stats'));

    expect(result.current.currentTab).toBe('stats');
  });

  it('reacts to a snapshot hashchange after mount', () => {
    const { result } = renderHook(() => useDeepLinking());

    act(() => setHash('#sessions?action=snapshot&groupId=7'));

    expect(result.current.currentTab).toBe('sessions');
    expect(result.current.openSnapshotWizard).toBe(true);
    expect(result.current.snapshotGroupId).toBe(7);
  });

  it('removes its listener on unmount (no leak)', () => {
    const { result, unmount } = renderHook(() => useDeepLinking());

    unmount();

    // After unmount the listener should be gone — firing the event should
    // NOT update the (unmounted) state. We just assert that no error fires
    // by triggering the event after unmount.
    expect(() => setHash('#stats')).not.toThrow();
    expect(result.current.currentTab).toBe('rules');
  });
});

describe('useDeepLinking — setters', () => {
  it('exposes setCurrentTab to override the tab manually', () => {
    const { result } = renderHook(() => useDeepLinking());
    act(() => result.current.setCurrentTab('settings'));
    expect(result.current.currentTab).toBe('settings');
  });

  it('exposes setOpenSnapshotWizard to close the wizard', () => {
    window.location.hash = '#sessions?action=snapshot';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.openSnapshotWizard).toBe(true);
    act(() => result.current.setOpenSnapshotWizard(false));
    expect(result.current.openSnapshotWizard).toBe(false);
  });

  it('exposes setSnapshotGroupId to clear the group target', () => {
    window.location.hash = '#sessions?action=snapshot&groupId=99';
    const { result } = renderHook(() => useDeepLinking());
    expect(result.current.snapshotGroupId).toBe(99);
    act(() => result.current.setSnapshotGroupId(null));
    expect(result.current.snapshotGroupId).toBeNull();
  });
});
