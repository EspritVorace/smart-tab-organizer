import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useSettings } from '../../src/hooks/useSettings';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('useSettings', () => {
  afterEach(() => {
    cleanup();
  });

  it('devrait charger les paramètres par défaut', async () => {
    const { result } = renderHook(() => useSettings());

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
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setDeduplicateUnmatchedDomains(true);
    });

    expect(result.current.settings?.deduplicateUnmatchedDomains).toBe(true);
  });

  it('devrait charger les paramètres existants', async () => {
    await fakeBrowser.storage.local.set({
      globalGroupingEnabled: false,
      globalDeduplicationEnabled: true,
      domainRules: [{ id: '1', label: 'Test Rule' }]
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.domainRules).toHaveLength(1);
  });

  it('devrait mettre à jour globalGroupingEnabled', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setGlobalGroupingEnabled(false);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
  });

  it('devrait mettre à jour globalDeduplicationEnabled', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setGlobalDeduplicationEnabled(false);
    });

    expect(result.current.settings?.globalDeduplicationEnabled).toBe(false);
  });

  it('devrait mettre à jour les domainRules', async () => {
    const { result } = renderHook(() => useSettings());

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
    const { result } = renderHook(() => useSettings());

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
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await fakeBrowser.storage.local.set({
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

  it('devrait mettre à jour deduplicationKeepStrategy', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.setDeduplicationKeepStrategy('keep-old');
    });

    expect(result.current.settings?.deduplicationKeepStrategy).toBe('keep-old');
  });

  it('devrait mettre à jour les categories', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const newCategories = [
      { id: 'work', emoji: '💼', color: 'blue', label: 'Work', builtIn: false },
    ] as never;

    await act(async () => {
      await result.current.setCategories(newCategories);
    });

    expect(result.current.settings?.categories).toEqual(newCategories);
  });

  it('migre les wildcards legacy `*.example.com` -> `example.com`', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        { id: 'r1', domainFilter: '*.example.com', label: 'Ex' },
        { id: 'r2', domainFilter: 'plain.com', label: 'Plain' },
      ],
    });

    const { result } = renderHook(() => useSettings());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.settings?.domainRules?.[0].domainFilter).toBe('example.com');
    expect(result.current.settings?.domainRules?.[1].domainFilter).toBe('plain.com');

    // The migration should also have written back the cleaned value.
    const stored = await fakeBrowser.storage.local.get('domainRules');
    const filters = (stored.domainRules as Array<{ domainFilter: string }>).map(r => r.domainFilter);
    expect(filters).toEqual(['example.com', 'plain.com']);
  });

  describe('listeners onFieldChange', () => {
    it('exposent toutes une fonction de désinscription', async () => {
      const { result } = renderHook(() => useSettings());
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      const cb = vi.fn();
      const unwatchers = [
        result.current.onGlobalGroupingEnabledChange(cb),
        result.current.onGlobalDeduplicationEnabledChange(cb),
        result.current.onDeduplicateUnmatchedDomainsChange(cb),
        result.current.onDeduplicationKeepStrategyChange(cb),
        result.current.onDomainRulesChange(cb),
        result.current.onCategoriesChange(cb),
      ];
      for (const u of unwatchers) {
        expect(typeof u).toBe('function');
        expect(() => u()).not.toThrow();
      }
    });

    it('déclenche le callback enregistré sur un changement externe', async () => {
      const { result } = renderHook(() => useSettings());
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      const cb = vi.fn();
      let unwatch: () => void;
      await act(async () => {
        unwatch = result.current.onGlobalGroupingEnabledChange(cb);
      });

      await act(async () => {
        await fakeBrowser.storage.local.set({ globalGroupingEnabled: false });
      });

      await waitFor(() => expect(cb).toHaveBeenCalledWith(false));
      unwatch!();
    });
  });
});
