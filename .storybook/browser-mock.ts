/**
 * In-memory mock of the WebExtension `browser` namespace, used by Storybook.
 *
 * Two consumers share the SAME singleton:
 * - App code via `import { browser } from 'wxt/browser'`,
 *   aliased to this file in `.storybook/main.ts`.
 * - Library internals via `import { browser } from '@wxt-dev/browser'`
 *   (notably `@wxt-dev/storage`), also aliased in `.storybook/main.ts`.
 *
 * Without aliasing both, `@wxt-dev/storage` evaluates `globalThis.chrome`
 * before `preview.tsx` runs and throws "Cannot read properties of undefined
 * (reading 'runtime' / 'local' / 'onChanged')" inside the iframe.
 *
 * The mock emulates real semantics only where stories rely on them:
 * - storage.{local,session,sync}.get accepts string | string[] | object | null
 *   (object form returns defaults for missing keys).
 * - storage.{area}.onChanged.{add,remove}Listener mirrors per-area events.
 * - storage.onChanged is the global event with `(changes, areaName)`.
 * - i18n.getMessage reads `globalThis.currentLocale` + `messagesCache`,
 *   populated by preview.tsx's locale loader.
 *
 * Stories that need tabs/windows/notifications APIs should mock them via
 * decorators; this file deliberately does not stub them to keep the surface
 * predictable.
 */

type StoredValue = unknown;
type StorageRecord = Record<string, StoredValue>;
type StorageChange = { oldValue?: StoredValue; newValue?: StoredValue };
type ChangesPayload = Record<string, StorageChange>;
type AreaName = 'local' | 'session' | 'sync' | 'managed';
type ChangeListener = (changes: ChangesPayload, areaName: AreaName) => void;
type AreaListener = (changes: ChangesPayload) => void;

interface LocalePlaceholder { content: string }
interface LocaleMessage { message: string; placeholders?: Record<string, LocalePlaceholder> }
type LocaleMessages = Record<string, LocaleMessage>;
type MessagesCache = Record<string, LocaleMessages>;

interface I18nGlobals {
  currentLocale?: string;
  messagesCache?: MessagesCache;
}

const i18nGlobals = globalThis as typeof globalThis & I18nGlobals;
i18nGlobals.messagesCache = i18nGlobals.messagesCache ?? {};

function resolveMessage(entry: LocaleMessage, substitutions?: string | string[]): string {
  let msg = entry.message;
  if (entry.placeholders) {
    for (const [name, p] of Object.entries(entry.placeholders)) {
      msg = msg.split(`$${name}$`).join(p.content);
    }
  }
  if (substitutions !== undefined) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    msg = msg.replace(/\$(\d+)/g, (m, n) => subs[Number(n) - 1] ?? m);
  }
  return msg;
}

class InMemoryStorageArea {
  private store: StorageRecord = {};
  private areaListeners = new Set<AreaListener>();

  readonly onChanged = {
    addListener: (cb: AreaListener) => this.areaListeners.add(cb),
    removeListener: (cb: AreaListener) => this.areaListeners.delete(cb),
    hasListener: (cb: AreaListener) => this.areaListeners.has(cb),
  };

  constructor(
    private readonly area: AreaName,
    private readonly notifyGlobal: (changes: ChangesPayload, area: AreaName) => void,
  ) {}

  async get(keys?: string | string[] | StorageRecord | null): Promise<StorageRecord> {
    if (keys === null || keys === undefined) {
      return { ...this.store };
    }
    if (typeof keys === 'string') {
      return keys in this.store ? { [keys]: this.store[keys] } : {};
    }
    if (Array.isArray(keys)) {
      const out: StorageRecord = {};
      for (const k of keys) {
        if (k in this.store) out[k] = this.store[k];
      }
      return out;
    }
    const out: StorageRecord = {};
    for (const [k, defaultValue] of Object.entries(keys)) {
      out[k] = k in this.store ? this.store[k] : defaultValue;
    }
    return out;
  }

  async set(items: StorageRecord): Promise<void> {
    const changes: ChangesPayload = {};
    for (const [k, newValue] of Object.entries(items)) {
      const oldValue = this.store[k];
      this.store[k] = newValue;
      changes[k] = { oldValue, newValue };
    }
    if (Object.keys(changes).length > 0) {
      this.dispatch(changes);
    }
  }

  async remove(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const changes: ChangesPayload = {};
    for (const k of keyList) {
      if (k in this.store) {
        changes[k] = { oldValue: this.store[k], newValue: undefined };
        delete this.store[k];
      }
    }
    if (Object.keys(changes).length > 0) {
      this.dispatch(changes);
    }
  }

  async clear(): Promise<void> {
    const changes: ChangesPayload = {};
    for (const k of Object.keys(this.store)) {
      changes[k] = { oldValue: this.store[k], newValue: undefined };
    }
    this.store = {};
    if (Object.keys(changes).length > 0) {
      this.dispatch(changes);
    }
  }

  private dispatch(changes: ChangesPayload): void {
    for (const cb of this.areaListeners) cb(changes);
    this.notifyGlobal(changes, this.area);
  }
}

function createEventStub<TArgs extends unknown[]>() {
  const listeners = new Set<(...args: TArgs) => unknown>();
  return {
    addListener: (cb: (...args: TArgs) => unknown) => listeners.add(cb),
    removeListener: (cb: (...args: TArgs) => unknown) => listeners.delete(cb),
    hasListener: (cb: (...args: TArgs) => unknown) => listeners.has(cb),
  };
}

const globalChangeListeners = new Set<ChangeListener>();
const notifyGlobal = (changes: ChangesPayload, area: AreaName) => {
  for (const cb of globalChangeListeners) cb(changes, area);
};

export const browser = {
  storage: {
    local: new InMemoryStorageArea('local', notifyGlobal),
    session: new InMemoryStorageArea('session', notifyGlobal),
    sync: new InMemoryStorageArea('sync', notifyGlobal),
    onChanged: {
      addListener: (cb: ChangeListener) => globalChangeListeners.add(cb),
      removeListener: (cb: ChangeListener) => globalChangeListeners.delete(cb),
      hasListener: (cb: ChangeListener) => globalChangeListeners.has(cb),
    },
  },
  runtime: {
    id: 'storybook-mock',
    lastError: undefined as undefined,
    getURL: (path: string) => (path.startsWith('/') ? path : `/${path}`),
    getManifest: () => ({ version: '0.0.0-storybook', manifest_version: 3 }),
    sendMessage: async () => undefined,
    openOptionsPage: async () => undefined,
    onMessage: createEventStub(),
    onInstalled: createEventStub(),
  },
  i18n: {
    getMessage: (key: string, substitutions?: string | string[]): string => {
      const locale = i18nGlobals.currentLocale ?? 'en';
      const messages = i18nGlobals.messagesCache?.[locale] ?? {};
      const entry = messages[key];
      if (!entry) return key;
      return resolveMessage(entry, substitutions);
    },
    getUILanguage: (): string => i18nGlobals.currentLocale ?? 'en',
  },
};

export type StorybookBrowser = typeof browser;

// Surface the same singleton on globalThis so stories can call
// `browser.storage.local.set(...)` directly in their `beforeEach` blocks.
const globalSlot = globalThis as typeof globalThis & { browser?: StorybookBrowser };
globalSlot.browser = browser;
if (typeof window !== 'undefined') {
  (window as typeof window & { browser?: StorybookBrowser }).browser = browser;
}

export default browser;
