import { browser } from 'wxt/browser';

export interface ShortcutsCustomizeInfo {
  /** URL the user can navigate to in order to customize extension shortcuts. */
  url: string;
  /**
   * True when the URL points directly to the shortcuts page (Chromium).
   * False when the URL only opens the addons page and the user must drill
   * down (Firefox: gear menu -> Manage Extension Shortcuts).
   */
  isDirect: boolean;
}

/**
 * Cross-browser address of the keyboard-shortcuts customization screen.
 *
 * Chromium-based browsers (Chrome, Edge, Brave, Opera) all expose a direct
 * page at `chrome://extensions/shortcuts`. Firefox only has `about:addons`,
 * from which the user opens the gear menu to access shortcut customization.
 */
export function getShortcutsCustomizeInfo(): ShortcutsCustomizeInfo {
  if (import.meta.env.FIREFOX) {
    return { url: 'about:addons', isDirect: false };
  }
  return { url: 'chrome://extensions/shortcuts', isDirect: true };
}

/**
 * Open the shortcuts customization page in a new tab. On Firefox this opens
 * `about:addons` since `about:` URLs other than the addons page are blocked
 * for extensions. The caller may want to display the manual hint anyway.
 */
export async function openShortcutsCustomizePage(): Promise<void> {
  const { url } = getShortcutsCustomizeInfo();
  await browser.tabs.create({ url });
}

/**
 * Cross-browser deep link to the extension's store reviews page, so the user
 * can leave a rating. Chromium stores expose a `/reviews` sub-route; Firefox
 * Add-ons uses a `reviews/` path.
 */
export function getStoreReviewUrl(): string {
  if (import.meta.env.FIREFOX) {
    return 'https://addons.mozilla.org/firefox/addon/smarttab-organizer/reviews/';
  }
  return 'https://chromewebstore.google.com/detail/smarttab-organizer/ijnpdkkcbmfikocmboibffjgbohhlmah/reviews';
}
