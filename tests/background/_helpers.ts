/**
 * Shared test helpers for background/ unit tests.
 *
 * Usage pattern:
 *
 *   import { makeRule, makeSettings, tab, browserMock } from './_helpers';
 *   vi.mock('wxt/browser', () => ({ browser: browserMock() }));
 *   // ...
 *
 * This file deliberately contains no side effects: hoisting-safe so
 * vi.mock() factories can import from it.
 */
import { vi } from 'vitest';
import type { DomainRuleSetting, SyncSettings } from '../../src/types/syncSettings';

// ---- Types ------------------------------------------------------------------

/**
 * Shape of the mocked `browser` object. Tests cast the imported `browser`
 * through this to keep strict typing on each mock method.
 */
export type MockedBrowser = {
  tabs: {
    query: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    group: ReturnType<typeof vi.fn>;
    ungroup: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    onCreated: { addListener: ReturnType<typeof vi.fn> };
    onUpdated: { addListener: ReturnType<typeof vi.fn> };
    TAB_ID_NONE: number;
  };
  tabGroups: {
    query: ReturnType<typeof vi.fn>;
    move: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  windows: {
    get: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getCurrent: ReturnType<typeof vi.fn>;
    onRemoved: { addListener: ReturnType<typeof vi.fn> };
  };
  runtime: {
    getURL: ReturnType<typeof vi.fn>;
    onInstalled: { addListener: ReturnType<typeof vi.fn> };
    onMessage: { addListener: ReturnType<typeof vi.fn> };
  };
  notifications: {
    create: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
};

// ---- Browser mock factory ---------------------------------------------------

/**
 * Returns a fresh, fully-mocked `browser` object covering all APIs used by
 * background/*.ts modules. Each call returns a new instance so tests stay
 * isolated.
 */
export function browserMock() {
  return {
    tabs: {
      query: vi.fn(),
      get: vi.fn(),
      group: vi.fn(),
      ungroup: vi.fn(),
      update: vi.fn(),
      reload: vi.fn(),
      remove: vi.fn(),
      onCreated: { addListener: vi.fn() },
      onUpdated: { addListener: vi.fn() },
      TAB_ID_NONE: -1,
    },
    tabGroups: {
      query: vi.fn(),
      move: vi.fn(),
      update: vi.fn(),
    },
    windows: {
      get: vi.fn(),
      update: vi.fn(),
      getCurrent: vi.fn(),
      onRemoved: { addListener: vi.fn() },
    },
    runtime: {
      getURL: vi.fn((p: string) => `chrome-extension://fake${p}`),
      onInstalled: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
    },
    notifications: {
      create: vi.fn(),
      clear: vi.fn(),
    },
  };
}

// ---- Fixture factories ------------------------------------------------------

export function makeRule(overrides: Partial<DomainRuleSetting> = {}): DomainRuleSetting {
  return {
    id: 'rule-1',
    domainFilter: 'example.com',
    label: 'Example',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    color: 'blue',
    deduplicationEnabled: true,
    presetId: null,
    enabled: true,
    groupingEnabled: true,
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<SyncSettings> = {}): SyncSettings {
  // Mirrors defaultSyncSettings (src/types/syncSettings.ts) so tests that
  // don't override anything use realistic production-like values.
  return {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
    domainRules: [],
    ...overrides,
  };
}

export function tab(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    url: 'https://example.com/page',
    title: 'Example Page',
    windowId: 1,
    index: id,
    groupId: -1,
    status: 'complete',
    ...overrides,
  };
}
