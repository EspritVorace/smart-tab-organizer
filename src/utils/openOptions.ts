import { browser } from 'wxt/browser';

/** Focus an existing Options tab or open a new one with the given hash. */
export async function openOptionsWithHash(hash: string): Promise<void> {
  const optionsUrl = browser.runtime.getURL('/options.html');
  const allTabs = await browser.tabs.query({});
  const existing = allTabs.find((t) => t.url?.startsWith(optionsUrl));
  const target = optionsUrl + hash;

  if (existing?.id != null) {
    await browser.tabs.update(existing.id, { url: target, active: true });
    if (existing.windowId != null) {
      await browser.windows.update(existing.windowId, { focused: true });
    }
  } else {
    await browser.tabs.create({ url: target });
  }
}
