import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useSyncedSettings } from '../src/hooks/useSyncedSettings.js';
import type { SyncSettings } from '../src/types/syncSettings.js';

describe('useSyncedSettings', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  const mockDefaultSettings: SyncSettings = {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    darkModePreference: 'system',
    regexPresets: [],
    domainRules: []
  };

  it('devrait charger les paramètres par défaut au démarrage', async () => {
    // Configurer le storage avec les valeurs par défaut
    await browser.storage.sync.set(mockDefaultSettings);

    const { result } = renderHook(() => useSyncedSettings());

    // Initialement non chargé
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.settings).toBe(null);

    // Attendre le chargement
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.settings).toEqual(mockDefaultSettings);
  });

  it('devrait mettre à jour globalGroupingEnabled', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setGlobalGroupingEnabled(false);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    
    // Vérifier que la valeur est sauvegardée dans le storage
    const storageData = await browser.storage.sync.get('globalGroupingEnabled');
    expect(storageData.globalGroupingEnabled).toBe(false);
  });

  it('devrait mettre à jour darkModePreference', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setDarkModePreference('dark');
    });

    expect(result.current.settings?.darkModePreference).toBe('dark');
    
    const storageData = await browser.storage.sync.get('darkModePreference');
    expect(storageData.darkModePreference).toBe('dark');
  });

  it('devrait mettre à jour regexPresets', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newPresets = [
      { id: 'preset-1', name: 'Test Preset', regex: '(\\d+)', urlRegex: '' }
    ];

    await act(async () => {
      await result.current.setRegexPresets(newPresets);
    });

    expect(result.current.settings?.regexPresets).toEqual(newPresets);
    
    const storageData = await browser.storage.sync.get('regexPresets');
    expect(storageData.regexPresets).toEqual(newPresets);
  });


  it('devrait mettre à jour domainRules', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newRules = [
      {
        id: 'rule-1',
        enabled: true,
        domainFilter: 'example.com',
        label: 'Test Rule',
        titleParsingRegEx: '(\\d+)',
        urlParsingRegEx: '',
        groupNameSource: 'title' as const,
        deduplicationMatchMode: 'exact' as const,
        groupId: null,
        collapseNew: false,
        collapseExisting: false,
        deduplicationEnabled: true
      }
    ];

    await act(async () => {
      await result.current.setDomainRules(newRules);
    });

    expect(result.current.settings?.domainRules).toEqual(newRules);
    
    const storageData = await browser.storage.sync.get('domainRules');
    expect(storageData.domainRules).toEqual(newRules);
  });

  it('devrait mettre à jour plusieurs paramètres en une fois', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const updates = {
      globalGroupingEnabled: false,
      darkModePreference: 'light' as const
    };

    await act(async () => {
      await result.current.updateSettings(updates);
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
    expect(result.current.settings?.darkModePreference).toBe('light');
    
    const storageData = await browser.storage.sync.get(['globalGroupingEnabled', 'darkModePreference']);
    expect(storageData.globalGroupingEnabled).toBe(false);
    expect(storageData.darkModePreference).toBe('light');
  });

  it('devrait recharger les paramètres', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Modifier directement le storage
    await act(async () => {
      await browser.storage.sync.set({ globalGroupingEnabled: false });
    });

    await act(async () => {
      await result.current.reloadSettings();
    });

    expect(result.current.settings?.globalGroupingEnabled).toBe(false);
  });

  it('devrait déclencher les callbacks de changement', async () => {
    await browser.storage.sync.set(mockDefaultSettings);
    
    const { result } = renderHook(() => useSyncedSettings());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.onGlobalGroupingEnabledChange(mockCallback);
    });

    // Simuler un changement externe du storage avec act
    await act(async () => {
      await browser.storage.sync.set({ globalGroupingEnabled: false });
      // Attendre un tick pour que les listeners soient appelés
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Attendre que le callback soit appelé
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(false);
    });

    // Nettoyer
    if (unsubscribe) {
      act(() => {
        unsubscribe!();
      });
    }
  });

  it('devrait gérer les erreurs de chargement', async () => {
    // Mock d'une erreur de storage
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Simuler une erreur en corrompant le storage
    vi.spyOn(browser.storage.sync, 'get').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useSyncedSettings());

    // Attendre un peu pour que l'erreur soit gérée
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.settings).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith('Error loading settings:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});