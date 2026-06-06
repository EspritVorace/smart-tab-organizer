/**
 * E2E tests for the domain rules view menu (filter / sort / group).
 * Covers: active-state indicator + reset, filter by status, filter by color,
 * group by color (group header checkbox selection), and the sort-by-domain
 * auto-grouping with drag-and-drop reordering inside a domain group.
 *
 * The menu is locale-agnostic here: every control is anchored on a stable
 * `data-testid`.
 */
import { type BrowserContext, type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';

/** The persisted per-workspace view state leaks between tests in the same
 *  worker (it lives in storage.local), so reset it to the default. */
async function resetViewState(context: BrowserContext): Promise<void> {
  const deadline = Date.now() + 5000;
  let sw = context.serviceWorkers()[0];
  while (!sw && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 100));
    sw = context.serviceWorkers()[0];
  }
  if (sw) await sw.evaluate(() => chrome.storage.local.remove('rulesViewState'));
}

test.beforeEach(async ({ extensionContext, helpers }) => {
  await helpers.clearDomainRules();
  await resetViewState(extensionContext);
});

async function getDomainRuleLabels(helpers: any): Promise<string[]> {
  const settings = await helpers.getSettings();
  return (settings.domainRules as any[]).map((r: any) => r.label);
}

/** Open the view menu and wait until its content is on screen. */
async function openViewMenu(page: Page): Promise<void> {
  await page.getByTestId('page-rules-btn-view').click();
  await expect(page.getByTestId('page-rules-view-sort-manual')).toBeVisible();
}

/** Open a filter submenu (Color / Category / Status) by its sub-trigger testid. */
async function openSubmenu(page: Page, subTriggerTestId: string): Promise<void> {
  await page.getByTestId(subTriggerTestId).click();
}

/**
 * Click a radio/checkbox menu item and wait until it reports the checked
 * state, so the underlying view-state change has definitely applied before
 * we assert on the list (avoids a menu-interaction race).
 */
async function selectMenuItem(page: Page, testId: string): Promise<void> {
  const item = page.getByTestId(testId);
  await expect(item).toBeVisible();
  await item.click();
  await expect(item).toHaveAttribute('data-state', 'checked');
}

/** Close any open menu / submenu (two Escapes cover an open submenu). */
async function closeMenus(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="menu"][data-state="open"]')).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Active-state indicator
// ---------------------------------------------------------------------------
test.describe('View menu active indicator', () => {
  test('button becomes active when an operation is applied', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const viewBtn = page.getByTestId('page-rules-btn-view');
    await expect(viewBtn).not.toHaveAttribute('data-active', 'true');

    await openViewMenu(page);
    await selectMenuItem(page, 'page-rules-view-sort-domain');
    await closeMenus(page);

    await expect(viewBtn).toHaveAttribute('data-active', 'true');

    await page.close();
  });

  test('reset clears every applied operation', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Blue One', domainFilter: 'a.com', color: 'blue' });
    await helpers.addDomainRule({ label: 'Blue Two', domainFilter: 'b.com', color: 'blue' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const viewBtn = page.getByTestId('page-rules-btn-view');

    // Apply a grouping, then reset from within the same open menu (the Reset
    // item only appears once an operation is active).
    await openViewMenu(page);
    await selectMenuItem(page, 'page-rules-view-group-color');
    await page.getByTestId('page-rules-view-reset').click();

    await expect(page.locator('[role="menu"][data-state="open"]')).toHaveCount(0);
    await expect(viewBtn).not.toHaveAttribute('data-active', 'true');
    // Grouping is gone: no group header remains.
    await expect(page.getByTestId('page-rules-group-color:blue')).toHaveCount(0);

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Filtering (display only — the stored order is untouched)
// ---------------------------------------------------------------------------
test.describe('View menu filtering', () => {
  test('filter by status shows only the matching rules without mutating storage', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Active One', domainFilter: 'a.com', enabled: true });
    await helpers.addDomainRule({ label: 'Disabled One', domainFilter: 'b.com', enabled: false });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await expect(page.getByRole('listitem')).toHaveCount(2);

    await openViewMenu(page);
    await openSubmenu(page, 'page-rules-view-sub-status');
    await selectMenuItem(page, 'page-rules-view-status-disabled');
    await closeMenus(page);

    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem', { name: /Disabled One/i })).toBeVisible();

    // Filtering is display-only: storage still holds both rules in order.
    const labels = await getDomainRuleLabels(helpers);
    expect(labels).toEqual(['Active One', 'Disabled One']);

    await page.close();
  });

  test('filter by color narrows the list', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Blue Rule', domainFilter: 'a.com', color: 'blue' });
    await helpers.addDomainRule({ label: 'Red Rule', domainFilter: 'b.com', color: 'red' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await openViewMenu(page);
    await openSubmenu(page, 'page-rules-view-sub-color');
    await selectMenuItem(page, 'page-rules-view-color-blue');
    await closeMenus(page);

    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem', { name: /Blue Rule/i })).toBeVisible();

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------
test.describe('View menu grouping', () => {
  test('group by color renders group headers and the header checkbox selects the whole group', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Blue One', domainFilter: 'a.com', color: 'blue' });
    await helpers.addDomainRule({ label: 'Blue Two', domainFilter: 'b.com', color: 'blue' });
    await helpers.addDomainRule({ label: 'Red One', domainFilter: 'c.com', color: 'red' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await openViewMenu(page);
    await selectMenuItem(page, 'page-rules-view-group-color');
    await closeMenus(page);

    const blueGroup = page.getByTestId('page-rules-group-color:blue');
    const redGroup = page.getByTestId('page-rules-group-color:red');
    await expect(blueGroup).toBeVisible();
    await expect(redGroup).toBeVisible();
    await expect(blueGroup).toContainText('2');

    // Ticking the blue group header selects its two rules and opens the bulk bar.
    await blueGroup.getByRole('checkbox').click();
    await expect(page.getByTestId('page-rules-bulk-bar')).toContainText('2');

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Sort by domain → auto-grouping + DnD inside a domain group
// ---------------------------------------------------------------------------
test.describe('View menu sort by domain', () => {
  test('auto-groups multi-rule domains, enables DnD inside the group and reorders the real order', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GH One', domainFilter: 'github.com' });
    await helpers.addDomainRule({ label: 'GH Two', domainFilter: 'docs.github.com' });
    await helpers.addDomainRule({ label: 'Solo', domainFilter: 'solo.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await openViewMenu(page);
    await selectMenuItem(page, 'page-rules-view-sort-domain');
    await closeMenus(page);

    // The two github rules form a group; the singleton stays ungrouped.
    await expect(page.getByTestId('page-rules-group-domain:github.com')).toBeVisible();

    const ghOneRow = page.getByRole('listitem', { name: /GH One/i });
    const ghTwoRow = page.getByRole('listitem', { name: /GH Two/i });
    const soloRow = page.getByRole('listitem', { name: /Solo/i });

    // DnD is enabled inside the domain group, disabled for the singleton.
    const ghOneHandle = ghOneRow.locator('[data-testid$="-drag-handle"]');
    const ghTwoHandle = ghTwoRow.locator('[data-testid$="-drag-handle"]');
    await expect(ghOneHandle).not.toHaveAttribute('aria-disabled', 'true');
    await expect(soloRow.locator('[data-testid$="-drag-handle"]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    // Drag GH One onto GH Two to reorder within the github group.
    const srcBox = await ghOneHandle.boundingBox();
    const dstBox = await ghTwoHandle.boundingBox();
    const srcX = srcBox!.x + srcBox!.width / 2;
    const srcY = srcBox!.y + srcBox!.height / 2;
    const dstX = dstBox!.x + dstBox!.width / 2;
    const dstY = dstBox!.y + dstBox!.height / 2;
    await page.mouse.move(srcX, srcY);
    await page.mouse.down();
    await page.mouse.move(dstX, dstY, { steps: 50 });
    await page.mouse.up();

    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('[role="listitem"]')];
      const i1 = rows.findIndex(r => r.getAttribute('aria-label')?.includes('GH One'));
      const i2 = rows.findIndex(r => r.getAttribute('aria-label')?.includes('GH Two'));
      return i1 > -1 && i2 > -1 && i2 < i1;
    }, { timeout: 5000 });

    await page.close();

    // The real stored order was mutated: GH Two now precedes GH One.
    const labels = await getDomainRuleLabels(helpers);
    expect(labels.indexOf('GH Two')).toBeLessThan(labels.indexOf('GH One'));
    expect(labels).toContain('Solo');
  });
});
