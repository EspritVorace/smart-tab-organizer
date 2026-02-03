import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock storage data
let mockStorageData: Record<string, any> = {};

// Mock browser API
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn(async (defaults) => {
          return { ...defaults, ...mockStorageData };
        }),
        set: vi.fn(async (data) => {
          Object.entries(data).forEach(([key, value]) => {
            mockStorageData[key] = value;
          });
        })
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  }
}));

// Import after mocking
import { useStatistics } from '../../src/hooks/useStatistics';
import { defaultStatistics } from '../../src/types/statistics';

describe('useStatistics', () => {
  beforeEach(() => {
    mockStorageData = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
