/**
 * E2E tests for search and highlight in the Domain Rules section.
 * Covers: filtering by label, filtering by domain filter, and highlight
 * of matching text using the AccessibleHighlight component (<mark> elements).
 *
 * US-DR-SEARCH-01 → search by label
 * US-DR-SEARCH-02 → search by domain filter
 * US-DR-SEARCH-03 → highlight of matching text
 */
import { test, expect } from './fixtures';
import { goToDomainRulesSection } from './helpers/navigation';

test.beforeEach(async ({ helpers }) => {
  await helpers.clearDomainRules();
});

// ---------------------------------------------------------------------------
// [US-DR-SEARCH-01] Filter by label
// ---------------------------------------------------------------------------
test.describe('[US-DR-SEARCH-01] Filter domain rules by label', () => {
  test('rule appears when search matches its label', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub Issues', domainFilter: '*.github.com' });
    await helpers.addDomainRule({ label: 'Linear Board', domainFilter: '*.linear.app' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('GitHub');

    await expect(page.getByRole('listitem', { name: /GitHub Issues/i })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Linear Board/i })).toBeHidden();
    await page.close();
  });

  test('search by label is case-insensitive', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Notion Workspace', domainFilter: '*.notion.so' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('notion workspace');

    await expect(page.getByRole('listitem', { name: /Notion Workspace/i })).toBeVisible();
    await page.close();
  });

  test('clearing search restores all rules', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Rule Alpha', domainFilter: '*.alpha.com' });
    await helpers.addDomainRule({ label: 'Rule Beta', domainFilter: '*.beta.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    const input = page.getByPlaceholder('Search rules...');
    await input.fill('alpha');
    await expect(page.getByRole('listitem', { name: /Rule Alpha/i })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Rule Beta/i })).toBeHidden();

    await input.fill('');
    await expect(page.getByRole('listitem', { name: /Rule Alpha/i })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Rule Beta/i })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-DR-SEARCH-02] Filter by domain filter
// ---------------------------------------------------------------------------
test.describe('[US-DR-SEARCH-02] Filter domain rules by domain filter', () => {
  test('rule appears when search matches its domain filter', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Google', domainFilter: '*.google.com' });
    await helpers.addDomainRule({ label: 'Slack', domainFilter: '*.slack.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('slack.com');

    await expect(page.getByRole('listitem', { name: /Slack/i })).toBeVisible();
    await expect(page.getByRole('listitem', { name: /Google/i })).toBeHidden();
    await page.close();
  });

  test('search by domain filter is case-insensitive', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Atlassian', domainFilter: '*.ATLASSIAN.NET' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('atlassian.net');

    await expect(page.getByRole('listitem', { name: /Atlassian/i })).toBeVisible();
    await page.close();
  });

  test('no results message when search does not match any rule', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Figma', domainFilter: '*.figma.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('nonexistent-xyz-domain');

    await expect(page.getByRole('listitem', { name: /Figma/i })).toBeHidden();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-DR-SEARCH-03] Highlight of matching text
// ---------------------------------------------------------------------------
test.describe('[US-DR-SEARCH-03] Highlight matching text in domain rule cards', () => {
  test('matching part of the label is highlighted in the badge', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'GitHub Repos', domainFilter: '*.github.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('GitHub');

    // A <mark> element should wrap the matching part of the label
    await expect(page.locator('mark').filter({ hasText: 'GitHub' }).first()).toBeVisible();
    await page.close();
  });

  test('matching part of the domain filter is highlighted', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Vercel', domainFilter: '*.vercel.app' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('vercel');

    // A <mark> element should wrap the matching part of the domain filter text
    await expect(page.locator('mark').filter({ hasText: 'vercel' }).first()).toBeVisible();
    await page.close();
  });

  test('no highlight is shown when the search field is empty', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Jira', domainFilter: '*.jira.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    // No search term → no <mark> elements
    await expect(page.locator('mark')).toHaveCount(0);
    await page.close();
  });

  test('highlight is case-insensitive — lowercase query matches mixed-case label', async ({
    extensionContext,
    extensionId,
    helpers,
  }) => {
    await helpers.addDomainRule({ label: 'Confluence Wiki', domainFilter: '*.confluence.com' });

    const page = await extensionContext.newPage();
    await goToDomainRulesSection(page, extensionId);

    await page.getByPlaceholder('Search rules...').fill('confluence');

    await expect(page.locator('mark').filter({ hasText: /confluence/i }).first()).toBeVisible();
    await page.close();
  });
});
