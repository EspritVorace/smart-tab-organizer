/**
 * E2E tests for the extension popup.
 * Covers: toolbar buttons, profiles list, deep linking.
 */
import { test, expect } from './fixtures';
import { goToPopup, goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  createTestSession,
  createTestProfile,
} from './helpers/seed';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
});

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
test.describe('Toolbar', () => {
  test('Options button navigates to the options page [US-PO001]', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToPopup(page, extensionId);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /options/i }).click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');

    await page.close();
    await newPage.close();
  });

  test('Save button navigates to Sessions with snapshot wizard [US-PO004]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToPopup(page, extensionId);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /save/i }).click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');
    expect(newPage.url()).toContain('sessions');

    await page.close();
    await newPage.close();
  });

  test('Restore button navigates to Sessions section [US-PO001]', async ({ context, extensionId }) => {
    // Restore button is disabled when no sessions exist — seed one to enable it
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(context, [session]);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    // Wait for sessions to load so the Restore button is enabled
    await expect(page.getByRole('button', { name: /restore/i }).first()).toBeEnabled({ timeout: 5000 });

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /restore/i }).first().click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');

    await newPage.close();
  });
});

// ---------------------------------------------------------------------------
// Profiles list
// ---------------------------------------------------------------------------
test.describe('Profiles list', () => {
  test('profiles section is hidden when no profiles exist [US-PO005]', async ({ context, extensionId }) => {
    // Only snapshots, no profiles
    const snapshot = createTestSession({ name: 'Just A Snapshot' });
    await seedSessions(context, [snapshot]);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    // The profiles section label should not be visible
    await expect(page.getByText('Profiles')).not.toBeVisible();
    await page.close();
  });

  test('profiles section shows when profiles exist [US-PO005]', async ({ context, extensionId }) => {
    const profile = createTestProfile({ name: 'My Profile' });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Profiles')).toBeVisible();
    await expect(page.getByText('My Profile')).toBeVisible();
    await page.close();
  });

  test('popup shows all pinned profiles [US-PO005]', async ({ context, extensionId }) => {
    const profiles = [
      createTestProfile({ name: 'Work Profile' }),
      createTestProfile({ name: 'Personal Profile' }),
    ];
    await seedSessions(context, profiles);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Work Profile')).toBeVisible();
    await expect(page.getByText('Personal Profile')).toBeVisible();
    await page.close();
  });

  test('snapshot sessions are not shown in popup profiles list [US-PO005]', async ({
    context,
    extensionId,
  }) => {
    const snapshot = createTestSession({ name: 'Hidden Snapshot' });
    const profile = createTestProfile({ name: 'Visible Profile' });
    await seedSessions(context, [snapshot, profile]);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByText('Visible Profile')).toBeVisible();
    await expect(page.getByText('Hidden Snapshot')).not.toBeVisible();
    await page.close();
  });

  test('each profile row has a restore button [US-PO002]', async ({ context, extensionId }) => {
    const profile = createTestProfile({ name: 'Restorable Profile' });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToPopup(page, extensionId);

    // The restore split button's dropdown trigger is labeled "Restore options"
    // (unique to the profile row — the toolbar button is "Restore session")
    await expect(page.getByRole('button', { name: 'Restore options' })).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Deep linking (options page side)
// ---------------------------------------------------------------------------
test.describe('Deep linking', () => {
  test('#sessions hash shows the Sessions section [US-PO003]', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // The Sessions page title or empty state should be visible
    await expect(
      page.getByText(/sessions/i).first(),
    ).toBeVisible();
    await page.close();
  });

  test('#sessions?action=snapshot hash auto-opens the snapshot wizard [US-PO004]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html#sessions?action=snapshot`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Save Session Snapshot')).toBeVisible();
    await page.close();
  });
});
