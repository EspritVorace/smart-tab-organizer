/**
 * E2E tests for domain rule position actions in the "…" dropdown menu.
 * Covers: Move to top, Move to bottom, First of domain, Last of domain.
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
// Move to top
// ---------------------------------------------------------------------------
test.describe('Move to top', () => {
  test('moves the last rule to the first position', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });
    await helpers.addDomainRule({ label: 'Rule C', domainFilter: 'c.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Open dropdown for Rule C (last) and click "Move to top"
    await page.getByRole('row', { name: /Rule C/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /move to top/i }).click();
    await expect(page.getByRole('row').nth(1)).toContainText('Rule C');
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    expect(labels[0]).toBe('Rule C');
    expect(labels).toContain('Rule A');
    expect(labels).toContain('Rule B');
  });

  test('is a no-op when rule is already first', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Rule A/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /move to top/i }).click();
    await expect(page.getByRole('row').nth(1)).toContainText('Rule A');
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    expect(labels[0]).toBe('Rule A');
    expect(labels[1]).toBe('Rule B');
  });
});

// ---------------------------------------------------------------------------
// Move to bottom
// ---------------------------------------------------------------------------
test.describe('Move to bottom', () => {
  test('moves the first rule to the last position', async ({ extensionContext, extensionId, helpers }) => {
    await helpers.addDomainRule({ label: 'Rule A', domainFilter: 'a.com' });
    await helpers.addDomainRule({ label: 'Rule B', domainFilter: 'b.com' });
    await helpers.addDomainRule({ label: 'Rule C', domainFilter: 'c.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Rule A/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /move to bottom/i }).click();
    await expect(page.getByRole('row').last()).toContainText('Rule A');
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    expect(labels[labels.length - 1]).toBe('Rule A');
  });
});

// ---------------------------------------------------------------------------
// First of domain / Last of domain
// ---------------------------------------------------------------------------
test.describe('First of domain / Last of domain', () => {
  test('"First of domain" moves rule before the first rule of same root domain', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    // Order: GitHub, Example, Sub.Example, GitLab
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: 'github.com' });
    await helpers.addDomainRule({ label: 'Example', domainFilter: 'example.com' });
    await helpers.addDomainRule({ label: 'Sub Example', domainFilter: 'sub.example.com' });
    await helpers.addDomainRule({ label: 'GitLab', domainFilter: 'gitlab.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Move "Sub Example" (root: example.com) to first of domain
    // "Example" (also example.com) is at index 1, so Sub Example should move before it
    await page.getByRole('row', { name: /Sub Example/i }).getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /first of domain/i }).click();
    await expect(page.getByRole('row').nth(2)).toContainText('Sub Example');
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    const subExampleIdx = labels.indexOf('Sub Example');
    const exampleIdx = labels.indexOf('Example');
    expect(subExampleIdx).toBeLessThan(exampleIdx);
    // Unrelated rules should remain
    expect(labels).toContain('GitHub');
    expect(labels).toContain('GitLab');
  });

  test('"Last of domain" moves rule after the last rule of same root domain', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Example', domainFilter: 'example.com' });
    await helpers.addDomainRule({ label: 'GitHub', domainFilter: 'github.com' });
    await helpers.addDomainRule({ label: 'Sub Example', domainFilter: 'sub.example.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // Move "Example" (root: example.com) to last of domain
    // "Sub Example" (also example.com) is at index 2, so Example should move after it
    await page.getByRole('row', { name: /Example/i }).first().getByLabel('More actions').click();
    await page.getByRole('menuitem', { name: /last of domain/i }).click();
    await expect(page.getByRole('row').last()).toContainText('Example');
    await page.close();

    const labels = await getDomainRuleLabels(helpers);
    const exampleIdx = labels.indexOf('Example');
    const subExampleIdx = labels.indexOf('Sub Example');
    expect(exampleIdx).toBeGreaterThan(subExampleIdx);
    expect(labels).toContain('GitHub');
  });

  test('"First of domain" and "Last of domain" are disabled for a unique-domain rule', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Solo', domainFilter: 'solo.com' });
    await helpers.addDomainRule({ label: 'Other', domainFilter: 'other.org' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByRole('row', { name: /Solo/i }).getByLabel('More actions').click();

    const firstOfDomainItem = page.getByRole('menuitem', { name: /first of domain/i });
    const lastOfDomainItem = page.getByRole('menuitem', { name: /last of domain/i });

    // Radix UI DropdownMenu.Item sets data-disabled="" (empty string) when disabled
    await expect(firstOfDomainItem).toHaveAttribute('data-disabled', '');
    await expect(lastOfDomainItem).toHaveAttribute('data-disabled', '');

    await page.close();
  });
});
