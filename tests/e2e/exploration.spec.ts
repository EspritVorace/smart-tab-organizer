/**
 * E2E tests for the Exploration catalogue page (US-A004/6/16/17).
 * Covers: navigation, coverage summary + filters, reversible manual marking
 * with persistence, the not-possible state and its prerequisite display, and
 * a prerequisite unblocking a dependent live.
 */
import { test, expect } from './fixtures';
import { goToExplorationSection } from './helpers/navigation';
import { auditPage } from './helpers/a11y';
import { CATALOG } from '../../src/exploration/catalog';
import { reviewPromptThreshold } from '../../src/exploration/coverage';

/** Every catalogue id belonging to the grouping domain (the first domain). */
const GROUPING_IDS = CATALOG.filter((e) => e.domain === 'grouping').map((e) => e.id);

/** Resets the global exploration progress so each test starts from an empty catalogue. */
async function resetExploration(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async () => {
    await chrome.storage.local.remove(['explorationProgress', 'explorationFilter']);
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('page-exploration').waitFor({ state: 'visible', timeout: 10_000 });
}

test.describe('[US-A004] Exploration page renders', () => {
  test('shows coverage summary, filters and domain groups', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    await expect(page.getByTestId('exploration-coverage-summary')).toBeVisible();
    await expect(page.getByTestId('exploration-filter')).toBeVisible();
    await expect(page.getByTestId('exploration-domain-grouping')).toBeVisible();

    await auditPage(page, 'exploration-page-loaded');
    await page.close();
  });
});

test.describe('[US-A009] Touchpoint discovery', () => {
  /**
   * Expand the "sessions" domain group, collapsed by default on a fresh
   * catalogue (the seed only opens the first incomplete domain, "grouping").
   * Its rows are unmounted while collapsed, so they must be revealed before
   * any interaction. Conditional-free to satisfy `playwright/no-conditional-in-test`.
   */
  async function expandSessionsDomain(page: import('@playwright/test').Page): Promise<void> {
    const header = page.getByTestId('exploration-domain-sessions').getByRole('button').first();
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'true');
  }

  test('opening the snapshot wizard marks sessions.snapshot discovered (no save needed)', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    // The snapshot capability lives in the (collapsed) "sessions" domain group.
    await expandSessionsDomain(page);
    // Not discovered yet: the row exposes the manual-mark toggle, no static badge.
    await expect(page.getByTestId('exploration-mark-sessions.snapshot')).toBeVisible();

    // Open the wizard from the catalogue, then cancel WITHOUT saving.
    await page.getByTestId('exploration-goto-sessions.snapshot').click();
    await expect(page.getByTestId('wizard-snapshot')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('wizard-snapshot-btn-cancel').click();
    await expect(page.getByTestId('wizard-snapshot')).toBeHidden({ timeout: 5_000 });

    // Back to the catalogue: the capability is now auto-discovered (static green
    // badge, no more mark toggle), even though no session was created.
    await page.getByTestId('sidebar-nav-item-exploration').click();
    await expect(page.getByTestId('page-exploration')).toBeVisible();
    await expandSessionsDomain(page);
    await expect(page.getByTestId('exploration-badge-sessions.snapshot')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('exploration-mark-sessions.snapshot')).toHaveCount(0);

    await page.close();
  });
});

test.describe('[US-A017] Reversible manual marking', () => {
  test('marks a to-discover entry, unmarks it, and persists across reload', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    const markButton = page.getByTestId('exploration-mark-grouping.create');
    await expect(markButton).toHaveAttribute('aria-pressed', 'false');

    await markButton.click();
    await expect(markButton).toHaveAttribute('aria-pressed', 'true');

    // Persists across reload.
    await page.reload();
    await page.getByTestId('page-exploration').waitFor({ state: 'visible' });
    await expect(page.getByTestId('exploration-mark-grouping.create')).toHaveAttribute('aria-pressed', 'true');

    // Unmark.
    await page.getByTestId('exploration-mark-grouping.create').click();
    await expect(page.getByTestId('exploration-mark-grouping.create')).toHaveAttribute('aria-pressed', 'false');

    await page.close();
  });
});

test.describe('[US-A016] Prerequisites', () => {
  test('a not-possible entry is static and shows its missing prerequisite', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    // grouping.edit requires grouping.create OR packs.apply -> not possible at start.
    await expect(page.getByTestId('exploration-prereq-grouping.edit')).toBeVisible();
    await expect(page.getByTestId('exploration-badge-grouping.edit')).toBeVisible();
    await expect(page.getByTestId('exploration-mark-grouping.edit')).toHaveCount(0);

    await page.close();
  });

  test('marking a prerequisite flips its dependent to to-discover without reload', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    // Initially grouping.edit has no mark button (not possible).
    await expect(page.getByTestId('exploration-mark-grouping.edit')).toHaveCount(0);

    // Manually mark the prerequisite grouping.create.
    await page.getByTestId('exploration-mark-grouping.create').click();

    // grouping.edit becomes to-discover -> its mark toggle appears, no reload.
    await expect(page.getByTestId('exploration-mark-grouping.edit')).toBeVisible();
    await expect(page.getByTestId('exploration-mark-grouping.edit')).toHaveAttribute('aria-pressed', 'false');

    await page.close();
  });
});

test.describe('[US-A006] Filters', () => {
  test('the four filters switch the visible set', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    // Switch to "Not possible": grouping.edit (not possible) shows, grouping.create hides.
    await page.getByTestId('exploration-filter').getByRole('radio', { name: /not possible|pas possible|no posible/i }).click();
    await expect(page.getByTestId('exploration-row-grouping.edit')).toBeVisible();
    await expect(page.getByTestId('exploration-row-grouping.create')).toHaveCount(0);

    await page.close();
  });
});

test.describe('Default expanded group', () => {
  /** The collapsible toggle button of a domain group (carries aria-expanded). */
  const groupExpanded = (page: import('@playwright/test').Page, domain: string) =>
    page.getByTestId(`exploration-domain-${domain}`).getByRole('button').first();

  test('opens the first domain on an empty catalogue', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);
    await resetExploration(page);

    // Nothing discovered yet: the first domain (grouping) is the first incomplete one.
    await expect(groupExpanded(page, 'grouping')).toHaveAttribute('aria-expanded', 'true');
    await expect(groupExpanded(page, 'dedup')).toHaveAttribute('aria-expanded', 'false');

    await page.close();
  });

  test('collapses a fully completed domain and opens the next incomplete one', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);

    // Mark every grouping capability discovered, then reload so the page seeds
    // the open group from the loaded progress.
    await page.evaluate((ids) => {
      return chrome.storage.local.set({
        explorationProgress: { discovered: ids, manuallyMarked: [], values: {}, initializedAt: Date.now() },
      });
    }, GROUPING_IDS);
    await page.reload();
    await page.getByTestId('page-exploration').waitFor({ state: 'visible', timeout: 10_000 });

    // grouping is now complete -> collapsed; dedup is the first incomplete -> open.
    await expect(groupExpanded(page, 'grouping')).toHaveAttribute('aria-expanded', 'false');
    await expect(groupExpanded(page, 'dedup')).toHaveAttribute('aria-expanded', 'true');

    await page.close();
  });
});

test.describe('Review prompt at the Maîtrise milestone', () => {
  // Coverage count past which the prompt becomes eligible ("maîtrise + 1
  // capacité"). Derived, not hardcoded, so it tracks the catalogue size.
  const THRESHOLD = reviewPromptThreshold();

  // Capabilities the options/#exploration view auto-marks on mount:
  // 'nav.sidebarSections' (options.tsx) and 'stats.exploration' (ExplorationPage).
  // Seeding them makes those marks idempotent, so the discovered count stays
  // exactly what the test asks for (otherwise they would bump it over the seuil).
  const AUTO_MARKED_ON_MOUNT = ['nav.sidebarSections', 'stats.exploration'];

  /** Exactly `count` discovered ids, always including the mount-marked ones. */
  function pick(count: number): string[] {
    const ids = new Set<string>(AUTO_MARKED_ON_MOUNT);
    for (const entry of CATALOG) {
      if (ids.size >= count) break;
      ids.add(entry.id);
    }
    return [...ids];
  }

  /**
   * Seeds the global exploration progress (and the dismissed flag) then reloads.
   * The worker context shares storage across tests, so each test sets the
   * dismissed flag explicitly to stay independent of execution order.
   */
  async function seedExploration(
    page: import('@playwright/test').Page,
    discovered: string[],
    dismissed = false,
  ): Promise<void> {
    await page.evaluate(
      ({ ids, d }) =>
        chrome.storage.local.set({
          explorationProgress: { discovered: ids, manuallyMarked: [], values: {}, initializedAt: Date.now() },
          explorationReviewDismissed: d,
        }),
      { ids: discovered, d: dismissed },
    );
    await page.reload();
    await page.getByTestId('page-exploration').waitFor({ state: 'visible', timeout: 10_000 });
  }

  test('stays hidden upon entering Maîtrise but before the extra capability', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);

    // THRESHOLD - 1 discoveries already sit in the Maîtrise phase (>=60%) but
    // do not yet meet the "+1 capability" rule, so the prompt must not show.
    await seedExploration(page, pick(THRESHOLD - 1));

    await expect(page.getByTestId('exploration-coverage-summary')).toBeVisible();
    await expect(page.getByTestId('exploration-review-prompt')).toHaveCount(0);

    await page.close();
  });

  test('appears at the milestone and links to the store reviews page', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);

    await seedExploration(page, pick(THRESHOLD));

    await expect(page.getByTestId('exploration-review-prompt')).toBeVisible();

    const link = page.getByTestId('exploration-review-link');
    // Chrome MV3 build -> Chrome Web Store reviews deep link, opened in a new tab.
    await expect(link).toHaveAttribute('href', /chromewebstore\.google\.com\/.+\/reviews/);
    await expect(link).toHaveAttribute('target', '_blank');

    await auditPage(page, 'exploration-review-visible');
    await page.close();
  });

  test('dismissing it with "don\'t remind me again" hides it and persists across reload', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToExplorationSection(page, extensionId);

    await seedExploration(page, pick(THRESHOLD));
    await expect(page.getByTestId('exploration-review-prompt')).toBeVisible();

    await page.getByTestId('exploration-review-dismiss').click();
    await expect(page.getByTestId('exploration-review-prompt')).toHaveCount(0);

    // The choice persists: still hidden after a reload.
    await page.reload();
    await page.getByTestId('page-exploration').waitFor({ state: 'visible', timeout: 10_000 });
    await expect(page.getByTestId('exploration-review-prompt')).toHaveCount(0);

    // And the flag is stored.
    const flag = await page.evaluate(() => chrome.storage.local.get('explorationReviewDismissed'));
    expect(flag.explorationReviewDismissed).toBe(true);

    await page.close();
  });
});
