import { describe, it, expect, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  getSettings,
  setSettings,
  updateSettings,
} from '../../src/utils/settingsUtils';
import { defaultAppSettings } from '../../src/types/syncSettings';

// fakeBrowser.reset() est appelé avant chaque test via tests/setup.ts

describe('settingsUtils', () => {
  describe('getSettings', () => {
    it('retourne les valeurs par défaut si le storage est vide', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(defaultAppSettings);
    });

    it('retourne les paramètres stockés', async () => {
      await fakeBrowser.storage.local.set({
        globalGroupingEnabled: false,
        globalDeduplicationEnabled: false,
        deduplicateUnmatchedDomains: false,
        domainRules: [],
        notifyOnGrouping: false,
        notifyOnDeduplication: false,
      });
      const settings = await getSettings();
      expect(settings.globalGroupingEnabled).toBe(false);
      expect(settings.globalDeduplicationEnabled).toBe(false);
      expect(settings.deduplicateUnmatchedDomains).toBe(false);
    });

    it('retourne false par défaut pour deduplicateUnmatchedDomains si absent du storage', async () => {
      const settings = await getSettings();
      expect(settings.deduplicateUnmatchedDomains).toBe(false);
    });

    it('retourne keep-grouped-or-new par défaut pour deduplicationKeepStrategy si absent du storage', async () => {
      const settings = await getSettings();
      expect(settings.deduplicationKeepStrategy).toBe('keep-grouped-or-new');
    });

    it("retourne les valeurs par défaut en cas d'erreur", async () => {
      vi.spyOn(fakeBrowser.storage.local, 'get').mockRejectedValueOnce(
        new Error('Local storage error'),
      );
      const settings = await getSettings();
      expect(settings).toEqual(defaultAppSettings);
    });
  });

  describe('setSettings', () => {
    it('écrit tous les paramètres dans le storage', async () => {
      const newSettings = {
        ...defaultAppSettings,
        globalGroupingEnabled: false,
      };
      await setSettings(newSettings);
      const stored = await fakeBrowser.storage.local.get(null);
      expect(stored.globalGroupingEnabled).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('met à jour partiellement les paramètres', async () => {
      await fakeBrowser.storage.local.set({
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
      });
      await updateSettings({ globalGroupingEnabled: false });
      const settings = await getSettings();
      expect(settings.globalGroupingEnabled).toBe(false);
      expect(settings.globalDeduplicationEnabled).toBe(true); // inchangé
    });

    it('met à jour deduplicateUnmatchedDomains isolément', async () => {
      await updateSettings({ deduplicateUnmatchedDomains: true });
      const settings = await getSettings();
      expect(settings.deduplicateUnmatchedDomains).toBe(true);
      // Autres champs inchangés (valeurs par défaut conservées)
      expect(settings.globalDeduplicationEnabled).toBe(true);
    });
  });
});
