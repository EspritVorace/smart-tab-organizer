import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  measureKeysBytes,
  measureGlobalStorageUsage,
  measureWorkspaceStorageUsage,
  measureAllWorkspacesStorageUsage,
  getStorageQuotaBytes,
} from '../src/utils/storageUsageUtils';

const encoder = new TextEncoder();

/** Mirrors the fallback formula in storageUsageUtils (key + value JSON). */
function entryBytes(rawKey: string, value: unknown): number {
  return encoder.encode(rawKey).length + encoder.encode(JSON.stringify(value)).length;
}

beforeEach(() => {
  fakeBrowser.reset();
});

describe('measureKeysBytes (fallback path)', () => {
  it('returns 0 for an empty key list', async () => {
    expect(await measureKeysBytes([])).toBe(0);
  });

  it('encodes key + value bytes for present keys, ignores absent ones', async () => {
    const value = { a: 1, b: 'hello' };
    await fakeBrowser.storage.local.set({ domainRules: value });

    const bytes = await measureKeysBytes([
      'local:domainRules',
      'local:sessions', // absent -> contributes 0
    ]);

    expect(bytes).toBe(entryBytes('domainRules', value));
  });

  it('strips the local: prefix to reach the raw storage key', async () => {
    await fakeBrowser.storage.local.set({ categories: [{ id: 'x' }] });
    const bytes = await measureKeysBytes(['local:categories']);
    expect(bytes).toBe(entryBytes('categories', [{ id: 'x' }]));
  });
});

describe('getStorageQuotaBytes', () => {
  it('returns a positive quota value', () => {
    expect(getStorageQuotaBytes()).toBeGreaterThan(0);
  });
});

describe('measureWorkspaceStorageUsage', () => {
  it('breaks usage down by category and sums the workspace total', async () => {
    const rules = [{ id: 'r1', domainFilter: 'example.com' }];
    const sessions = [{ id: 's1', name: 'Session 1' }];
    await fakeBrowser.storage.local.set({
      domainRules: rules,
      sessions,
    });

    const usage = await measureWorkspaceStorageUsage('default');

    const byId = new Map(usage.categories.map((c) => [c.id, c]));
    expect(byId.get('domain-rules')?.bytes).toBe(entryBytes('domainRules', rules));
    expect(byId.get('sessions-active')?.bytes).toBe(entryBytes('sessions', sessions));
    // Empty buckets contribute 0.
    expect(byId.get('sessions-archived')?.bytes).toBe(0);

    const expectedTotal = usage.categories.reduce((sum, c) => sum + c.bytes, 0);
    expect(usage.workspaceTotalBytes).toBe(expectedTotal);
    expect(usage.workspaceTotalBytes).toBeGreaterThan(0);
  });

  it('every category carries a label key for i18n', async () => {
    const usage = await measureWorkspaceStorageUsage('default');
    for (const cat of usage.categories) {
      expect(cat.labelKey).toMatch(/^statsStorageCat/);
    }
  });
});

describe('measureAllWorkspacesStorageUsage', () => {
  it('measures each workspace independently, tagging results with the id', async () => {
    const defaultRules = [{ id: 'r1', domainFilter: 'example.com' }];
    const workRules = [{ id: 'r2', domainFilter: 'work.com' }, { id: 'r3', domainFilter: 'crm.com' }];
    await fakeBrowser.storage.local.set({
      // Default workspace keeps legacy unprefixed keys.
      domainRules: defaultRules,
      // Extra workspace uses the namespaced form `ws:{id}:{field}`.
      'ws:work:domainRules': workRules,
    });

    const entries = await measureAllWorkspacesStorageUsage(['default', 'work']);

    expect(entries.map((e) => e.workspaceId)).toEqual(['default', 'work']);

    const defaultEntry = entries.find((e) => e.workspaceId === 'default')!;
    const workEntry = entries.find((e) => e.workspaceId === 'work')!;

    const defaultDomainRules = defaultEntry.categories.find((c) => c.id === 'domain-rules');
    const workDomainRules = workEntry.categories.find((c) => c.id === 'domain-rules');

    expect(defaultDomainRules?.bytes).toBe(entryBytes('domainRules', defaultRules));
    expect(workDomainRules?.bytes).toBe(entryBytes('ws:work:domainRules', workRules));
    // Each workspace only counts its own keys.
    expect(workEntry.workspaceTotalBytes).toBe(entryBytes('ws:work:domainRules', workRules));
  });
});

describe('measureGlobalStorageUsage', () => {
  it('sums bytes across the whole storage.local area', async () => {
    const a = { foo: 1 };
    const b = [1, 2, 3];
    await fakeBrowser.storage.local.set({ keyA: a, keyB: b });

    const total = await measureGlobalStorageUsage();
    expect(total).toBe(entryBytes('keyA', a) + entryBytes('keyB', b));
  });
});
