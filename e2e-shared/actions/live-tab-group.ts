/**
 * Live-tab-group seeding helper.
 *
 * Drives `chrome.tabGroups` from the extension service worker to create a
 * real tab group in the supplied window, so the wizard's
 * `analyzeConflicts()` flags it as conflicting with a seeded session group
 * sharing the same `(title, color)`.
 *
 * Distinct from `seedSessions` (which writes to `chrome.storage.local`):
 * here we manipulate the live browser state to trigger conflict detection
 * the same way a real user would (a pre-existing group in the current
 * window). Used by the doc-scenarios `11-restore-conflicts` capture.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { waitForServiceWorker } from '../extension-id.js';

// Minimal Chrome typings consumed inside `evaluate` callbacks.
declare const chrome: {
  windows: {
    getCurrent(cb: (window: { id?: number }) => void): void;
  };
  tabs: {
    create(props: {
      url: string;
      windowId: number;
      active: boolean;
    }): Promise<{ id?: number }>;
    group(opts: { tabIds: number[] }): Promise<number>;
  };
  tabGroups: {
    update(
      groupId: number,
      props: { title: string; color: string },
    ): Promise<unknown>;
  };
};

export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

/**
 * Create a live tab group in the same window as `windowOwnerPage` so the
 * RestoreWizard's conflict analysis treats it as a conflict for any
 * seeded session group sharing the same `(title, color)`.
 */
export async function createLiveTabGroup(
  context: BrowserContext,
  windowOwnerPage: Page,
  title: string,
  color: TabGroupColor,
): Promise<void> {
  const sw = await waitForServiceWorker(context);
  const windowId = await windowOwnerPage.evaluate(
    () =>
      new Promise<number>((resolve) => {
        chrome.windows.getCurrent((w) => resolve(w.id!));
      }),
  );
  await sw.evaluate(
    async ({ wid, gtitle, gcolor }: { wid: number; gtitle: string; gcolor: string }) => {
      const tab = await chrome.tabs.create({
        url: 'about:blank',
        windowId: wid,
        active: false,
      });
      const groupId = await chrome.tabs.group({ tabIds: [tab.id!] });
      await chrome.tabGroups.update(groupId, {
        title: gtitle,
        color: gcolor,
      });
    },
    { wid: windowId, gtitle: title, gcolor: color },
  );
  await windowOwnerPage.waitForTimeout(300);
}
