import { useState, useEffect, useCallback, useRef } from 'react';
import type { SyncSettings, DomainRuleSettings } from '../types/syncSettings.js';

export interface UseSyncedSettingsReturn {
  // État actuel
  settings: SyncSettings | null;
  isLoaded: boolean;

  // Setters pour chaque champ
  setGlobalGroupingEnabled: (value: boolean) => Promise<void>;
  setGlobalDeduplicationEnabled: (value: boolean) => Promise<void>;
  setDomainRules: (value: DomainRuleSettings) => Promise<void>;

  // Callbacks de changement pour chaque champ
  onGlobalGroupingEnabledChange: (callback: (value: boolean) => void) => () => void;
  onGlobalDeduplicationEnabledChange: (callback: (value: boolean) => void) => () => void;
  onDomainRulesChange: (callback: (value: DomainRuleSettings) => void) => () => void;

  // Utilitaires
  updateSettings: (updates: Partial<SyncSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

export function useSyncedSettings(): UseSyncedSettingsReturn {
  const [settings, setSettings] = useState<SyncSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [changeCallbacks, setChangeCallbacks] = useState<{
    [K in keyof SyncSettings]?: Set<(value: SyncSettings[K]) => void>;
  }>({});

  // Ref pour éviter de réagir aux changements qu'on a nous-même déclenchés
  const isLocalUpdate = useRef(false);
  // Ref pour les callbacks (évite les problèmes de closure)
  const changeCallbacksRef = useRef(changeCallbacks);
  changeCallbacksRef.current = changeCallbacks;

  // Chargement initial
  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await browser.storage.sync.get({
          globalGroupingEnabled: true,
          globalDeduplicationEnabled: true,
          domainRules: [] as DomainRuleSettings
        });

        setSettings(result as SyncSettings);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Listener pour les changements de storage (provenant d'autres sources)
  useEffect(() => {
    const storageListener = (changes: any, areaName: string) => {
      if (areaName !== 'sync') return;

      // Ignorer les changements qu'on a nous-même déclenchés
      if (isLocalUpdate.current) {
        return;
      }

      // Mettre à jour l'état en utilisant le callback pour avoir la valeur la plus récente
      setSettings(prevSettings => {
        if (!prevSettings) return prevSettings;

        let newSettings = { ...prevSettings };
        let hasChanges = false;

        Object.keys(changes).forEach((key) => {
          const field = key as keyof SyncSettings;
          if (field in newSettings) {
            const newValue = changes[key].newValue;
            (newSettings as any)[field] = newValue;
            hasChanges = true;

            // Déclencher les callbacks pour ce champ
            const callbacks = changeCallbacksRef.current[field];
            if (callbacks) {
              callbacks.forEach(callback => callback(newValue));
            }
          }
        });

        return hasChanges ? newSettings : prevSettings;
      });
    };

    browser.storage.onChanged.addListener(storageListener);
    return () => browser.storage.onChanged.removeListener(storageListener);
  }, []); // Pas de dépendances - le listener reste stable

  // Fonction générique pour mettre à jour un champ
  const updateField = useCallback(async <K extends keyof SyncSettings>(
    field: K,
    value: SyncSettings[K]
  ) => {
    // Marquer comme mise à jour locale pour ignorer l'événement storage
    isLocalUpdate.current = true;
    try {
      // Mettre à jour l'état local d'abord pour une UI réactive
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
      // Puis persister dans le storage
      await browser.storage.sync.set({ [field]: value });
    } finally {
      // Réactiver l'écoute des changements externes après un court délai
      setTimeout(() => {
        isLocalUpdate.current = false;
      }, 100);
    }
  }, []);

  // Fonction générique pour enregistrer un callback de changement
  const registerChangeCallback = useCallback(<K extends keyof SyncSettings>(
    field: K, 
    callback: (value: SyncSettings[K]) => void
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
  const updateSettings = useCallback(async (updates: Partial<SyncSettings>) => {
    // Marquer comme mise à jour locale pour ignorer l'événement storage
    isLocalUpdate.current = true;
    try {
      // Mettre à jour l'état local d'abord pour une UI réactive
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      // Puis persister dans le storage
      await browser.storage.sync.set(updates);
    } finally {
      // Réactiver l'écoute des changements externes après un court délai
      setTimeout(() => {
        isLocalUpdate.current = false;
      }, 100);
    }
  }, []);

  // Fonction pour recharger les settings
  const reloadSettings = useCallback(async () => {
    try {
      const result = await browser.storage.sync.get({
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
        domainRules: [] as DomainRuleSettings
      });
      
      setSettings(result as SyncSettings);
    } catch (error) {
      console.error('Error reloading settings:', error);
    }
  }, []);

  return {
    settings,
    isLoaded,
    
    // Setters
    setGlobalGroupingEnabled: (value: boolean) => updateField('globalGroupingEnabled', value),
    setGlobalDeduplicationEnabled: (value: boolean) => updateField('globalDeduplicationEnabled', value),
    setDomainRules: (value: DomainRuleSettings) => updateField('domainRules', value),
    
    // Change callbacks
    onGlobalGroupingEnabledChange: (callback) => registerChangeCallback('globalGroupingEnabled', callback),
    onGlobalDeduplicationEnabledChange: (callback) => registerChangeCallback('globalDeduplicationEnabled', callback),
    onDomainRulesChange: (callback) => registerChangeCallback('domainRules', callback),
    
    // Utilitaires
    updateSettings,
    reloadSettings
  };
}