/**
 * E2E tests for session notes feature.
 * Covers: note display in card, search in note, highlight, edit via dialog.
 *
 * US-S-NOTE-02 → edit note via SessionEditDialog
 * US-S-NOTE-03 → note displayed in session card (collapsed/expanded)
 * US-S-NOTE-04 → search matches note text, card auto-expanded
 * US-S-NOTE-05 → matching text in note is highlighted
 */
import { test, expect } from './fixtures';
import { goToSessionsSection } from './helpers/navigation';
import {
  seedSessions,
  clearSessions,
  clearHelpPrefs,
  createTestSession,
  getSessionsFromStorage,
} from './helpers/seed';
import type { TestSession } from './helpers/seed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sessionWithNote(note: string): TestSession {
  return {
    id: uuid(),
    name: 'Noted Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    groups: [],
    ungroupedTabs: [{ id: uuid(), title: 'Example', url: 'https://example.com' }],
    isPinned: false,
    note,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

test.beforeEach(async ({ extensionContext }) => {
  await clearSessions(extensionContext);
  await clearHelpPrefs(extensionContext);
});

// ---------------------------------------------------------------------------
// [US-S-NOTE-03] Note displayed in session card
// ---------------------------------------------------------------------------

test.describe('[US-S-NOTE-03] Note displayed in session card', () => {
  test('note is visible when card is expanded', async ({ extensionContext, extensionId }) => {
    const session = sessionWithNote('Important context for this session');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Expand the card by clicking the collapsible trigger (tab count line)
    await page.getByText(/1 tab/i).click();

    await expect(page.getByText('Important context for this session')).toBeVisible();
    await page.close();
  });

  test('note is not visible when card is collapsed', async ({ extensionContext, extensionId }) => {
    const session = sessionWithNote('Hidden note text XYZ');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Card starts collapsed — note should not be visible
    await expect(page.getByText('Hidden note text XYZ')).toBeHidden();
    await page.close();
  });

  test('no note section is shown when session has no note', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Session Without Note' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Expand the card
    await page.getByText(/\d+ tab/i).click();

    // No note-specific content expected — just verify normal tabs are visible
    await expect(page.getByText('Session Without Note')).toBeVisible();
    await page.close();
  });

  test('note respects line breaks in display', async ({ extensionContext, extensionId }) => {
    const session = sessionWithNote('Line one\nLine two');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByText(/1 tab/i).click();

    // Both lines should be visible (pre-wrap preserves newlines)
    await expect(page.getByText('Line one')).toBeVisible();
    await expect(page.getByText('Line two')).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-NOTE-04] Search matches note
// ---------------------------------------------------------------------------

test.describe('[US-S-NOTE-04] Search matches note', () => {
  test('session appears when search matches note text', async ({
    extensionContext,
    extensionId,
  }) => {
    const matching = sessionWithNote('unique-keyword-in-note');
    const nonMatching = createTestSession({ name: 'Other Session' });
    await seedSessions(extensionContext, [matching, nonMatching]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('unique-keyword-in-note');

    await expect(page.getByText('Noted Session', { exact: true })).toBeVisible();
    // Non-matching session should be hidden
    await expect(page.getByText('Other Session', { exact: true })).toBeHidden();
    await page.close();
  });

  test('card is auto-expanded when search matches note', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithNote('This note contains the search-target-word');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('search-target-word');

    // Note should be visible (card auto-opened).
    // Use regex because AccessibleHighlight wraps matching text in <mark>, splitting DOM text nodes.
    await expect(page.getByText(/This note contains the/)).toBeVisible();
    await page.close();
  });

  test('card is NOT auto-expanded when only the name matches (not the note)', async ({
    extensionContext,
    extensionId,
  }) => {
    const session: TestSession = {
      ...sessionWithNote('completely different content'),
      name: 'My Searchable Session',
    };
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('My Searchable Session');

    // Session visible but note should NOT be visible (card not auto-expanded)
    await expect(page.getByText('My Searchable Session')).toBeVisible();
    await expect(page.getByText('completely different content')).toBeHidden();
    await page.close();
  });

  test('note search is case-insensitive', async ({ extensionContext, extensionId }) => {
    const session = sessionWithNote('UPPERCASE NOTE CONTENT');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('uppercase note');

    await expect(page.getByText('Noted Session', { exact: true })).toBeVisible();
    await page.close();
  });

  test('note-only match still opens the card', async ({ extensionContext, extensionId }) => {
    // Session whose NAME does not match, only the note does
    const session: TestSession = {
      id: uuid(),
      name: 'Generic Name ABC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groups: [],
      ungroupedTabs: [{ id: uuid(), title: 'Unrelated', url: 'https://unrelated.com' }],
      isPinned: false,
      note: 'only-in-note-xyz',
    };
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('only-in-note-xyz');

    // Session appears (note matched)
    await expect(page.getByText('Generic Name ABC', { exact: true })).toBeVisible();
    // Note text is visible (card opened) — use first() since AccessibleHighlight may split text
    await expect(page.locator('mark').filter({ hasText: 'only-in-note-xyz' }).first()).toBeVisible();
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-NOTE-05] Note text is highlighted in search
// ---------------------------------------------------------------------------

test.describe('[US-S-NOTE-05] Note text is highlighted in search', () => {
  test('matching text in note is highlighted with <mark>', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = sessionWithNote('This session is about TypeScript development');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByPlaceholder('Search sessions...').fill('TypeScript');

    // Card auto-opens; note visible with highlighted text
    await expect(page.locator('mark').filter({ hasText: 'TypeScript' }).first()).toBeVisible();
    await page.close();
  });

  test('no highlight when search is empty', async ({ extensionContext, extensionId }) => {
    const session = sessionWithNote('Some note content');
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // No search — expand the card
    await page.getByText(/1 tab/i).click();

    // Note visible but no <mark> elements
    await expect(page.getByText('Some note content')).toBeVisible();
    await expect(page.locator('mark')).toHaveCount(0);
    await page.close();
  });
});

// ---------------------------------------------------------------------------
// [US-S-NOTE-02] Edit note via SessionEditDialog
// ---------------------------------------------------------------------------

test.describe('[US-S-NOTE-02] Edit note via SessionEditDialog', () => {
  test('note textarea is visible in edit dialog', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Session To Edit' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    // Open the "..." menu and click Edit
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    // The note textarea should be present in the dialog
    await expect(dialog.locator('textarea')).toBeVisible();
    await page.close();
  });

  test('existing note is pre-filled in edit dialog', async ({ extensionContext, extensionId }) => {
    const session: TestSession = {
      ...createTestSession({ name: 'Session With Note' }),
      note: 'Pre-existing note content',
    };
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    await expect(dialog.locator('textarea')).toHaveValue('Pre-existing note content');
    await page.close();
  });

  test('edited note is persisted after save', async ({ extensionContext, extensionId }) => {
    const session = createTestSession({ name: 'Session To Annotate' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    // Type a note
    await dialog.locator('textarea').fill('My new note for this session');

    // Save
    await dialog.getByRole('button', { name: /save/i }).click();
    await dialog.waitFor({ state: 'hidden' });

    // Verify persisted in storage
    const stored = await getSessionsFromStorage(extensionContext);
    const saved = stored.find(s => s.name === 'Session To Annotate');
    expect(saved?.note).toBe('My new note for this session');
    await page.close();
  });

  test('clearing the note removes it from storage', async ({ extensionContext, extensionId }) => {
    const session: TestSession = {
      ...createTestSession({ name: 'Session To Clear Note' }),
      note: 'Old note to remove',
    };
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    // Clear the note
    await dialog.locator('textarea').fill('');

    await dialog.getByRole('button', { name: /save/i }).click();
    await dialog.waitFor({ state: 'hidden' });

    const stored = await getSessionsFromStorage(extensionContext);
    const saved = stored.find(s => s.name === 'Session To Clear Note');
    expect(saved?.note).toBeUndefined();
    await page.close();
  });

  test('note change makes dialog dirty — confirmation appears on cancel', async ({
    extensionContext,
    extensionId,
  }) => {
    const session = createTestSession({ name: 'Dirty Note Session' });
    await seedSessions(extensionContext, [session]);

    const page = await extensionContext.newPage();
    await goToSessionsSection(page, extensionId);

    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });

    // Type in the note to make dialog dirty
    await dialog.locator('textarea').fill('Unsaved note');

    // Click Cancel
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Unsaved changes alert dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.close();
  });
});
