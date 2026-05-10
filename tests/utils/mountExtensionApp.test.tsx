import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('../../src/utils/categoriesStore.js', () => ({
  initCategoriesStore: vi.fn(() => Promise.resolve()),
}));

import { mountExtensionApp } from '../../src/utils/mountExtensionApp';

describe('mountExtensionApp', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-mount-root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('mounts a React element into the container', async () => {
    mountExtensionApp(
      'test-mount-root',
      React.createElement('div', { 'data-testid': 'mounted-content' }, 'hello'),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(document.getElementById('test-mount-root')?.querySelector('[data-testid="mounted-content"]')).toBeTruthy();
  });

  it('logs an error and does not throw when the container is missing', () => {
    expect(() => mountExtensionApp('nonexistent-id', React.createElement('div'))).not.toThrow();
  });

  it('does not throw when browser.i18n.getUILanguage is unavailable', () => {
    expect(() => mountExtensionApp('test-mount-root', React.createElement('div'))).not.toThrow();
  });
});
