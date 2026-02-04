import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useStatistics } from '../../src/hooks/useStatistics';
import { defaultStatistics } from '../../src/types/statistics';

// Mock storage data
let mockStorageData: Record<string, any> = {};
const storageListeners: Array<(changes: Record<string, any>, areaName: string) => void> = [];

// Create mock browser object
const mockBrowser = {
  storage: {
    local: {
      get: vi.fn(async (defaults) => {
        if (typeof defaults === 'object' && defaults !== null) {
          const result: Record<string, any> = {};
          for (const key of Object.keys(defaults)) {
            result[key] = mockStorageData[key] !== undefined ? mockStorageData[key] : defaults[key];
          }
          return result;
        }
        return mockStorageData;
      }),
      set: vi.fn(async (data) => {
        const changes: Record<string, any> = {};
        for (const key of Object.keys(data)) {
          changes[key] = { oldValue: mockStorageData[key], newValue: data[key] };
        }
        Object.assign(mockStorageData, data);
        // Notify listeners
        storageListeners.forEach(listener => listener(changes, 'local'));
      }),
      remove: vi.fn(async (keys) => {
        if (typeof keys === 'string') {
          delete mockStorageData[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach(key => delete mockStorageData[key]);
        }
      })
    },
    onChanged: {
      addListener: vi.fn((callback) => {
        storageListeners.push(callback);
      }),
      removeListener: vi.fn((callback) => {
        const index = storageListeners.indexOf(callback);
        if (index > -1) {
          storageListeners.splice(index, 1);
        }
      })
    }
  }
};

// Set global browser
(globalThis as any).browser = mockBrowser;

describe('useStatistics', () => {
  beforeEach(() => {
    mockStorageData = {};
    storageListeners.length = 0;
    vi.clearAllMocks();
  });

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
    mockStorageData = {
      statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 10 }
    };

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
    mockStorageData = {
      statistics: { tabGroupsCreatedCount: 5, tabsDeduplicatedCount: 0 }
    };

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
    mockStorageData = {
      statistics: { tabGroupsCreatedCount: 0, tabsDeduplicatedCount: 3 }
    };

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
    mockStorageData = {
      statistics: { tabGroupsCreatedCount: 50, tabsDeduplicatedCount: 100 }
    };

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
    mockStorageData = {
      statistics: { tabGroupsCreatedCount: 999, tabsDeduplicatedCount: 888 }
    };

    await act(async () => {
      await result.current.reloadStatistics();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(999);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(888);
  });
});
