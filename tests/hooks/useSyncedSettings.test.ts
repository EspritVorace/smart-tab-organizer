import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useSyncedSettings } from '../../src/hooks/useSyncedSettings';

// Mock storage data
let mockStorageData: Record<string, any> = {};
const storageListeners: Array<(changes: Record<string, any>, areaName: string) => void> = [];

// Create mock browser object
const mockBrowser = {
  storage: {
    sync: {
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
        storageListeners.forEach(listener => listener(changes, 'sync'));
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

// Mock wxt/browser module to use the global mock
vi.mock('wxt/browser', () => ({
  get browser() { return (globalThis as any).browser; }
}));

describe('useSyncedSettings', () => {
  beforeEach(() => {
    mockStorageData = {};
    storageListeners.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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

  it('devrait recharger les paramètres', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Modifier directement le storage mock
    mockStorageData = {
      globalGroupingEnabled: false,
      globalDeduplicationEnabled: false,
      domainRules: [{ id: 'new', label: 'New Rule' }]
    };

    await act(async () => {
      await result.current.reloadSettings();
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.domainRules).toHaveLength(1);
  });
});
