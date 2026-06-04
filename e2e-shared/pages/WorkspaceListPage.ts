/**
 * Page Object for the Workspaces list (`WorkspacesPage` options view).
 *
 * Wraps the list-driven surface around the workspace rows: list container
 * and per-row lookup. Page Objects in this folder stay close to the DOM
 * (locators + atomic actions + atomic assertions).
 *
 * Selectors anchor on stable `data-testid` / `data-workspace-card`
 * attributes so the helper works across the doc-scenarios locale matrix
 * (en/fr/es) without subclassing.
 */
import { type Locator, type Page } from '@playwright/test';

export class WorkspaceListPage {
  constructor(protected readonly page: Page) {}

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Workspaces list container (`<Box data-testid="workspace-list">`). */
  list(): Locator {
    return this.page.getByTestId('workspace-list');
  }

  /**
   * First workspace row in the list. There is always at least one
   * workspace, so this locator is always resolvable. Anchors on the
   * `data-workspace-card` attribute.
   */
  firstCard(): Locator {
    return this.list().locator('[data-workspace-card]').first();
  }
}
