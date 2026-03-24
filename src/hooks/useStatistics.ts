import { useState, useEffect, useCallback, useRef } from 'react';
import type { Statistics } from '../types/statistics.js';
import { defaultStatistics } from '../types/statistics.js';
import { logger } from '../utils/logger';
import { statisticsItem } from '../utils/storageItems.js';

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

function mergeWithDefaults(value: Statistics | null): Statistics {
  return { ...defaultStatistics, ...value };
}

export function useStatistics(): UseStatisticsReturn {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [changeCallbacks, setChangeCallbacks] = useState<{
    [K in keyof Statistics]?: Set<(value: Statistics[K]) => void>;
  }>({});

  // Ref pour éviter de réagir aux changements qu'on a nous-même déclenchés
  const isLocalUpdate = useRef(false);
  const changeCallbacksRef = useRef(changeCallbacks);
  changeCallbacksRef.current = changeCallbacks;

  // Chargement initial
  useEffect(() => {
    statisticsItem.getValue()
      .then(value => {
        setStatistics(mergeWithDefaults(value));
        setIsLoaded(true);
      })
      .catch(error => logger.error('Error loading statistics:', error));
  }, []);

  // Watcher pour les changements de storage
  useEffect(() => {
    return statisticsItem.watch((newValue) => {
      if (isLocalUpdate.current) return;

      const newStatistics = mergeWithDefaults(newValue);
      setStatistics(prev => {
        // Déclencher les callbacks pour les champs modifiés
        if (prev) {
          (Object.keys(newStatistics) as (keyof Statistics)[]).forEach(field => {
            if (newStatistics[field] !== prev[field]) {
              const callbacks = changeCallbacksRef.current[field];
              if (callbacks) callbacks.forEach(cb => cb(newStatistics[field]));
            }
          });
        }
        return newStatistics;
      });
    });
  }, []); // Pas de dépendances - le watcher reste stable

  // Fonction générique pour mettre à jour un champ
  const updateField = useCallback(async <K extends keyof Statistics>(
    field: K,
    value: Statistics[K]
  ) => {
    if (!statistics) return;
    isLocalUpdate.current = true;
    try {
      const updatedStatistics = { ...statistics, [field]: value };
      await statisticsItem.setValue(updatedStatistics);
      setStatistics(updatedStatistics);
    } finally {
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
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
    return () => {
      setChangeCallbacks(prev => {
        const newCallbacks = { ...prev };
        if (newCallbacks[field]) {
          newCallbacks[field]!.delete(callback);
          if (newCallbacks[field]!.size === 0) delete newCallbacks[field];
        }
        return newCallbacks;
      });
    };
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateStatistics = useCallback(async (updates: Partial<Statistics>) => {
    if (!statistics) return;
    isLocalUpdate.current = true;
    try {
      const updatedStatistics = { ...statistics, ...updates };
      await statisticsItem.setValue(updatedStatistics);
      setStatistics(updatedStatistics);
    } finally {
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
  }, [statistics]);

  // Fonction pour reset les statistiques
  const resetStatistics = useCallback(async () => {
    isLocalUpdate.current = true;
    try {
      await statisticsItem.setValue(defaultStatistics);
      setStatistics(defaultStatistics);
    } finally {
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
  }, []);

  // Fonction pour incrémenter les groupes créés
  const incrementTabGroupsCreated = useCallback(async () => {
    if (!statistics) return;
    await updateField('tabGroupsCreatedCount', statistics.tabGroupsCreatedCount + 1);
  }, [statistics, updateField]);

  // Fonction pour incrémenter les onglets dédupliqués
  const incrementTabsDeduplicated = useCallback(async () => {
    if (!statistics) return;
    await updateField('tabsDeduplicatedCount', statistics.tabsDeduplicatedCount + 1);
  }, [statistics, updateField]);

  // Fonction pour recharger les statistiques
  const reloadStatistics = useCallback(async () => {
    try {
      const value = await statisticsItem.getValue();
      setStatistics(mergeWithDefaults(value));
    } catch (error) {
      logger.error('Error reloading statistics:', error);
    }
  }, []);

  return {
    statistics,
    isLoaded,

    // Setters
    setTabGroupsCreatedCount: (value) => updateField('tabGroupsCreatedCount', value),
    setTabsDeduplicatedCount: (value) => updateField('tabsDeduplicatedCount', value),

    // Change callbacks
    onTabGroupsCreatedCountChange: (cb) => registerChangeCallback('tabGroupsCreatedCount', cb),
    onTabsDeduplicatedCountChange: (cb) => registerChangeCallback('tabsDeduplicatedCount', cb),

    // Utilitaires
    updateStatistics,
    resetStatistics,
    incrementTabGroupsCreated,
    incrementTabsDeduplicated,
    reloadStatistics
  };
}
