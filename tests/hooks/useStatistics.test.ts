import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useStatistics } from '../../src/hooks/useStatistics';
import type { Statistics } from '../../src/types/statistics';
import { defaultStatistics } from '../../src/types/statistics';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('useStatistics', () => {
  afterEach(() => {
    cleanup();
  });

  it('devrait charger les statistiques par défaut', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('devrait charger les statistiques existantes', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(5);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(10);
  });

  it('devrait mettre à jour le compteur de groupes créés', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setTabGroupsCreatedCount(15);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(15);
  });

  it('devrait mettre à jour le compteur d\'onglets dédupliqués', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setTabsDeduplicatedCount(20);
    });

    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(20);
  });

  it('devrait incrémenter le compteur de groupes', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 0 }
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.incrementTabGroupsCreated();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(6);
  });

  it('devrait incrémenter le compteur de déduplication', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 3 }
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.incrementTabsDeduplicated();
    });

    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(4);
  });

  it('devrait mettre à jour plusieurs champs', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updateStatistics({
        tabGroupsCreatedCount: 100,
        tabsDeduplicatedCount: 200
      });
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(100);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(200);
  });

  it('devrait réinitialiser les statistiques', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 50, tabsDeduplicatedCount: 100 }
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.resetStatistics();
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('devrait recharger les statistiques', async () => {
    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Modifier directement le storage mock
    await act(async () => {
      await fakeBrowser.storage.local.set({
        statistics: { tabGroupsCreatedCount: 999, tabsDeduplicatedCount: 888 }
      });
    });

    await act(async () => {
      await result.current.reloadStatistics();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(999);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(888);
  });

  it('devrait declencher les callbacks de changement pour tabGroupsCreatedCount', async () => {
    const mockStatistics: Statistics = { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 };
    await fakeBrowser.storage.local.set({ statistics: mockStatistics });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.onTabGroupsCreatedCountChange(mockCallback);
    });

    await act(async () => {
      await fakeBrowser.storage.local.set({
        statistics: { ...mockStatistics, tabGroupsCreatedCount: 50 }
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(50);
    });

    if (unsubscribe) {
      act(() => { unsubscribe!(); });
    }
  });

  it('devrait declencher les callbacks de changement pour tabsDeduplicatedCount', async () => {
    const mockStatistics: Statistics = { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 };
    await fakeBrowser.storage.local.set({ statistics: mockStatistics });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.onTabsDeduplicatedCountChange(mockCallback);
    });

    await act(async () => {
      await fakeBrowser.storage.local.set({
        statistics: { ...mockStatistics, tabsDeduplicatedCount: 75 }
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(75);
    });

    if (unsubscribe) {
      act(() => { unsubscribe!(); });
    }
  });

  it('devrait gerer les erreurs de chargement', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useStatistics());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.statistics).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith('[smart-tab-organizer]', '[useSyncedState] load error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('devrait merger avec les valeurs par defaut en cas de donnees partielles', async () => {
    await fakeBrowser.storage.local.set({
      statistics: { tabGroupsCreatedCount: 42 }
    });

    const { result } = renderHook(() => useStatistics());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual({
      tabGroupsCreatedCount: 42,
      tabsDeduplicatedCount: 0
    });
  });
});
