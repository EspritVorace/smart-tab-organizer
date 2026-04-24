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

  it('monte un élément React dans le container', async () => {
    mountExtensionApp(
      'test-mount-root',
      React.createElement('div', { 'data-testid': 'mounted-content' }, 'hello'),
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(document.getElementById('test-mount-root')?.querySelector('[data-testid="mounted-content"]')).toBeTruthy();
  });

  it('log une erreur et ne lance pas si le container est absent', () => {
    expect(() => mountExtensionApp('nonexistent-id', React.createElement('div'))).not.toThrow();
  });

  it("ne lance pas même si browser.i18n.getUILanguage n'est pas disponible", () => {
    expect(() => mountExtensionApp('test-mount-root', React.createElement('div'))).not.toThrow();
  });
});
