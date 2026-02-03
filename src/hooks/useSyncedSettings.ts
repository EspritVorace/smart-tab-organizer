import { useState, useEffect, useCallback } from 'react';
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

  // Listener pour les changements de storage
  useEffect(() => {
    const storageListener = (changes: any, areaName: string) => {
      if (areaName === 'sync') {
        const newSettings = { ...settings };
        let hasChanges = false;

        Object.keys(changes).forEach((key) => {
          const field = key as keyof SyncSettings;
          if (field in newSettings) {
            const newValue = changes[key].newValue;
            const oldValue = newSettings[field];
            
            if (newValue !== oldValue) {
              (newSettings as any)[field] = newValue;
              hasChanges = true;
              
              // Déclencher les callbacks pour ce champ
              const callbacks = changeCallbacks[field];
              if (callbacks) {
                callbacks.forEach(callback => callback(newValue));
              }
            }
          }
        });

        if (hasChanges) {
          setSettings(newSettings);
        }
      }
    };

    browser.storage.onChanged.addListener(storageListener);
    return () => browser.storage.onChanged.removeListener(storageListener);
  }, [settings, changeCallbacks]);

  // Fonction générique pour mettre à jour un champ
  const updateField = useCallback(async <K extends keyof SyncSettings>(
    field: K, 
    value: SyncSettings[K]
  ) => {
    await browser.storage.sync.set({ [field]: value });
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
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
    await browser.storage.sync.set(updates);
    setSettings(prev => prev ? { ...prev, ...updates } : null);
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