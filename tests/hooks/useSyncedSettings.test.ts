import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useSyncedSettings } from '../../src/hooks/useSyncedSettings';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('useSyncedSettings', () => {
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
    expect(result.current.settings?.deduplicateUnmatchedDomains).toBe(false);
    expect(result.current.settings?.deduplicationKeepStrategy).toBe('keep-grouped-or-new');
    expect(result.current.settings?.domainRules).toEqual([]);
  });

  it('devrait mettre à jour deduplicateUnmatchedDomains', async () => {
    const { result } = renderHook(() => useSyncedSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setDeduplicateUnmatchedDomains(true);
    });

    expect(result.current.settings?.deduplicateUnmatchedDomains).toBe(true);
  });

  it('devrait charger les paramètres existants', async () => {
    await fakeBrowser.storage.sync.set({
      globalGroupingEnabled: false,
      globalDeduplicationEnabled: true,
      domainRules: [{ id: '1', label: 'Test Rule' }]
    });

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

    // Modifier directement le storage
    await act(async () => {
      await fakeBrowser.storage.sync.set({
        globalGroupingEnabled: false,
        globalDeduplicationEnabled: false,
        domainRules: [{ id: 'new', label: 'New Rule' }]
      });
    });

    await act(async () => {
      await result.current.reloadSettings();
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.domainRules).toHaveLength(1);
  });
});
