/**
 * E2E tests for keyboard-driven drag-and-drop reordering of domain rules.
 * Validates that the dnd-kit KeyboardSensor (default Space/Enter to grab,
 * arrows to move, Escape to cancel) is reachable via Tab now that the
 * drag handle is rendered as a focusable IconButton.
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

test.describe('[KBD-DND] Domain rules keyboard drag-and-drop', () => {
  test('drag handle is focusable and exposes keyboard shortcuts', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // allow-inline-dom: drag-handle is a DnD atom selector, not a dialog/wizard surface.
    const handle = page.locator('[data-testid$="-drag-handle"]').first();
    await expect(handle).toBeVisible();

    const tagName = await handle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('button');

    await expect(handle).toHaveAttribute('aria-keyshortcuts', /Space.*Enter.*Arrow/);
    await expect(handle).toHaveAttribute('aria-label', /reorder|réordonner|reordenar/i);

    await handle.focus();
    await expect(handle).toBeFocused();

    await page.close();
  });

  test('keyboard reorders rules via Space + ArrowDown + Space', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });
    await helpers.addDomainRule({ label: 'Rule C', domainFilter: 'c.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const ruleARow = page.getByRole('listitem', { name: /Rule A/i });
    const handleA = ruleARow.locator('[data-testid$="-drag-handle"]');

    await handleA.focus();
    await expect(handleA).toBeFocused();

    await page.keyboard.press('Space');

    // Wait for dnd-kit to activate the drag (card opacity changes to 0.4).
    // Without this, on slow CI the arrow presses may dispatch before the
    // KeyboardSensor activates, causing no reorder.
    // Target the Rule A card specifically by finding it via aria-label match.
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('[role="listitem"]')];
      const ruleACard = cards.find(c => c.getAttribute('aria-label')?.includes('Rule A'));
      if (!ruleACard) return false;
      const computed = window.getComputedStyle(ruleACard);
      const opacity = parseFloat(computed.opacity);
      // isDragging opacity is 0.4; we check for < 0.5 to account for rounding
      return opacity < 0.5;
    }, undefined, { timeout: 5000 });

    // The opacity flip confirms dnd-kit entered the dragging state, but its
    // KeyboardSensor attaches the keydown listener a tick later. This short grace
    // lets that listener register so the arrow presses are not dropped on slow CI.
    // eslint-disable-next-line playwright/no-wait-for-timeout -- waiting on a DnD activation race with no DOM signal to anchor on
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('[role="listitem"]')];
      const iA = rows.findIndex(r => r.getAttribute('aria-label')?.includes('Rule A'));
      const iC = rows.findIndex(r => r.getAttribute('aria-label')?.includes('Rule C'));
      return iA > -1 && iC > -1 && iA > iC;
    }, undefined, { timeout: 5000 });

    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    const idxA = labels.indexOf('Rule A');
    const idxB = labels.indexOf('Rule B');
    expect(idxA).toBeGreaterThan(idxB);
  });

  test('Escape during keyboard drag cancels the reorder', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });
    await helpers.addDomainRule({ label: 'Rule C', domainFilter: 'c.com' });

    const before = await getDomainRuleLabels(helpers);

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const handleA = page
      .getByRole('listitem', { name: /Rule A/i })
      .locator('[data-testid$="-drag-handle"]');

    await handleA.focus();
    await expect(handleA).toBeFocused();

    await page.keyboard.press('Space');

    // Wait for dnd-kit to activate the drag before sending ArrowDown, to ensure
    // the cancel via Escape actually cancels an active drag.
    // Target the Rule A card specifically by finding it via aria-label match.
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('[role="listitem"]')];
      const ruleACard = cards.find(c => c.getAttribute('aria-label')?.includes('Rule A'));
      if (!ruleACard) return false;
      const computed = window.getComputedStyle(ruleACard);
      const opacity = parseFloat(computed.opacity);
      return opacity < 0.5;
    }, undefined, { timeout: 5000 });

    // See the reorder test above: let dnd-kit's KeyboardSensor finish attaching
    // its keydown listener before the arrow press, otherwise it can be dropped.
    // eslint-disable-next-line playwright/no-wait-for-timeout -- waiting on a DnD activation race with no DOM signal to anchor on
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(handleA).toBeFocused();
    await page.close();

    const after = await getDomainRuleLabels(helpers);
    expect(after).toEqual(before);
  });

  test('drag handle is disabled and out of tab order during search', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: 'github.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByTestId('page-rules-search').fill('git');

    // allow-inline-dom: drag-handle is a DnD atom selector, not a dialog/wizard surface.
    const handle = page.locator('[data-testid$="-drag-handle"]').first();
    await expect(handle).toBeDisabled();

    await page.close();
  });
});
