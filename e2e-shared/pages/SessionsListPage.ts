/**
 * Page Object for the Sessions list (`SessionsPage` options view).
 *
 * Wraps the list-driven surface around `SessionCard` items: search input,
 * list container, per-card hover/lookup helpers. Page Objects in this
 * folder stay close to the DOM (locators + atomic actions + atomic
 * assertions); composed flows (snapshot creation, restoration) live in
 * `e2e-shared/actions/sessions-snapshot.ts` and `sessions-restore.ts`.
 *
 * Selectors anchor on stable `data-testid` attributes so the helper works
 * across the doc-scenarios locale matrix (en/fr/es) without subclassing.
 *
 * Relevant US: US-S001 (sessions list), US-S016 (search), US-S017
 * (HoverCard metadata).
 */
import { expect, type Locator, type Page } from '@playwright/test';

export class SessionsListPage {
  constructor(protected readonly page: Page) {}

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Root page container (`<Box data-testid="page-sessions">`). */
  root(): Locator {
    return this.page.getByTestId('page-sessions');
  }

  /** Sessions list flex (rendered when at least one session exists). */
  list(): Locator {
    return this.page.getByTestId('page-sessions-list');
  }

  /** "Take snapshot" button visible in the toolbar (and empty state). */
  snapshotButton(): Locator {
    return this.page.getByTestId('page-sessions-btn-snapshot');
  }

  /** Search input (filters the list by session name and tab titles). */
  searchInput(): Locator {
    return this.page.getByTestId('page-sessions-search');
  }

  /** A single session card by id. */
  card(sessionId: string): Locator {
    return this.page.getByTestId(`session-card-${sessionId}`);
  }

  /** Expand/collapse toggle for a card's tab-and-group preview. */
  previewToggle(sessionId: string): Locator {
    return this.page.getByTestId(`session-card-${sessionId}-preview-toggle`);
  }

  /** Archived sessions list flex (rendered on the archived sub-tab). */
  archivedList(): Locator {
    return this.page.getByTestId('page-sessions-archived-list');
  }

  /** "Active" sub-tab link. */
  activeTab(): Locator {
    return this.page.getByTestId('page-sessions-tab-active');
  }

  /** "Archived" sub-tab link. */
  archivedTab(): Locator {
    return this.page.getByTestId('page-sessions-tab-archived');
  }

  /**
   * First card of the archived sub-tab list (mirrors {@link firstCard} for the
   * archived bucket).
   */
  firstArchivedCard(): Locator {
    return this.archivedList().locator('[data-session-card]').first();
  }

  /**
   * First session card in the list (pinned section renders first, so a
   * pinned session takes priority over an unpinned one). Anchors on the
   * `data-session-card` attribute borne by `SessionCard`.
   */
  firstCard(): Locator {
    return this.list().locator('[data-session-card]').first();
  }

  /** HoverCard trigger anchored on the session card name. */
  cardNameTrigger(sessionId: string): Locator {
    return this.page.getByTestId(`session-card-${sessionId}-name`);
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /**
   * Type a query into the search input. Search filtering is purely
   * client-side: a single animation frame is enough for the React re-render
   * to commit before the next interaction or capture.
   */
  async search(query: string): Promise<void> {
    const input = this.searchInput();
    await input.click();
    await input.fill(query);
    await this.page.waitForTimeout(150);
  }

  /**
   * Hover the session card's name (HoverCard trigger) and wait for the
   * HoverCard panel to appear so any follow-up capture is stable.
   */
  async hoverCardName(sessionId: string): Promise<void> {
    const trigger = this.cardNameTrigger(sessionId);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover();
    await this.page
      .locator(
        '[data-radix-hover-card-content], [role="dialog"][data-state="open"]',
      )
      .first()
      .waitFor({ state: 'visible', timeout: 3000 })
      .catch(async () => {
        // Some Radix builds expose the content with a different attribute set;
        // a short stabilisation pause covers that case.
        await this.page.waitForTimeout(400);
      });
  }

  // ─── Atomic queries ──────────────────────────────────────────────────────

  /**
   * Resolve the testid suffix (uuid) of the first session card visible on
   * the sessions list. Walks from the `-name` element, whose testid follows
   * the `session-card-{uuid}-name` pattern, and strips the suffix.
   */
  async firstSessionId(): Promise<string> {
    const nameEl = this.page
      .locator('[data-testid^="session-card-"][data-testid$="-name"]')
      .first();
    await nameEl.waitFor({ state: 'visible' });
    const testid = await nameEl.getAttribute('data-testid');
    if (!testid) {
      throw new Error(
        'Could not read data-testid from the first session card name',
      );
    }
    return testid.replace(/^session-card-/, '').replace(/-name$/, '');
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the sessions list is rendered (at least one session exists). */
  async expectListVisible(): Promise<void> {
    await expect(this.list()).toBeVisible();
  }
}
