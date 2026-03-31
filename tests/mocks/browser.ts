// Mock pour browser.storage utilisé dans les tests

interface StorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

type StorageChanges = Record<string, StorageChange>;
type StorageChangeListener = (changes: StorageChanges, areaName: string) => void;

class MockStorage {
  private data: Record<string, unknown> = {};
  listeners: StorageChangeListener[] = [];

  async get(keys: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>> {
    if (typeof keys === 'string') {
      return { [keys]: this.data[keys] };
    }

    if (Array.isArray(keys)) {
      const result: Record<string, unknown> = {};
      keys.forEach(key => {
        result[key] = this.data[key];
      });
      return result;
    }

    if (typeof keys === 'object') {
      const result: Record<string, unknown> = {};
      Object.keys(keys).forEach(key => {
        result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
      });
      return result;
    }

    return { ...this.data };
  }

  async set(items: Record<string, unknown>): Promise<void> {
    const changes: StorageChanges = {};
    Object.keys(items).forEach(key => {
      const oldValue = this.data[key];
      const newValue = items[key];
      this.data[key] = newValue;

      if (oldValue !== newValue) {
        changes[key] = { oldValue, newValue };
      }
    });

    // Simuler les callbacks de changement
    setTimeout(() => {
      this.listeners.forEach(listener => {
        listener(changes, 'sync');
      });
    }, 0);
  }

  async remove(keys: string | string[]): Promise<void> {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes: StorageChanges = {};

    keysArray.forEach(key => {
      if (this.data[key] !== undefined) {
        const oldValue = this.data[key];
        delete this.data[key];
        changes[key] = { oldValue, newValue: undefined };
      }
    });

    // Simuler les callbacks de changement
    setTimeout(() => {
      this.listeners.forEach(listener => {
        listener(changes, 'sync');
      });
    }, 0);
  }

  async clear(): Promise<void> {
    const changes: StorageChanges = {};
    Object.keys(this.data).forEach(key => {
      changes[key] = { oldValue: this.data[key], newValue: undefined };
    });

    this.data = {};

    // Simuler les callbacks de changement
    setTimeout(() => {
      this.listeners.forEach(listener => {
        listener(changes, 'sync');
      });
    }, 0);
  }

  // Méthodes pour les tests
  _setData(data: Record<string, unknown>): void {
    this.data = { ...data };
  }

  _getData(): Record<string, unknown> {
    return { ...this.data };
  }

  _clearListeners(): void {
    this.listeners = [];
  }
}

const mockStorage = {
  sync: new MockStorage(),
  local: new MockStorage(),
  onChanged: {
    addListener: (callback: StorageChangeListener) => {
      mockStorage.sync.listeners.push(callback);
      mockStorage.local.listeners.push(callback);
    },
    removeListener: (callback: StorageChangeListener) => {
      mockStorage.sync.listeners = mockStorage.sync.listeners.filter(l => l !== callback);
      mockStorage.local.listeners = mockStorage.local.listeners.filter(l => l !== callback);
    },
  },
};

// Mock global browser
(global as unknown as { browser: unknown }).browser = {
  storage: mockStorage,
};

export { mockStorage };
