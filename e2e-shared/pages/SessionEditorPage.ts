/**
 * Page Object for the Session Editor dialog (`SessionEditDialog`).
 *
 * Wraps the Radix dialog opened from a session card's More-actions menu
 * (`Edit` item). Covers the session name input, the note textarea, the
 * tab tree (inline edit/delete/move tab, inline edit/delete group,
 * collapse / expand), the unsaved-changes alert and the delete-group
 * alert.
 *
 * Stays close to the DOM (locators + atomic actions + atomic
 * assertions). Composed flows (e.g. "edit name + save and verify
 * storage") belong in `e2e-shared/actions/` when reused across
 * pipelines.
 *
 * Selectors target the English UI (`--lang=en-US`); subclass and
 * override the locator getters to retarget another locale.
 *
 * Relevant US: US-E01 (edit session), US-E02 (delete group),
 * US-S-NOTE-02 (edit note), US-S018 (collapsed groups).
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { DialogPage } from './DialogPage.js';

export class SessionEditorPage extends DialogPage {
  constructor(page: Page) {
    super(page);
  }

  override dialog(): Locator {
    return this.page.getByTestId('dialog-session-edit');
  }

  // ─── Locators: form fields ───────────────────────────────────────────────

  /** Session name text input. */
  nameInput(): Locator {
    return this.dialog().getByTestId('dialog-session-edit-field-name');
  }

  /** Note textarea (single textarea inside the dialog). */
  noteTextarea(): Locator {
    return this.dialog().locator('textarea');
  }

  /** Primary "Save" button in the footer. */
  saveButton(): Locator {
    return this.dialog().getByTestId('dialog-session-edit-btn-save');
  }

  /** "Cancel" button in the footer. */
  cancelButton(): Locator {
    return this.dialog().getByTestId('dialog-session-edit-btn-cancel');
  }

  // ─── Locators: tab tree ──────────────────────────────────────────────────

  /**
   * A tab-tree row (group header or tab) filtered by its text content.
   * Tab tree rows are rendered as `role="listitem"` by `TabTreeEditor`.
   */
  rowByText(text: string): Locator {
    return this.dialog().getByRole('listitem').filter({ hasText: text });
  }

  /** Inline URL textbox revealed after clicking "Edit tab". */
  tabUrlInput(): Locator {
    return this.dialog().getByRole('textbox', { name: /url/i });
  }

  /** Inline group-name textbox revealed after clicking "Edit group". */
  groupNameInput(): Locator {
    return this.dialog().getByRole('textbox', { name: /group name/i });
  }

  // ─── Locators: secondary alert dialogs ───────────────────────────────────

  /**
   * Root of the unsaved-changes / delete-group AlertDialog (Radix
   * renders both with `role="alertdialog"`, so they share the same
   * locator). Only one can be visible at a time.
   */
  alertDialog(): Locator {
    return this.page.getByRole('alertdialog');
  }

  // ─── Atomic actions: form ────────────────────────────────────────────────

  /** Fill the session name input. */
  async fillName(name: string): Promise<void> {
    await this.nameInput().fill(name);
  }

  /** Fill the note textarea (use an empty string to clear it). */
  async fillNote(note: string): Promise<void> {
    await this.noteTextarea().fill(note);
  }

  /** Click "Save". */
  async clickSave(): Promise<void> {
    await this.saveButton().click();
  }

  /** Click "Cancel" (may surface the unsaved-changes alert if dirty). */
  async clickCancel(): Promise<void> {
    await this.cancelButton().click();
  }

  // ─── Atomic actions: opening ─────────────────────────────────────────────

  /**
   * Open the editor from the More-actions dropdown on the (only) visible
   * session card. The card trigger is targeted by its stable
   * `session-card-*-btn-dropdown` testid (locale-agnostic, and distinct from
   * the page toolbar's own "..." menu); the Edit item is targeted by its
   * stable `*-menu-edit` testid (unaffected by the trailing Kbd hint).
   */
  async openFromFirstSessionMenu(): Promise<void> {
    await this.page.locator('[data-testid^="session-card-"][data-testid$="-btn-dropdown"]').click();
    await this.page.locator('[data-testid$="-menu-edit"]').click();
    await this.expectVisible();
  }

  // ─── Atomic actions: tab tree ────────────────────────────────────────────

  /**
   * Hover the row matching `text` and click "Delete tab".
   * Mirrors the spec pattern: hover the row, then click the destructive
   * IconButton revealed in the hovered row's `rightSlot`.
   */
  async deleteTab(text: string): Promise<void> {
    const row = this.rowByText(text);
    await row.hover();
    await row.getByRole('button', { name: 'Delete tab' }).click();
  }

  /**
   * Hover the row matching `text` and click "Edit tab". Leaves the
   * inline URL textbox open; use `tabUrlInput()` to interact with it.
   */
  async editTab(text: string): Promise<void> {
    const row = this.rowByText(text);
    await row.hover();
    await row.getByRole('button', { name: 'Edit tab' }).click();
  }

  /** Replace the URL in the inline tab editor and commit with Enter. */
  async fillTabUrlAndCommit(url: string): Promise<void> {
    const input = this.tabUrlInput();
    await input.clear();
    await input.fill(url);
    await input.press('Enter');
  }

  /**
   * Hover the row matching `text` and open the Move-tab dropdown.
   * Use `selectMoveTarget` to pick the destination group.
   */
  async openMoveTabDropdown(text: string): Promise<void> {
    const row = this.rowByText(text);
    await row.hover();
    await row.getByRole('button', { name: 'Move tab to group' }).click();
  }

  /** Click a target group in the Move-tab dropdown menu. */
  async selectMoveTarget(groupName: string): Promise<void> {
    await this.page.getByRole('menuitem', { name: groupName }).click();
  }

  /**
   * Hover the group header matching `groupName` and click "Edit group".
   * Leaves the inline group-name textbox open; use `groupNameInput()`
   * to interact with it.
   */
  async editGroup(groupName: string): Promise<void> {
    const row = this.rowByText(groupName).first();
    await row.hover();
    await this.dialog().getByRole('button', { name: 'Edit group' }).click();
  }

  /** Replace the group name in the inline group editor and commit. */
  async fillGroupNameAndCommit(name: string): Promise<void> {
    const input = this.groupNameInput();
    await input.clear();
    await input.fill(name);
    await input.press('Enter');
  }

  /**
   * Hover the group header matching `groupName` and click "Delete
   * group". Opens the secondary AlertDialog asking whether to keep or
   * ungroup the tabs.
   */
  async openDeleteGroupAlert(groupName: string): Promise<void> {
    const row = this.rowByText(groupName).first();
    await row.hover();
    await this.dialog().getByRole('button', { name: 'Delete group' }).click();
  }

  /** Toggle the first visible "Collapse group" button in the tab tree. */
  async toggleCollapseGroup(): Promise<void> {
    await this.dialog().getByRole('button', { name: /collapse group/i }).click();
  }

  // ─── Atomic actions: alerts ──────────────────────────────────────────────

  /** Click "Leave" in the unsaved-changes alert. */
  async confirmLeaveUnsaved(): Promise<void> {
    await this.page.getByRole('button', { name: /leave/i }).click();
  }

  /** Confirm "Delete group and N tab(s)" in the delete-group alert. */
  async confirmDeleteGroupAndTabs(): Promise<void> {
    await this.page.getByRole('button', { name: /delete group and/i }).click();
  }

  /** Confirm "Ungroup tabs" in the delete-group alert. */
  async confirmUngroupTabs(): Promise<void> {
    await this.page.getByRole('button', { name: /ungroup/i }).click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert a tab title / group name is visible inside the dialog. */
  async expectTextVisible(text: string, options?: { exact?: boolean }): Promise<void> {
    await expect(this.dialog().getByText(text, options)).toBeVisible();
  }

  /** Assert a tab title / group name is NOT visible inside the dialog. */
  async expectTextHidden(text: string, options?: { exact?: boolean }): Promise<void> {
    await expect(this.dialog().getByText(text, options)).toBeHidden();
  }

  /**
   * Assert a counter line containing `text` (regex tolerant) is visible
   * inside the dialog. Examples: `/3 tab/i`, `/1 group/i`.
   */
  async expectCounterVisible(text: RegExp): Promise<void> {
    await expect(this.dialog().getByText(text)).toBeVisible();
  }

  /** Assert the unsaved-changes alert is visible. */
  async expectUnsavedAlertVisible(): Promise<void> {
    await expect(this.alertDialog()).toBeVisible();
    await expect(this.alertDialog().getByText(/unsaved/i).first()).toBeVisible();
  }

  /** Assert the delete-group alert is visible. */
  async expectDeleteGroupAlertVisible(): Promise<void> {
    await expect(this.alertDialog()).toBeVisible();
  }
}
