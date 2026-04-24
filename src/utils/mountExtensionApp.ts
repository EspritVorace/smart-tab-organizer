import React from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { logger } from './logger.js';

/**
 * Bootstrap utility shared by all extension entry points.
 *
 * - Applies the browser UI language to `document.documentElement.lang`
 *   so screen readers announce content in the correct locale.
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
  root.render(app);
}
