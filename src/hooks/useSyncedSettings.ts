import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from 'wxt/utils/storage';
import type { SyncSettings, DomainRuleSettings } from '../types/syncSettings.js';
import { logger } from '../utils/logger';
import {
  globalGroupingEnabledItem,
  globalDeduplicationEnabledItem,
  domainRulesItem,
  notifyOnGroupingItem,
  notifyOnDeduplicationItem,
} from '../utils/storageItems.js';

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

async function loadSyncSettingsFromStorage(): Promise<SyncSettings> {
  const results = await storage.getItems([
    globalGroupingEnabledItem,
    globalDeduplicationEnabledItem,
    domainRulesItem,
    notifyOnGroupingItem,
    notifyOnDeduplicationItem,
  ]);
  return {
    globalGroupingEnabled: results[0].value as boolean,
    globalDeduplicationEnabled: results[1].value as boolean,
    domainRules: results[2].value as DomainRuleSettings,
    notifyOnGrouping: results[3].value as boolean,
    notifyOnDeduplication: results[4].value as boolean,
  };
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
    loadSyncSettingsFromStorage()
      .then(s => { setSettings(s); setIsLoaded(true); })
      .catch(error => logger.error('Error loading settings:', error));
  }, []);

  // Watchers pour les changements de storage (provenant d'autres sources)
  useEffect(() => {
    function applyExternalChange<K extends keyof SyncSettings>(field: K, newValue: SyncSettings[K]) {
      if (isLocalUpdate.current) return;
      setSettings(prev => {
        if (!prev) return prev;
        const callbacks = changeCallbacksRef.current[field];
        if (callbacks) callbacks.forEach(cb => cb(newValue));
        return { ...prev, [field]: newValue };
      });
    }

    const unwatchers = [
      globalGroupingEnabledItem.watch(v => applyExternalChange('globalGroupingEnabled', v)),
      globalDeduplicationEnabledItem.watch(v => applyExternalChange('globalDeduplicationEnabled', v)),
      domainRulesItem.watch(v => applyExternalChange('domainRules', v)),
      notifyOnGroupingItem.watch(v => applyExternalChange('notifyOnGrouping', v)),
      notifyOnDeduplicationItem.watch(v => applyExternalChange('notifyOnDeduplication', v)),
    ];

    return () => unwatchers.forEach(u => u());
  }, []); // Pas de dépendances - les watchers restent stables

  // Fonction générique pour mettre à jour un champ
  const updateField = useCallback(async <K extends keyof SyncSettings>(
    field: K,
    value: SyncSettings[K],
    setValue: (v: SyncSettings[K]) => Promise<void>,
  ) => {
    isLocalUpdate.current = true;
    try {
      // Mettre à jour l'état local d'abord pour une UI réactive
      setSettings(prev => prev ? { ...prev, [field]: value } : null);
      // Puis persister dans le storage
      await setValue(value);
    } finally {
      // Réactiver l'écoute des changements externes après un court délai
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
  }, []);

  // Fonction générique pour enregistrer un callback de changement
  const registerChangeCallback = useCallback(<K extends keyof SyncSettings>(
    field: K,
    callback: (value: SyncSettings[K]) => void
  ) => {
    setChangeCallbacks(prev => ({
      ...prev,
      [field]: new Set([...(prev[field] || []), callback as any])
    }));
    return () => {
      setChangeCallbacks(prev => {
        const newCallbacks = { ...prev };
        if (newCallbacks[field]) {
          (newCallbacks[field] as Set<any>).delete(callback);
          if (newCallbacks[field]!.size === 0) delete newCallbacks[field];
        }
        return newCallbacks;
      });
    };
  }, []);

  // Fonction pour mettre à jour plusieurs champs
  const updateSettings = useCallback(async (updates: Partial<SyncSettings>) => {
    isLocalUpdate.current = true;
    try {
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      const items: Parameters<typeof storage.setItems>[0] = [];
      if ('globalGroupingEnabled' in updates)
        items.push({ item: globalGroupingEnabledItem, value: updates.globalGroupingEnabled! });
      if ('globalDeduplicationEnabled' in updates)
        items.push({ item: globalDeduplicationEnabledItem, value: updates.globalDeduplicationEnabled! });
      if ('domainRules' in updates)
        items.push({ item: domainRulesItem, value: updates.domainRules! });
      if ('notifyOnGrouping' in updates)
        items.push({ item: notifyOnGroupingItem, value: updates.notifyOnGrouping! });
      if ('notifyOnDeduplication' in updates)
        items.push({ item: notifyOnDeduplicationItem, value: updates.notifyOnDeduplication! });
      if (items.length > 0) await storage.setItems(items);
    } finally {
      setTimeout(() => { isLocalUpdate.current = false; }, 100);
    }
  }, []);

  // Fonction pour recharger les settings
  const reloadSettings = useCallback(async () => {
    try {
      setSettings(await loadSyncSettingsFromStorage());
    } catch (error) {
      logger.error('Error reloading settings:', error);
    }
  }, []);

  return {
    settings,
    isLoaded,

    // Setters
    setGlobalGroupingEnabled: (v) => updateField('globalGroupingEnabled', v, globalGroupingEnabledItem.setValue),
    setGlobalDeduplicationEnabled: (v) => updateField('globalDeduplicationEnabled', v, globalDeduplicationEnabledItem.setValue),
    setDomainRules: (v) => updateField('domainRules', v, domainRulesItem.setValue),

    // Change callbacks
    onGlobalGroupingEnabledChange: (cb) => registerChangeCallback('globalGroupingEnabled', cb),
    onGlobalDeduplicationEnabledChange: (cb) => registerChangeCallback('globalDeduplicationEnabled', cb),
    onDomainRulesChange: (cb) => registerChangeCallback('domainRules', cb),

    // Utilitaires
    updateSettings,
    reloadSettings
  };
}
