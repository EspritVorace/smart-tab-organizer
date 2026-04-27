import React from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { logger } from './logger.js';
import { initCategoriesStore } from './categoriesStore.js';

/**
 * Bootstrap utility shared by all extension entry points.
 *
 * - Applies the browser UI language to `document.documentElement.lang`
 *   so screen readers announce content in the correct locale.
 * - Populates the categories in-memory cache so sync accessors
 *   (`getRuleCategory`, `getAllCategories`) return data on first render.
 * - Mounts the given React element into the DOM node identified by `rootId`.
 *
 * @param rootId - The `id` attribute of the target DOM element (e.g. `"options-app"`).
 * @param app    - The React element to render (e.g. `<OptionsApp />`).
 */
export function mountExtensionApp(rootId: string, app: React.ReactElement): void {
  // Set document lang to match browser locale for screen readers
  try {
    const uiLang = browser.i18n.getUILanguage();
    if (uiLang) document.documentElement.lang = uiLang;
  } catch (_) { /* fallback to HTML default */ }

  const container = document.getElementById(rootId);
  if (!container) {
    logger.error(`[mountExtensionApp] DOM element #${rootId} not found. Cannot mount app.`);
    return;
  }

  const root = createRoot(container);

  // Categories are read synchronously from a module-level cache, so populate
  // it before the first render. On first install the cache may be empty until
  // the background service worker seeds it; the storage watcher inside the
  // store will refresh the cache and consumers that rely on useSettings will
  // re-render via the normal subscription path.
  initCategoriesStore()
    .catch(e => logger.error('[CATEGORIES] init failed:', e))
    .finally(() => root.render(app));
}
