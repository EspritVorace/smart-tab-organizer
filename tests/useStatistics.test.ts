import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing';
import { useStatistics } from '../src/hooks/useStatistics.js';
import type { Statistics } from '../src/types/statistics.js';
import { defaultStatistics } from '../src/types/statistics.js';

describe('useStatistics', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  const mockStatistics: Statistics = {
    tabGroupsCreatedCount: 5,
    tabsDeduplicatedCount: 10
  };

  it('devrait charger les statistiques par défaut au démarrage', async () => {
    // Configurer le storage avec les valeurs par défaut
    await browser.storage.local.set({ statistics: defaultStatistics });

    const { result } = renderHook(() => useStatistics());

    // Initialement non chargé
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.statistics).toBe(null);

    // Attendre le chargement
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
  });

  it('devrait charger les statistiques existantes', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.statistics).toEqual(mockStatistics);
  });

  it('devrait mettre à jour tabGroupsCreatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setTabGroupsCreatedCount(15);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(15);
    
    // Vérifier que la valeur est sauvegardée dans le storage
    const storageData = await browser.storage.local.get('statistics');
    expect(storageData.statistics.tabGroupsCreatedCount).toBe(15);
  });

  it('devrait mettre à jour tabsDeduplicatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.setTabsDeduplicatedCount(25);
    });

    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(25);
    
    const storageData = await browser.storage.local.get('statistics');
    expect(storageData.statistics.tabsDeduplicatedCount).toBe(25);
  });

  it('devrait incrémenter tabGroupsCreatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const initialCount = result.current.statistics?.tabGroupsCreatedCount || 0;

    await act(async () => {
      await result.current.incrementTabGroupsCreated();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(initialCount + 1);
  });

  it('devrait incrémenter tabsDeduplicatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const initialCount = result.current.statistics?.tabsDeduplicatedCount || 0;

    await act(async () => {
      await result.current.incrementTabsDeduplicated();
    });

    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(initialCount + 1);
  });

  it('devrait mettre à jour plusieurs statistiques en une fois', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const updates = {
      tabGroupsCreatedCount: 100,
      tabsDeduplicatedCount: 200
    };

    await act(async () => {
      await result.current.updateStatistics(updates);
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(100);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(200);
    
    const storageData = await browser.storage.local.get('statistics');
    expect(storageData.statistics.tabGroupsCreatedCount).toBe(100);
    expect(storageData.statistics.tabsDeduplicatedCount).toBe(200);
  });

  it('devrait reset les statistiques', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await act(async () => {
      await result.current.resetStatistics();
    });

    expect(result.current.statistics).toEqual(defaultStatistics);
    
    const storageData = await browser.storage.local.get('statistics');
    expect(storageData.statistics).toEqual(defaultStatistics);
  });

  it('devrait recharger les statistiques', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Modifier directement le storage
    await act(async () => {
      await browser.storage.local.set({ 
        statistics: { tabGroupsCreatedCount: 999, tabsDeduplicatedCount: 888 } 
      });
    });

    await act(async () => {
      await result.current.reloadStatistics();
    });

    expect(result.current.statistics?.tabGroupsCreatedCount).toBe(999);
    expect(result.current.statistics?.tabsDeduplicatedCount).toBe(888);
  });

  it('devrait déclencher les callbacks de changement pour tabGroupsCreatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.onTabGroupsCreatedCountChange(mockCallback);
    });

    // Simuler un changement externe du storage
    await act(async () => {
      await browser.storage.local.set({ 
        statistics: { ...mockStatistics, tabGroupsCreatedCount: 50 } 
      });
      // Attendre un tick pour que les listeners soient appelés
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Attendre que le callback soit appelé
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(50);
    });

    // Nettoyer
    if (unsubscribe) {
      act(() => {
        unsubscribe!();
      });
    }
  });

  it('devrait déclencher les callbacks de changement pour tabsDeduplicatedCount', async () => {
    await browser.storage.local.set({ statistics: mockStatistics });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.onTabsDeduplicatedCountChange(mockCallback);
    });

    // Simuler un changement externe du storage
    await act(async () => {
      await browser.storage.local.set({ 
        statistics: { ...mockStatistics, tabsDeduplicatedCount: 75 } 
      });
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(75);
    });

    if (unsubscribe) {
      act(() => {
        unsubscribe!();
      });
    }
  });

  it('devrait gérer les erreurs de chargement', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Simuler une erreur en corrompant le storage
    vi.spyOn(browser.storage.local, 'get').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useStatistics());

    // Attendre un peu pour que l'erreur soit gérée
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.statistics).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith('Error loading statistics:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('devrait merger avec les valeurs par défaut en cas de données partielles', async () => {
    // Simuler des données incomplètes dans le storage
    await browser.storage.local.set({ 
      statistics: { tabGroupsCreatedCount: 42 } // manque tabsDeduplicatedCount
    });
    
    const { result } = renderHook(() => useStatistics());
    
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    // Devrait avoir mergé avec les valeurs par défaut
    expect(result.current.statistics).toEqual({
      tabGroupsCreatedCount: 42,
      tabsDeduplicatedCount: 0 // valeur par défaut
    });
  });
});