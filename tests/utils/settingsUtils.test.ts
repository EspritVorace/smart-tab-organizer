import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { storage } from 'wxt/utils/storage';
import {
  getSettings,
  setSettings,
  updateSettings,
  watchSettings,
  watchSettingsField,
} from '../../src/utils/settingsUtils';
import { _resetWorkspaceContextForTests } from '../../src/utils/workspaceContext';
import { defaultAppSettings } from '../../src/types/syncSettings';
import type { AppSettings } from '../../src/types/syncSettings';

// fakeBrowser.reset() runs before each test via tests/setup.ts.

beforeEach(() => {
  _resetWorkspaceContextForTests();
});

describe('settingsUtils', () => {
  describe('getSettings', () => {
    it('returns default values when storage is empty', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(defaultAppSettings);
    });

    it('returns the stored settings', async () => {
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

    it('defaults deduplicateUnmatchedDomains to false when missing from storage', async () => {
      const settings = await getSettings();
      expect(settings.deduplicateUnmatchedDomains).toBe(false);
    });

    it('defaults deduplicationKeepStrategy to keep-grouped-or-new when missing from storage', async () => {
      const settings = await getSettings();
      expect(settings.deduplicationKeepStrategy).toBe('keep-grouped-or-new');
    });

    it('defaults defaultRestoreAction to current when missing from storage', async () => {
      const settings = await getSettings();
      expect(settings.defaultRestoreAction).toBe('current');
    });

    it('returns default values on error', async () => {
      vi.spyOn(storage, 'getItems').mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const settings = await getSettings();
      expect(settings).toEqual(defaultAppSettings);
    });
  });

  describe('setSettings', () => {
    it('writes every setting to storage', async () => {
      const newSettings = {
        ...defaultAppSettings,
        globalGroupingEnabled: false,
      };
      await setSettings(newSettings);
      const stored = await fakeBrowser.storage.local.get(null);
      expect(stored.globalGroupingEnabled).toBe(false);
    });

    it('does not throw when storage.set fails', async () => {
      vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(
        new Error('Storage write error'),
      );
      await expect(setSettings(defaultAppSettings)).resolves.toBeUndefined();
    });
  });

  describe('updateSettings', () => {
    it('partially updates settings', async () => {
      await fakeBrowser.storage.local.set({
        globalGroupingEnabled: true,
        globalDeduplicationEnabled: true,
      });
      await updateSettings({ globalGroupingEnabled: false });
      const settings = await getSettings();
      expect(settings.globalGroupingEnabled).toBe(false);
      expect(settings.globalDeduplicationEnabled).toBe(true); // unchanged
    });

    it('updates deduplicateUnmatchedDomains in isolation', async () => {
      await updateSettings({ deduplicateUnmatchedDomains: true });
      const settings = await getSettings();
      expect(settings.deduplicateUnmatchedDomains).toBe(true);
      // Other fields untouched (default values preserved).
      expect(settings.globalDeduplicationEnabled).toBe(true);
    });

    it('does not throw when storage.set fails', async () => {
      vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValueOnce(
        new Error('Storage write error'),
      );
      await expect(updateSettings({ globalGroupingEnabled: false })).resolves.toBeUndefined();
    });

    it('updates globalDeduplicationEnabled', async () => {
      await updateSettings({ globalDeduplicationEnabled: false });
      const settings = await getSettings();
      expect(settings.globalDeduplicationEnabled).toBe(false);
    });

    it('updates deduplicationKeepStrategy', async () => {
      await updateSettings({ deduplicationKeepStrategy: 'keep-old' });
      const settings = await getSettings();
      expect(settings.deduplicationKeepStrategy).toBe('keep-old');
    });

    it('updates defaultRestoreAction', async () => {
      await updateSettings({ defaultRestoreAction: 'replace' });
      const settings = await getSettings();
      expect(settings.defaultRestoreAction).toBe('replace');
    });

    it('updates domainRules', async () => {
      await updateSettings({ domainRules: [] });
      const settings = await getSettings();
      expect(settings.domainRules).toEqual([]);
    });

    it('updates notifyOnGrouping', async () => {
      await updateSettings({ notifyOnGrouping: false });
      const settings = await getSettings();
      expect(settings.notifyOnGrouping).toBe(false);
    });

    it('updates notifyOnDeduplication', async () => {
      await updateSettings({ notifyOnDeduplication: false });
      const settings = await getSettings();
      expect(settings.notifyOnDeduplication).toBe(false);
    });

    it('updates notifyOnOrganize', async () => {
      await updateSettings({ notifyOnOrganize: false });
      const settings = await getSettings();
      expect(settings.notifyOnOrganize).toBe(false);
    });

  });

  describe('watchSettings', () => {
    it('returns a cleanup function', () => {
      const unwatch = watchSettings(() => {});
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('the cleanup function is callable without errors', () => {
      const unwatch = watchSettings(vi.fn());
      expect(() => unwatch()).not.toThrow();
    });

    it('calls the callback with current settings when a watched storage key changes', async () => {
      const callback = vi.fn();
      const unwatch = watchSettings(callback);

      await fakeBrowser.storage.local.set({ globalGroupingEnabled: false });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalled();
      const received: AppSettings = callback.mock.calls[0][0];
      expect(received).toHaveProperty('globalGroupingEnabled');

      unwatch();
    });

    it('stops calling the callback after unwatch is called', async () => {
      const callback = vi.fn();
      const unwatch = watchSettings(callback);
      unwatch();

      await fakeBrowser.storage.local.set({ globalGroupingEnabled: false });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('watchSettingsField', () => {
    it('returns a cleanup function for globalGroupingEnabled', () => {
      const unwatch = watchSettingsField('globalGroupingEnabled', vi.fn());
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('returns a cleanup function for deduplicationKeepStrategy', () => {
      const unwatch = watchSettingsField('deduplicationKeepStrategy', vi.fn());
      expect(typeof unwatch).toBe('function');
      unwatch();
    });

    it('invokes the callback with the new value when the specific field changes', async () => {
      const callback = vi.fn();
      const unwatch = watchSettingsField('globalGroupingEnabled', callback);

      await fakeBrowser.storage.local.set({ globalGroupingEnabled: false });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(false);
      unwatch();
    });

    it('does not fire for a field it is not watching', async () => {
      const callback = vi.fn();
      const unwatch = watchSettingsField('globalGroupingEnabled', callback);

      await fakeBrowser.storage.local.set({ globalDeduplicationEnabled: false });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).not.toHaveBeenCalled();
      unwatch();
    });

    it('covers all AppSettings field keys without throwing', () => {
      const fields: Array<keyof AppSettings> = [
        'globalGroupingEnabled',
        'globalDeduplicationEnabled',
        'deduplicateUnmatchedDomains',
        'deduplicationKeepStrategy',
        'defaultRestoreAction',
        'domainRules',
        'notifyOnGrouping',
        'notifyOnDeduplication',
        'notifyOnOrganize',
      ];
      const unwatchers = fields.map((f) => watchSettingsField(f, vi.fn()));
      expect(() => unwatchers.forEach((u) => u())).not.toThrow();
    });
  });
});
