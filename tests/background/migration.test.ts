import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { migrateSettingsFromSyncToLocal } from '../../src/background/migration';

describe('migrateSettingsFromSyncToLocal', () => {
  it('sets the migration flag after running on a fresh install', async () => {
    await migrateSettingsFromSyncToLocal();
    const state = await fakeBrowser.storage.local.get('settingsMigratedToLocal');
    expect(state.settingsMigratedToLocal).toBe(true);
  });

  it('is idempotent: does nothing when migration flag is already set', async () => {
    await fakeBrowser.storage.local.set({ settingsMigratedToLocal: true });
    // Should return early without error
    await expect(migrateSettingsFromSyncToLocal()).resolves.toBeUndefined();
  });

  it('copies settings from sync to local when sync has data and local does not', async () => {
    await fakeBrowser.storage.sync.set({ globalGroupingEnabled: false });
    await migrateSettingsFromSyncToLocal();
    const local = await fakeBrowser.storage.local.get('globalGroupingEnabled');
    expect(local.globalGroupingEnabled).toBe(false);
  });

  it('does not overwrite local settings that already exist', async () => {
    await fakeBrowser.storage.sync.set({ globalGroupingEnabled: false });
    await fakeBrowser.storage.local.set({ globalGroupingEnabled: true });
    await migrateSettingsFromSyncToLocal();
    const local = await fakeBrowser.storage.local.get('globalGroupingEnabled');
    expect(local.globalGroupingEnabled).toBe(true);
  });

  it('completes without error when sync storage is empty', async () => {
    await expect(migrateSettingsFromSyncToLocal()).resolves.toBeUndefined();
    const state = await fakeBrowser.storage.local.get('settingsMigratedToLocal');
    expect(state.settingsMigratedToLocal).toBe(true);
  });
});
