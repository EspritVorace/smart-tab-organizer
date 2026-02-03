import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock storage data
let mockStorageData: Record<string, any> = {};

// Mock browser API
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      sync: {
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
import { useSyncedSettings } from '../../src/hooks/useSyncedSettings';

describe('useSyncedSettings', () => {
  beforeEach(() => {
    mockStorageData = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait charger les paramètres par défaut', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(true);
    expect(result.current.settings?.globalDeduplicationEnabled).toBe(true);
    expect(result.current.settings?.domainRules).toEqual([]);
  });

  it('devrait charger les paramètres existants', async () => {
    mockStorageData = {
      globalGroupingEnabled: false,
      globalDeduplicationEnabled: true,
      domainRules: [{ id: '1', label: 'Test Rule' }]
    };

    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.domainRules).toHaveLength(1);
  });

  it('devrait mettre à jour globalGroupingEnabled', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setGlobalGroupingEnabled(false);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
  });

  it('devrait mettre à jour globalDeduplicationEnabled', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setGlobalDeduplicationEnabled(false);
    });

    expect(result.current.settings?.globalDeduplicationEnabled).toBe(false);
  });

  it('devrait mettre à jour les domainRules', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newRules = [
      { id: '1', domainFilter: 'example.com', label: 'Example' },
      { id: '2', domainFilter: 'test.com', label: 'Test' }
    ];

    await act(async () => {
      await result.current.setDomainRules(newRules as any);
    });

    expect(result.current.settings?.domainRules).toHaveLength(2);
  });

  it('devrait mettre à jour plusieurs paramètres', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.updateSettings({
        globalGroupingEnabled: false,
        globalDeduplicationEnabled: false
      });
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.globalDeduplicationEnabled).toBe(false);
  });
});
