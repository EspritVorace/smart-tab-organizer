/**
 * E2E tests for the Exploration catalogue page (US-A004/6/16/17).
 * Covers: navigation, coverage summary + filters, reversible manual marking
 * with persistence, the not-possible state and its prerequisite display, and
 * a prerequisite unblocking a dependent live.
 */
import { test, expect } from './fixtures';
import { goToExplorationSection } from './helpers/navigation';
import { auditPage } from './helpers/a11y';

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
