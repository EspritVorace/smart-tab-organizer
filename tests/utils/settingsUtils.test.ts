import { describe, it, expect, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getSyncSettings,
  setSyncSettings,
  updateSyncSettings,
  getGlobalGroupingEnabled,
  getGlobalDeduplicationEnabled,
  getDomainRules,
} from '../../src/utils/settingsUtils';
import { defaultSyncSettings } from '../../src/types/syncSettings';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('settingsUtils', () => {
  describe('getSyncSettings', () => {
    it('retourne les valeurs par défaut si le storage est vide', async () => {
      const settings = await getSyncSettings();
      expect(settings).toEqual(defaultSyncSettings);
    });

    it('retourne les paramètres stockés', async () => {
      await fakeBrowser.storage.sync.set({
        globalGroupingEnabled: false,
        globalDeduplicationEnabled: false,
        domainRules: [],
        notifyOnGrouping: false,
        notifyOnDeduplication: false,
      });
      const settings = await getSyncSettings();
      expect(settings.globalGroupingEnabled).toBe(false);
      expect(settings.globalDeduplicationEnabled).toBe(false);
    });

    it('retourne les valeurs par défaut en cas d\'erreur', async () => {
      vi.spyOn(fakeBrowser.storage.sync, 'get').mockRejectedValueOnce(
        new Error('Sync storage error'),
      );
      const settings = await getSyncSettings();
      expect(settings).toEqual(defaultSyncSettings);
    });
  });

  describe('setSyncSettings', () => {
    it('écrit tous les paramètres dans le storage', async () => {
      const newSettings = {
        ...defaultSyncSettings,
        globalGroupingEnabled: false,
      };
      await setSyncSettings(newSettings);
      const stored = await fakeBrowser.storage.sync.get(null);
      expect(stored.globalGroupingEnabled).toBe(false);
    });
  });

  describe('updateSyncSettings', () => {
    it('met à jour partiellement les paramètres', async () => {
      await fakeBrowser.storage.sync.set({
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
      });
      await updateSyncSettings({ globalGroupingEnabled: false });
      const settings = await getSyncSettings();
      expect(settings.globalGroupingEnabled).toBe(false);
      expect(settings.globalDeduplicationEnabled).toBe(true); // inchangé
    });
  });

  describe('getGlobalGroupingEnabled', () => {
    it('retourne la valeur par défaut (true) si non définie', async () => {
      const result = await getGlobalGroupingEnabled();
      expect(result).toBe(true);
    });

    it('retourne false si défini à false dans le storage', async () => {
      await fakeBrowser.storage.sync.set({ globalGroupingEnabled: false });
      const result = await getGlobalGroupingEnabled();
      expect(result).toBe(false);
    });

    it('retourne la valeur par défaut en cas d\'erreur', async () => {
      vi.spyOn(fakeBrowser.storage.sync, 'get').mockRejectedValueOnce(
        new Error('Error'),
      );
      const result = await getGlobalGroupingEnabled();
      expect(result).toBe(defaultSyncSettings.globalGroupingEnabled);
    });
  });

  describe('getGlobalDeduplicationEnabled', () => {
    it('retourne la valeur par défaut (true) si non définie', async () => {
      const result = await getGlobalDeduplicationEnabled();
      expect(result).toBe(true);
    });

    it('retourne false si défini à false dans le storage', async () => {
      await fakeBrowser.storage.sync.set({ globalDeduplicationEnabled: false });
      const result = await getGlobalDeduplicationEnabled();
      expect(result).toBe(false);
    });
  });

  describe('getDomainRules', () => {
    it('retourne un tableau vide par défaut', async () => {
      const rules = await getDomainRules();
      expect(rules).toEqual([]);
    });

    it('retourne les règles stockées', async () => {
      const storedRules = [
        { id: '1', label: 'Test Rule', domainFilter: 'example.com' },
      ];
      await fakeBrowser.storage.sync.set({ domainRules: storedRules });
      const rules = await getDomainRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].label).toBe('Test Rule');
    });
  });
});
