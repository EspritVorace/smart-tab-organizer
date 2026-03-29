/**
 * E2E tests for deep search in the Sessions section.
 * Covers: search by tab title, tab URL, group title;
 * preview auto-expand behaviour; group expansion behaviour.
 *
 * US-S-SEARCH-01 → search by tab title
 * US-S-SEARCH-02 → search by tab URL
 * US-S-SEARCH-03 → search by group title
 * US-S-SEARCH-04 → name-only match keeps preview closed
 * US-S-SEARCH-05 → forced-open preview can be manually closed
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  createTestSession,
} from './helpers/seed';
import type { TestSession } from './helpers/seed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** Session whose name does NOT match the search but whose ungrouped tab title does. */
function sessionWithUngroupedTab(tabTitle: string, tabUrl: string): TestSession {
  return {
    id: uuid(),
    name: 'Generic Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [],
    ungroupedTabs: [{ id: uuid(), title: tabTitle, url: tabUrl }],
    isPinned: false,
  };
}

/** Session whose name does NOT match the search but which contains a group with matching tabs. */
function sessionWithGroup(
  groupTitle: string,
  tabTitle: string,
  tabUrl: string,
): TestSession {
  return {
    id: uuid(),
    name: 'Generic Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [
      {
        id: uuid(),
        title: groupTitle,
        color: 'blue',
        tabs: [{ id: uuid(), title: tabTitle, url: tabUrl }],
      },
    ],
    ungroupedTabs: [],
    isPinned: false,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-01] Search by tab title
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-01] Search by ungrouped tab title', () => {
  test('session appears when search matches an ungrouped tab title', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('Stack Overflow Discussion', 'https://stackoverflow.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('Stack Overflow');
    await expect(page.getByText('Generic Session', { exact: true })).toBeVisible();
    await page.close();
  });

  test('session is hidden when search does not match its name nor any tab', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('GitHub Issues', 'https://github.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('stackoverflow');
    await expect(page.getByText('No sessions found')).toBeVisible();
    await page.close();
  });

  test('preview is automatically opened when search matches an ungrouped tab title', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('React Documentation', 'https://react.dev');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('React Documentation');

    // The tab title should be visible in the expanded preview tree
    await expect(page.getByText('React Documentation').first()).toBeVisible();
    // react.dev domain should appear in the preview
    await expect(page.getByText('react.dev')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-02] Search by tab URL
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-02] Search by tab URL', () => {
  test('session appears when search matches part of an ungrouped tab URL', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('Homepage', 'https://my-internal-tool.company.com/dashboard');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('internal-tool');
    await expect(page.getByText('Generic Session', { exact: true })).toBeVisible();
    await page.close();
  });

  test('preview is automatically opened when search matches a tab URL', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('Dashboard', 'https://my-special-domain.example.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('special-domain');

    // The tab title should be visible in the expanded preview
    await expect(page.getByText('Dashboard').first()).toBeVisible();
    await page.close();
  });

  test('search by URL is case-insensitive', async ({ extensionContext, extensionId }) => {
    const session = sessionWithUngroupedTab('Page', 'https://EXAMPLE.COM/some/path');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('example.com');
    await expect(page.getByText('Generic Session', { exact: true })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-03] Search by group title
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-03] Search by group title', () => {
  test('session appears when search matches a group title', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithGroup('Frontend Development', 'React Docs', 'https://react.dev');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('Frontend Development');
    await expect(page.getByText('Generic Session', { exact: true })).toBeVisible();
    await page.close();
  });

  test('preview is automatically opened when search matches a group title', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithGroup('Backend APIs', 'API Docs', 'https://api.example.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('Backend APIs');

    // The group title should be visible in the expanded preview tree
    await expect(page.getByText('Backend APIs').first()).toBeVisible();
    await page.close();
  });

  test('matching group is expanded in the preview; non-matching group is collapsed', async ({
    extensionContext,
    extensionId,
  }) => {
    const session: TestSession = {
      id: uuid(),
      name: 'Multi-Group Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groups: [
        {
          id: uuid(),
          title: 'Work Tools',
          color: 'blue',
          tabs: [{ id: uuid(), title: 'Jira Board', url: 'https://jira.example.com' }],
        },
        {
          id: uuid(),
          title: 'Personal',
          color: 'green',
          tabs: [{ id: uuid(), title: 'News', url: 'https://news.example.com' }],
        },
      ],
      ungroupedTabs: [],
      isPinned: false,
    };
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Search matches only the 'Work Tools' group (via the tab URL containing 'jira')
    await page.getByPlaceholder('Search sessions...').fill('Jira');

    // Jira tab should be visible (Work Tools group is expanded)
    // Use regex because 'Jira' is highlighted, splitting the text in the DOM
    await expect(page.getByText(/Jira.*Board/)).toBeVisible();
    // News tab should NOT be visible (Personal group is collapsed)
    await expect(page.getByText('News')).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-04] Name-only match: preview stays closed
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-04] Name-only match keeps preview closed', () => {
  test('session card preview is not expanded when only the name matches', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'My Work Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('My Work Session');

    // Session is visible — no { exact: true } because the fully-highlighted name
    // gets sr-only text injected: "highlight startMy Work Sessionhighlight end"
    await expect(page.getByText('My Work Session')).toBeVisible();

    // Preview should NOT be open: the tab title inside the group ('Example') should not be visible
    await expect(page.getByText('Example')).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-05] Forced-open preview can be manually closed
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-05] Forced-open preview is user-closeable', () => {
  test('user can manually close a preview that was forced open by search', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('GitHub Repository', 'https://github.com/my/repo');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('github');

    // Preview should be auto-open: tab title visible
    // Use regex because 'GitHub' is highlighted, splitting the DOM text node
    await expect(page.getByText(/GitHub.*Repository/)).toBeVisible();

    // Click the collapsible trigger (tab count summary row) to close the preview
    // The trigger contains the tab/group count summary text
    await page.getByText(/1 tab/i).click();

    // Tab title should no longer be visible in the preview
    await expect(page.getByText(/GitHub.*Repository/)).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-SEARCH-06] Highlight matching text in session cards
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH-06] Highlight matching text in session cards', () => {
  test('session name is highlighted when the search term matches it', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'React Project' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('React');

    // A <mark> element wrapping the matched portion of the session name
    await expect(page.locator('mark').filter({ hasText: 'React' }).first()).toBeVisible();
    await page.close();
  });

  test('tab title is highlighted when the search term matches it', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('TypeScript Handbook', 'https://typescriptlang.org');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('TypeScript');

    // Preview is auto-opened; the matched part of the tab title should be in a <mark>
    await expect(page.locator('mark').filter({ hasText: 'TypeScript' }).first()).toBeVisible();
    await page.close();
  });

  test('tab domain is highlighted when the search term matches it', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithUngroupedTab('Home', 'https://my-unique-domain.example.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('my-unique-domain');

    // The domain extracted from the URL should appear highlighted
    await expect(page.locator('mark').filter({ hasText: 'my-unique-domain' }).first()).toBeVisible();
    await page.close();
  });

  test('group title is highlighted when the search term matches it', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithGroup('Backend APIs', 'API Reference', 'https://api.example.com');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('Backend');

    // Preview auto-opens; the matched part of the group title should be in a <mark>
    await expect(page.locator('mark').filter({ hasText: 'Backend' }).first()).toBeVisible();
    await page.close();
  });

  test('no highlight is shown when the search field is empty', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'My Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // No search term → no <mark> elements in the session list
    await expect(page.locator('mark')).toHaveCount(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Cross-session: only matching sessions are shown
// ---------------------------------------------------------------------------
test.describe('[US-S-SEARCH] Cross-session filtering', () => {
  test('only sessions with matching tabs or name are shown', async ({
    extensionContext,
    extensionId,
  }) => {
    const matchingByTab = sessionWithUngroupedTab('Rust Programming', 'https://rust-lang.org');
    const matchingByName: TestSession = {
      ...createTestSession({ name: 'Rust Project Notes' }),
      ungroupedTabs: [{ id: uuid(), title: 'Unrelated', url: 'https://unrelated.com' }],
      groups: [],
    };
    const nonMatching = sessionWithUngroupedTab('Python Tutorial', 'https://python.org');
    await seedSessions(extensionContext, [matchingByTab, matchingByName, nonMatching]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('rust');

    // Both matching sessions visible
    // 'Generic Session' is not highlighted (doesn't contain 'rust'), so exact match works
    await expect(page.getByText('Generic Session', { exact: true })).toBeVisible();
    // 'Rust' is highlighted in 'Rust Project Notes', splitting the DOM text node — use regex
    await expect(page.getByText(/Rust.*Project Notes/)).toBeVisible();
    // Non-matching session hidden
    await expect(page.getByText('Python Tutorial')).not.toBeVisible();
    await page.close();
  });

  test('clearing the search restores all sessions', async ({
    extensionContext,
    extensionId,
  }) => {
    const sessions = [
      createTestSession({ name: 'Session Alpha' }),
      createTestSession({ name: 'Session Beta' }),
    ];
    await seedSessions(extensionContext, sessions);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const input = page.getByPlaceholder('Search sessions...');
    await input.fill('alpha');
    // 'Alpha' is highlighted in 'Session Alpha', splitting the DOM — use regex
    await expect(page.getByText(/Session.*Alpha/)).toBeVisible();
    await expect(page.getByText('Session Beta', { exact: true })).not.toBeVisible();

    // Clear the search — no highlighting, both names are plain text again
    await input.fill('');
    await expect(page.getByText('Session Alpha', { exact: true })).toBeVisible();
    await expect(page.getByText('Session Beta', { exact: true })).toBeVisible();
    await page.close();
  });
});
