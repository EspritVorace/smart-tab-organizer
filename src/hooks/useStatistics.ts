import { useState, useEffect, useCallback } from 'react';
import { browser } from 'wxt/browser';
import type { Statistics } from '../types/statistics.js';
import { defaultStatistics } from '../types/statistics.js';

export interface UseStatisticsReturn {
  // État actuel
  statistics: Statistics | null;
  isLoaded: boolean;
  
  // Setters pour chaque champ
  setTabGroupsCreatedCount: (value: number) => Promise<void>;
  setTabsDeduplicatedCount: (value: number) => Promise<void>;
  
  // Callbacks de changement pour chaque champ
  onTabGroupsCreatedCountChange: (callback: (value: number) => void) => () => void;
  onTabsDeduplicatedCountChange: (callback: (value: number) => void) => () => void;
  
  // Utilitaires
  updateStatistics: (updates: Partial<Statistics>) => Promise<void>;
  resetStatistics: () => Promise<void>;
  incrementTabGroupsCreated: () => Promise<void>;
  incrementTabsDeduplicated: () => Promise<void>;
  reloadStatistics: () => Promise<void>;
}

export function useStatistics(): UseStatisticsReturn {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [changeCallbacks, setChangeCallbacks] = useState<{
    [K in keyof Statistics]?: Set<(value: Statistics[K]) => void>;
  }>({});

  // Chargement initial
  useEffect(() => {
    async function loadStatistics() {
      try {
        const result = await browser.storage.local.get({
          statistics: defaultStatistics
        });
        
        // Assurer que les statistiques ont la bonne structure
        const stats = {
          ...defaultStatistics,
          ...(result.statistics as Record<string, unknown>)
        };
        
        setStatistics(stats);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    }
    loadStatistics();
  }, []);

  // Listener pour les changements de storage
  useEffect(() => {
    const storageListener = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.statistics) {
        const newStatistics = { 
          ...defaultStatistics, 
          ...changes.statistics.newValue 
        } as Statistics;
        const oldStatistics = statistics;
        setStatistics(newStatistics);
        
        // Déclencher les callbacks pour les champs modifiés
        if (oldStatistics) {
          Object.keys(newStatistics).forEach((key) => {
            const field = key as keyof Statistics;
            if (newStatistics[field] !== oldStatistics[field]) {
              const callbacks = changeCallbacks[field];
              if (callbacks) {
                callbacks.forEach(callback => callback(newStatistics[field]));
              }
            }
          });
        }
      }
    };

    browser.storage.onChanged.addListener(storageListener);
    return () => browser.storage.onChanged.removeListener(storageListener);
  }, [statistics, changeCallbacks]);

  // Fonction générique pour mettre à jour un champ
  const updateField = useCallback(async <K extends keyof Statistics>(
    field: K, 
    value: Statistics[K]
  ) => {
    if (!statistics) return;
    
    const updatedStatistics = { ...statistics, [field]: value };
    await browser.storage.local.set({ statistics: updatedStatistics });
    setStatistics(updatedStatistics);
  }, [statistics]);

  // Fonction générique pour enregistrer un callback de changement
  const registerChangeCallback = useCallback(<K extends keyof Statistics>(
    field: K, 
    callback: (value: Statistics[K]) => void
  ) => {
    setChangeCallbacks(prev => ({
      ...prev,
      [field]: new Set([...(prev[field] || []), callback])
    }));

    // Retourner une fonction de nettoyage
    return () => {
      setChangeCallbacks(prev => {
        const newCallbacks = { ...prev };
        if (newCallbacks[field]) {
          newCallbacks[field]!.delete(callback);
          if (newCallbacks[field]!.size === 0) {
            delete newCallbacks[field];
          }
        }
        return newCallbacks;
      });
    };
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateStatistics = useCallback(async (updates: Partial<Statistics>) => {
    if (!statistics) return;
    
    const updatedStatistics = { ...statistics, ...updates };
    await browser.storage.local.set({ statistics: updatedStatistics });
    setStatistics(updatedStatistics);
  }, [statistics]);

  // Fonction pour reset les statistiques
  const resetStatistics = useCallback(async () => {
    await browser.storage.local.set({ statistics: defaultStatistics });
    setStatistics(defaultStatistics);
  }, []);

  // Fonction pour incrémenter les groupes créés
  const incrementTabGroupsCreated = useCallback(async () => {
    if (!statistics) return;
    
    const newCount = statistics.tabGroupsCreatedCount + 1;
    await updateField('tabGroupsCreatedCount', newCount);
  }, [statistics, updateField]);

  // Fonction pour incrémenter les onglets dédupliqués
  const incrementTabsDeduplicated = useCallback(async () => {
    if (!statistics) return;
    
    const newCount = statistics.tabsDeduplicatedCount + 1;
    await updateField('tabsDeduplicatedCount', newCount);
  }, [statistics, updateField]);

  // Fonction pour recharger les statistiques
  const reloadStatistics = useCallback(async () => {
    try {
      const result = await browser.storage.local.get({
        statistics: defaultStatistics
      });
      
      const stats = {
        ...defaultStatistics,
        ...(result.statistics as Record<string, unknown>)
      };

      setStatistics(stats);
    } catch (error) {
      console.error('Error reloading statistics:', error);
    }
  }, []);

  return {
    statistics,
    isLoaded,
    
    // Setters
    setTabGroupsCreatedCount: (value: number) => updateField('tabGroupsCreatedCount', value),
    setTabsDeduplicatedCount: (value: number) => updateField('tabsDeduplicatedCount', value),
    
    // Change callbacks
    onTabGroupsCreatedCountChange: (callback) => registerChangeCallback('tabGroupsCreatedCount', callback),
    onTabsDeduplicatedCountChange: (callback) => registerChangeCallback('tabsDeduplicatedCount', callback),
    
    // Utilitaires
    updateStatistics,
    resetStatistics,
    incrementTabGroupsCreated,
    incrementTabsDeduplicated,
    reloadStatistics
  };
}