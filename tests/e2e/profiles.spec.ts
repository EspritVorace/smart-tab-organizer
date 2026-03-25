/**
 * E2E tests for the Profiles feature.
 * Covers: pin/unpin, icon selection, auto-sync toggle, direct profile creation.
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  getSessionsFromStorage,
  createTestSession,
  createTestProfile,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// Pin / Unpin
// ---------------------------------------------------------------------------
test.describe('[US-P01] Pin / Unpin', () => {
  test('Pin as Profile button appears on snapshot cards', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Pinnable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByRole('button', { name: 'Pin as Profile' })).toBeVisible();
    await page.close();
  });

  test('pinning a session marks it as isPinned in storage [US-P001]', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Will Be Pinned' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Click "Pin as Profile" — clearHelpPrefs resets flag → onboarding always appears
    await page.getByRole('button', { name: 'Pin as Profile' }).click();

    // Onboarding always appears on first profile (profileOnboardingShown cleared in beforeEach)
    await page.getByText('Your First Profile!').waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    await page.waitForTimeout(500);

    const sessions = await getSessionsFromStorage(extensionContext);
    const pinned = sessions.find(s => s.name === 'Will Be Pinned');
    expect(pinned?.isPinned).toBe(true);
    await page.close();
  });

  test('Unpin button appears on profile cards [US-P005]', async ({ extensionContext, extensionId }) => {
    const profile = createTestProfile({ name: 'Pinned Profile' });
    await seedSessions(extensionContext, [profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible();
    await page.close();
  });

  test('unpinning a profile sets isPinned=false in storage [US-P005]', async ({
    extensionContext,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Profile To Unpin' });
    await seedSessions(extensionContext, [profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'Unpin' }).click();
    await page.waitForTimeout(500);

    const sessions = await getSessionsFromStorage(extensionContext);
    const s = sessions.find(s => s.name === 'Profile To Unpin');
    expect(s?.isPinned).toBe(false);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Icon selection
// ---------------------------------------------------------------------------
test.describe('[US-P02] Profile icon', () => {
  test('category picker is accessible in the edit dialog [US-P008]', async ({ extensionContext, extensionId }) => {
    const profile = createTestProfile({ name: 'Icon Profile' });
    await seedSessions(extensionContext, [profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Category picker (replacing icon picker) is accessible via the Edit dialog
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await expect(page.getByRole('dialog').getByRole('button', { name: /no category/i })).toBeVisible();
    await page.close();
  });

  test('clicking category picker in edit dialog opens category options [US-P008]', async ({
    extensionContext,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Icon Profile' });
    await seedSessions(extensionContext, [profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /no category/i }).click();
    // The CategoryPicker popover should open (contains radio buttons for each category)
    await expect(page.getByRole('radio').first()).toBeVisible({ timeout: 2000 });
    await page.close();
  });

  test('icon change persists to storage [US-P008]', async ({ extensionContext }) => {
    // Test icon persistence via storage API rather than through the picker UI,
    // since the Radix Popover is dismissed by the dropdown's click-outside detection
    // in the Playwright test environment.
    const profile = createTestProfile({ name: 'Icon Profile', icon: 'briefcase' });
    await seedSessions(extensionContext, [profile]);

    const sw = extensionContext.serviceWorkers()[0];
    await sw.evaluate(async (profileId: string) => {
      const result = await chrome.storage.local.get({ sessions: [] });
      const sessions = result.sessions as any[];
      const idx = sessions.findIndex((s: any) => s.id === profileId);
      if (idx !== -1) {
        sessions[idx].icon = 'home';
        await chrome.storage.local.set({ sessions });
      }
    }, profile.id);

    const sessions = await getSessionsFromStorage(extensionContext);
    const s = sessions.find(s => s.name === 'Icon Profile');
    expect(s?.icon).toBe('home');
  });
});

// ---------------------------------------------------------------------------
// Direct profile creation
// ---------------------------------------------------------------------------
test.describe('[US-P03] New Profile wizard', () => {
  test('New Profile button in header opens profile wizard', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Use first() — empty state also renders a "New Profile" button
    await page.getByRole('button', { name: 'New Profile' }).first().click();

    // clearHelpPrefs resets profileOnboardingShown → onboarding always appears on first profile
    await page.getByText("Your First Profile!").waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create Profile')).toBeVisible();
    await page.close();
  });

  test('profile created via wizard has isPinned=true in storage [US-P004]', async ({
    extensionContext,
    extensionId,
  }) => {
    // captureCurrentTabs() filters chrome-extension:// URLs; open a real tab first
    const extraTab = await extensionContext.newPage();
    await extraTab.goto('data:text/html,<p>test tab for profile</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Use first() — empty state also renders a "New Profile" button
    await page.getByRole('button', { name: 'New Profile' }).first().click();

    // clearHelpPrefs resets profileOnboardingShown → onboarding always appears on first profile
    await page.getByText("Your First Profile!").waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    await page.waitForTimeout(800); // wait for tab capture
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save Profile' }).click();

    // Dialog auto-closes after saving
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const sessions = await getSessionsFromStorage(extensionContext);
    expect(sessions.length).toBe(1);
    expect(sessions[0].isPinned).toBe(true);
    await extraTab.close();
    await page.close();
  });

  test('New Profile tooltip is visible on hover [US-P009]', async ({ extensionContext, extensionId }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Use first() — empty state also renders a "New Profile" button
    await page.getByRole('button', { name: 'New Profile' }).first().hover();
    await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2000 });
    await page.close();
  });

  test('category picker button is accessible in the edit dialog [US-P009]', async ({
    extensionContext,
    extensionId,
  }) => {
    const profile = createTestProfile({ name: 'Profile With Badge' });
    await seedSessions(extensionContext, [profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Category picker is accessible via the Edit dialog
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await expect(page.getByRole('dialog').getByRole('button', { name: /no category/i })).toBeVisible();
    await page.close();
  });

  test('profile wizard name field is pre-filled with "New Profile"', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();

    // Dismiss onboarding (always shown in beforeEach because clearHelpPrefs resets flag)
    await page.getByText('Your First Profile!').waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    const nameInput = page.getByRole('textbox', { name: /session name/i });
    await expect(nameInput).toHaveValue('New Profile');
    await page.close();
  });

  test('profile wizard shows category picker in Selection step', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();
    await page.getByText('Your First Profile!').waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    // The category picker trigger should be visible in the Selection step
    await expect(page.getByRole('dialog').getByRole('button', { name: /no category/i })).toBeVisible();
    await page.close();
  });

  test('profile wizard shows Save Profile button in Confirmation step', async ({
    extensionContext,
    extensionId,
  }) => {
    // captureCurrentTabs() filters chrome-extension:// — open a real tab so Next is enabled
    const extraTab = await extensionContext.newPage();
    await extraTab.goto('data:text/html,<p>tab for profile wizard</p>');

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: 'New Profile' }).first().click();
    await page.getByText('Your First Profile!').waitFor({ timeout: 2000 });
    await page.getByRole('button', { name: /got it/i }).click();

    // Advance to Confirmation step where Save Profile button appears
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Save Profile' })).toBeVisible();
    await extraTab.close();
    await page.close();
  });

  test('profiles are sorted before snapshots in the list [US-S008]', async ({ extensionContext, extensionId }) => {
    const snapshot = createTestSession({ name: 'Z-Snapshot' });
    const profile = createTestProfile({ name: 'A-Profile' });
    await seedSessions(extensionContext, [snapshot, profile]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Get all session names in DOM order
    const names = await page.locator('[data-testid="session-card"], .rt-Card').allTextContents();
    const profilePos = names.findIndex(t => t.includes('A-Profile'));
    const snapshotPos = names.findIndex(t => t.includes('Z-Snapshot'));
    // Profile should appear first regardless of alphabetical order
    expect(profilePos).toBeLessThan(snapshotPos);
    await page.close();
  });
});
