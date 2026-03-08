/**
 * E2E tests for the onboarding & contextual help features (Step 4e).
 * Covers: intro callout, first-profile onboarding modal, tooltips.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  clearSessions,
  clearHelpPrefs,
  getHelpPrefsFromStorage,
  seedSessions,
  createTestProfile,
} from './helpers/seed';

test.beforeEach(async ({ context }) => {
  await clearSessions(context);
  await clearHelpPrefs(context);
});

// ---------------------------------------------------------------------------
// Intro callout
// ---------------------------------------------------------------------------
test.describe('[US-O01] Intro callout', () => {
  test('is visible on first visit (sessionsIntroHidden not set)', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('Sessions & Profiles')).toBeVisible();
    await page.close();
  });

  test('is hidden when sessionsIntroHidden=true [US-O002]', async ({ context, extensionId }) => {
    // Pre-set the pref
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(async () => {
      await chrome.storage.local.set({
        sessionsHelpPrefs: { sessionsIntroHidden: true, profileOnboardingShown: false },
      });
    });

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('Sessions & Profiles')).not.toBeVisible();
    await page.close();
  });

  test('clicking the dismiss (X) button hides the callout [US-O002]', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('Sessions & Profiles')).toBeVisible();

    // Click the close button on the callout
    await page.getByLabel('Close').click();

    await expect(page.getByText('Sessions & Profiles')).not.toBeVisible();
    await page.close();
  });

  test('dismissing persists sessionsIntroHidden=true in storage [US-O002]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByLabel('Close').click();
    await page.waitForTimeout(300);

    const prefs = await getHelpPrefsFromStorage(context);
    expect(prefs.sessionsIntroHidden).toBe(true);
    await page.close();
  });

  test('callout stays hidden after page reload when dismissed [US-O002]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByLabel('Close').click();
    await page.waitForTimeout(200);

    // Reload the page
    await goToSessionsSection(page, extensionId);

    await expect(page.getByText('Sessions & Profiles')).not.toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// First-profile onboarding dialog
// ---------------------------------------------------------------------------
test.describe('[US-O01] First-profile onboarding dialog', () => {
  test('clicking New Profile for the first time shows the onboarding dialog', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();

    await expect(page.getByText('Your First Profile!')).toBeVisible();
    await page.close();
  });

  test('onboarding dialog contains the 3-step diagram labels [US-O003]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();

    // Scope checks to the onboarding dialog to avoid matching other page content
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Open tabs', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Saved profile', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Restore', { exact: true })).toBeVisible();
    await page.close();
  });

  test('clicking Got it! closes the onboarding dialog and opens the profile wizard [US-O003]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();
    await expect(page.getByText('Your First Profile!')).toBeVisible();

    await page.getByRole('button', { name: /got it/i }).click();

    // Onboarding dialog should close
    await expect(page.getByText('Your First Profile!')).not.toBeVisible();
    // Profile wizard should open
    await expect(page.getByText('Create Profile')).toBeVisible();
    await page.close();
  });

  test('Got it! persists profileOnboardingShown=true in storage [US-O003]', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();
    await page.getByRole('button', { name: /got it/i }).click();
    await page.waitForTimeout(300);

    const prefs = await getHelpPrefsFromStorage(context);
    expect(prefs.profileOnboardingShown).toBe(true);
    await page.close();
  });

  test('second profile creation does NOT show the onboarding dialog [US-O003]', async ({
    context,
    extensionId,
  }) => {
    // Pre-set flag as already shown
    const sw = context.serviceWorkers()[0];
    await sw.evaluate(async () => {
      await chrome.storage.local.set({
        sessionsHelpPrefs: { sessionsIntroHidden: false, profileOnboardingShown: true },
      });
    });

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();

    // Onboarding should NOT appear
    await expect(page.getByText('Your First Profile!')).not.toBeVisible();
    // Profile wizard should open directly
    await expect(page.getByText('Create Profile')).toBeVisible();
    await page.close();
  });

  test('pinning a snapshot also triggers onboarding on first profile [US-O003]', async ({
    context,
    extensionId,
  }) => {
    const { createTestSession } = await import('./helpers/seed');
    const snapshot = createTestSession({ name: 'Will Be Pinned' });
    await seedSessions(context, [snapshot]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Pin as Profile' }).click();

    await expect(page.getByText('Your First Profile!')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------
test.describe('[US-O01] Tooltips', () => {
  test('New Profile button has a tooltip on hover', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // Use first() since the empty-state also renders a "New Profile" button
    await page.getByRole('button', { name: 'New Profile' }).first().hover();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2000 });
    await page.close();
  });

  test('auto-sync help icon has an accessible aria-label matching the tooltip [US-O004]', async ({
    context,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Profile With Help' });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    // HelpCircle icon button should have aria-label with the tooltip text
    await expect(
      page.getByRole('button', { name: /when enabled.*window/i }),
    ).toBeVisible();
    await page.close();
  });

  test('auto-sync help icon shows tooltip on hover [US-O004]', async ({ context, extensionId }) => {
    const profile = createTestProfile({ name: 'Profile With Tooltip' });
    await seedSessions(context, [profile]);

    const page = await context.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /when enabled.*window/i }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2000 });
    await page.close();
  });
});
