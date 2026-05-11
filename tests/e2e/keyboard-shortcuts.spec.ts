/**
 * E2E tests for the keyboard shortcuts feature.
 * Covers the popup (S/R/O/?), options (Alt+1..5, /, ?), session card combos
 * (R/Shift+R/Alt+R/Alt+Shift+R) and pinned-card navigation in the popup.
 */
import { test, expect } from './fixtures';
import {
  goToPopup,
  goToOptionsPage,
  goToSessionsSection,
} from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  createTestSession,
  createPinnedSession,
} from './helpers/seed';

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
});

// ---------------------------------------------------------------------------
// Popup top-level shortcuts
// ---------------------------------------------------------------------------
test.describe('[US-KB-popup] Popup shortcuts', () => {
  test('? opens the shortcuts drawer; Escape closes it', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    // Wait for the toolbar to mount: this guarantees the popup-level
    // useShortcuts effect has run and the document keydown listener
    // is attached before we send the key.
    await expect(page.getByTestId('popup-toolbar')).toBeVisible();

    // Move focus to the popup wrapper (data-testid="popup") so the keydown
    // bubbles to document without being intercepted by an inner input.
    await page.getByTestId('popup').click({ position: { x: 5, y: 5 } });

    await page.keyboard.press('Shift+Slash'); // produces "?"

    await expect(page.getByTestId('shortcuts-drawer')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('shortcuts-content')).toBeVisible();

    // Only the 2 popup-relevant groups must be displayed (Popup, Session
    // card). Global, Options and Lists groups are hidden in the popup drawer.
    await expect(
      page.locator('[data-testid="shortcuts-content"] [data-group-id]'),
    ).toHaveCount(2);

    // Regression guard: the popup.html `.radix-themes` selector used to also
    // match the Theme that Radix Themes wraps around the portaled overlay,
    // forcing it to `height: 0; overflow: hidden`. The drawer kept its own
    // box (so toBeVisible passed) but was clipped to nothing on screen.
    // Assert the overlay actually covers a real area.
    const overlayHeight = await page
      .locator('.rt-BaseDialogOverlay')
      .evaluate((el) => (el as HTMLElement).getBoundingClientRect().height);
    expect(overlayHeight).toBeGreaterThan(100);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-drawer')).toBeHidden({
      timeout: 5000,
    });

    await page.close();
  });

  test('? toggles the shortcuts drawer (re-press closes)', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByTestId('popup-toolbar')).toBeVisible();
    await page.getByTestId('popup').click({ position: { x: 5, y: 5 } });

    await page.keyboard.press('Shift+Slash');
    await expect(page.getByTestId('shortcuts-drawer')).toBeVisible({
      timeout: 5000,
    });

    // Re-pressing ? while the drawer is focused must close it.
    await page.keyboard.press('Shift+Slash');
    await expect(page.getByTestId('shortcuts-drawer')).toBeHidden({
      timeout: 5000,
    });

    await page.close();
  });

  test('R navigates to the sessions page', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByTestId('popup-toolbar-btn-restore')).toBeEnabled({
      timeout: 5000,
    });

    await page.locator('body').click();
    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      page.keyboard.press('r'),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');
    expect(newPage.url()).toContain('sessions');

    await newPage.close();
    await page.close().catch(() => {});
  });
});

// ---------------------------------------------------------------------------
// Options shortcuts
// ---------------------------------------------------------------------------
test.describe('[US-KB-options] Options shortcuts', () => {
  test('Alt+3 switches to the Sessions sidebar tab', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);

    // Click the top-left corner so a fresh-install Home (empty rules ->
    // HeroOnboarding) does not intercept the click on its CTA button.
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    // Sidebar order is home, rules, sessions, ... so Alt+3 selects Sessions.
    await page.keyboard.press('Alt+3');

    // SessionsPage marker
    await page.getByTestId('page-sessions-btn-snapshot').waitFor({
      state: 'visible',
      timeout: 5000,
    });
    expect(page.url()).toContain('#sessions');

    await page.close();
  });

  test('Alt+digit also switches tabs on a non-US layout (where event.key is not the digit)', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);
    await page.locator('body').click({ position: { x: 5, y: 5 } });

    // page.keyboard.press always uses the US layout (event.key === event.code's
    // digit), so it cannot reproduce the AZERTY case where Alt+1 dispatches
    // event.key = "&" while event.code stays "Digit1". Synthesise the event
    // directly: what matters for the matcher is that event.key is *not* the
    // digit but event.code is the matching DigitN.
    await page.evaluate(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Digit3',
          key: 'layout-specific',
          altKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    await page.getByTestId('page-sessions-btn-snapshot').waitFor({
      state: 'visible',
      timeout: 5000,
    });
    expect(page.url()).toContain('#sessions');

    await page.close();
  });

  test('? opens the shortcuts aside (non-modal); Escape closes it; the page stays interactive', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToOptionsPage(page, extensionId);

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Shift+Slash');

    const aside = page.getByTestId('shortcuts-aside');
    await expect(aside).toHaveAttribute('data-state', 'open');
    // Non-modal: no role="dialog" on the aside
    await expect(aside).not.toHaveAttribute('role', 'dialog');

    // The page underneath remains interactive: a sidebar item still receives clicks
    // while the aside is open (no overlay swallows the event).
    await page.getByTestId('sidebar-nav-item-sessions').click();
    await expect(page.getByTestId('page-sessions-btn-snapshot')).toBeVisible({
      timeout: 5000,
    });

    await page.keyboard.press('Escape');
    await expect(aside).toHaveAttribute('data-state', 'closed');

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Shortcuts panel keyboard navigation
// ---------------------------------------------------------------------------
test.describe('[US-KB-panel] Shortcuts panel keyboard navigation', () => {
  test('drawer opens with focus on the contextual open trigger; Arrow keys roam between triggers', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    await expect(page.getByTestId('popup-toolbar')).toBeVisible();
    await page.getByTestId('popup').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Shift+Slash');

    const drawer = page.getByTestId('shortcuts-drawer');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    const triggers = drawer.locator('[data-shortcut-group-trigger]');
    await expect(triggers).toHaveCount(2);

    // Initial focus must be on a group trigger (the first open one), not the
    // close button.
    await expect(triggers.first()).toBeFocused({ timeout: 2000 });

    // ArrowDown moves focus to the next trigger.
    await page.keyboard.press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();

    // ArrowDown at the last trigger clamps (no wrap).
    await page.keyboard.press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();

    // ArrowUp goes back.
    await page.keyboard.press('ArrowUp');
    await expect(triggers.first()).toBeFocused();

    // Home / End jump to first / last.
    await page.keyboard.press('End');
    await expect(triggers.nth(1)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(triggers.first()).toBeFocused();

    await page.close();
  });

  test('aside opens with focus on the first open group trigger, not the close button', async ({
    extensionContext,
    extensionId,
  }) => {
    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.locator('body').click();
    await page.keyboard.press('Shift+Slash');

    const aside = page.getByTestId('shortcuts-aside');
    await expect(aside).toHaveAttribute('data-state', 'open');

    const firstOpenTrigger = aside
      .locator('[data-shortcut-group-trigger][data-state="open"]')
      .first();
    await expect(firstOpenTrigger).toBeFocused({ timeout: 2000 });

    // ArrowDown moves to the next trigger.
    const allTriggers = aside.locator('[data-shortcut-group-trigger]');
    await page.keyboard.press('ArrowDown');
    const movedFocus = await allTriggers.evaluateAll(
      (els) => els.findIndex((el) => el === document.activeElement),
    );
    expect(movedFocus).toBeGreaterThan(0);

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Session card restore shortcuts (the user-requested ones)
// ---------------------------------------------------------------------------
test.describe('[US-KB-sessions] SessionCard restore shortcuts', () => {
  test('ArrowDown moves focus from the first card to the next', async ({
    extensionContext,
    extensionId,
  }) => {
    const a = createPinnedSession({ name: 'Card A' });
    const b = createPinnedSession({ name: 'Card B' });
    await seedSessions(extensionContext, [a, b]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const cardA = page.getByTestId(`session-card-${a.id}`);
    const cardB = page.getByTestId(`session-card-${b.id}`);
    await cardA.focus();
    await expect(cardA).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(cardB).toBeFocused();

    await page.close();
  });

  test('R on a focused card opens the RestoreWizard', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Restorable' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    const card = page.getByTestId(`session-card-${session.id}`);
    await card.focus();
    await expect(card).toBeFocused();

    await page.keyboard.press('r');
    await expect(page.getByTestId('wizard-restore')).toBeVisible({
      timeout: 5000,
    });

    await page.close();
  });
});

// ---------------------------------------------------------------------------
// Popup pinned cards
// ---------------------------------------------------------------------------
test.describe('[US-KB-popup-pinned] Popup pinned card shortcuts', () => {
  test('ArrowDown moves focus between pinned cards in the popup', async ({
    extensionContext,
    extensionId,
  }) => {
    const a = createPinnedSession({ name: 'Pin A' });
    const b = createPinnedSession({ name: 'Pin B' });
    await seedSessions(extensionContext, [a, b]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    const cardA = page.getByTestId(`popup-profile-item-${a.id}`);
    const cardB = page.getByTestId(`popup-profile-item-${b.id}`);
    await cardA.focus();
    await expect(cardA).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(cardB).toBeFocused();

    await page.close();
  });

  test('R on a focused pinned card opens the customize-restore page', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createPinnedSession({ name: 'Pin A' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToPopup(page, extensionId);

    const card = page.getByTestId(`popup-profile-item-${session.id}`);
    await card.focus();
    await expect(card).toBeFocused();

    const [newPage] = await Promise.all([
      extensionContext.waitForEvent('page'),
      page.keyboard.press('r'),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('options.html');
    expect(newPage.url()).toContain('action=restore');
    expect(newPage.url()).toContain(encodeURIComponent(session.id));

    await newPage.close();
    await page.close().catch(() => {});
  });
});
