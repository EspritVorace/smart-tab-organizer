import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { logger } from './logger.js';

/**
 * Container augmented with the React root we created for it. Reusing the root
 * across an HMR re-execution of an entrypoint avoids mounting a second
 * parallel React tree on the same node, which would leave the first tree's
 * document-level listeners attached and fire every keyboard shortcut twice
 * (or more, after further hot reloads). No effect in production: each
 * entrypoint mounts exactly once.
 */
type RootContainer = HTMLElement & { __extReactRoot?: Root };

/**
 * Bootstrap utility shared by all extension entry points.
 *
 * - Applies the browser UI language to `document.documentElement.lang`
 *   so screen readers announce content in the correct locale.
 * - Mounts the given React element into the DOM node identified by `rootId`.
 *
 * Categories are read-only constants loaded synchronously into a module-level
 * cache (see `categoriesStore.ts`), so no async initialization is needed before
 * the first render.
 *
 * @param rootId - The `id` attribute of the target DOM element (e.g. `"options-app"`).
 * @param app    - The React element to render (e.g. `<OptionsApp />`).
 */
export function mountExtensionApp(rootId: string, app: React.ReactNode): void {
  // Set document lang to match browser locale for screen readers
  try {
    const uiLang = browser.i18n.getUILanguage();
    if (uiLang) document.documentElement.lang = uiLang;
  } catch (err) {
    logger.debug('[mountExtensionApp] getUILanguage unavailable, falling back to HTML default lang.', err);
  }

  const container = document.getElementById(rootId) as RootContainer | null;
  if (!container) {
    logger.error(`[mountExtensionApp] DOM element #${rootId} not found. Cannot mount app.`);
    return;
  }

  const root = container.__extReactRoot ?? createRoot(container);
  container.__extReactRoot = root;
  root.render(app);
}
