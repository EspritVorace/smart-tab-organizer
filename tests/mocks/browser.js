// Mock pour browser.storage utilisé dans les tests
class MockStorage {
  constructor() {
    this.data = {};
    this.listeners = [];
  }

  async get(keys) {
    if (typeof keys === 'string') {
      return { [keys]: this.data[keys] };
    }
    
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        result[key] = this.data[key];
      });
      return result;
    }
    
    if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
      });
      return result;
    }
    
    return { ...this.data };
  }

  async set(items) {
    const changes = {};
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

  async remove(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes = {};
    
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

  async clear() {
    const changes = {};
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
  _setData(data) {
    this.data = { ...data };
  }

  _getData() {
    return { ...this.data };
  }

  _clearListeners() {
    this.listeners = [];
  }
}

const mockStorage = {
  sync: new MockStorage(),
  local: new MockStorage(),
  onChanged: {
    addListener: (callback) => {
      mockStorage.sync.listeners.push(callback);
      mockStorage.local.listeners.push(callback);
    },
    removeListener: (callback) => {
      mockStorage.sync.listeners = mockStorage.sync.listeners.filter(l => l !== callback);
      mockStorage.local.listeners = mockStorage.local.listeners.filter(l => l !== callback);
    }
  }
};

// Mock global browser
global.browser = {
  storage: mockStorage
};

export { mockStorage };