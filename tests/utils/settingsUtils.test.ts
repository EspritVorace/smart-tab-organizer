import { describe, it, expect, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getSyncSettings,
  setSyncSettings,
  updateSyncSettings,
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

});
