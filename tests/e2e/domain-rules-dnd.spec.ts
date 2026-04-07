/**
 * E2E tests for drag-and-drop reordering of domain rules.
 * Covers: reorder via drag, drag handle disabled during search.
 */
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';

test.beforeEach(async ({ helpers }) => {
  await helpers.clearDomainRules();
});

async function getDomainRuleLabels(helpers: any): Promise<string[]> {
  const settings = await helpers.getSettings();
  return (settings.domainRules as any[]).map((r: any) => r.label);
}

// ---------------------------------------------------------------------------
// Drag-and-drop reordering
// ---------------------------------------------------------------------------
test.describe('Drag-and-drop reordering', () => {
  test('dragging a rule card reorders the list in storage', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });
    await helpers.addDomainRule({ label: 'Rule C', domainFilter: 'c.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Find drag handles for Rule A (first) and Rule C (last)
    const ruleARow = page.getByRole('row', { name: /Rule A/i });
    const ruleCRow = page.getByRole('row', { name: /Rule C/i });

    const ruleAHandle = ruleARow.locator('[data-testid$="-drag-handle"]');
    const ruleCHandle = ruleCRow.locator('[data-testid$="-drag-handle"]');

    // Drag Rule A (index 0) to Rule C position (index 2)
    await ruleAHandle.dragTo(ruleCHandle);
    await page.waitForTimeout(500);
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    // Rule A should now be after Rule B and Rule C
    const ruleAIdx = labels.indexOf('Rule A');
    const ruleBIdx = labels.indexOf('Rule B');
    expect(ruleAIdx).toBeGreaterThan(ruleBIdx);
  });

  test('drag handle has aria-disabled="true" when search is active', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: 'github.com' });
    await helpers.addDomainRule({ label: 'GitLab', domainFilter: 'gitlab.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Type in the search box to activate a filter
    await page.getByTestId('page-rules-search').fill('git');
    await page.waitForTimeout(200);

    // All visible rule drag handles should be aria-disabled
    const dragHandles = page.locator('[data-testid$="-drag-handle"]');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(dragHandles.nth(i)).toHaveAttribute('aria-disabled', 'true');
    }

    await page.close();
  });

  test('drag handle does not have aria-disabled when no search filter', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: 'github.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const dragHandle = page.locator('[data-testid$="-drag-handle"]').first();
    await expect(dragHandle).not.toHaveAttribute('aria-disabled', 'true');

    await page.close();
  });
});
