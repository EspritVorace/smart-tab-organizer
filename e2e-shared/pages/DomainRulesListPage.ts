/**
 * Page Object for the Domain Rules list (`DomainRulesPage` options view).
 *
 * Wraps the list surface around `DomainRuleCard` items: list container,
 * add-rule button, per-card lookup helpers and the enable/disable Switch
 * on each card. Composed flows (wizard creation, edit) live in
 * `e2e-shared/actions/rules-management.ts`.
 *
 * Selectors anchor on stable `data-testid` attributes; the per-card
 * Switch falls back to `role="switch"` scoped to the card (no dedicated
 * testid currently exists for it in the source).
 *
 * Relevant US: US-R001 (creation entry point), US-R003 (toggle rule
 * enabled).
 */
import { expect, type Locator, type Page } from '@playwright/test';

export class DomainRulesListPage {
  constructor(protected readonly page: Page) {}

  // ─── Locators ────────────────────────────────────────────────────────────

  /** Root page container (`<Box data-testid="page-rules">`). */
  root(): Locator {
    return this.page.getByTestId('page-rules');
  }

  /** Rules list container (rendered when at least one rule exists). */
  list(): Locator {
    return this.page.getByTestId('page-rules-list');
  }

  /** "Add rule" button in the toolbar (entry point of the creation wizard). */
  addRuleButton(): Locator {
    return this.page.getByTestId('page-rules-btn-add');
  }

  /** A single rule card by id. */
  card(ruleId: string): Locator {
    return this.page.getByTestId(`rule-card-${ruleId}`);
  }

  /** Enable/disable Switch inside a rule card. */
  enableSwitch(ruleId: string): Locator {
    return this.card(ruleId).getByRole('switch').first();
  }

  // ─── Atomic actions ──────────────────────────────────────────────────────

  /** Click the rule's enable/disable Switch. */
  async toggleRuleEnabled(ruleId: string): Promise<void> {
    await this.enableSwitch(ruleId).click();
  }

  // ─── Atomic assertions ───────────────────────────────────────────────────

  /** Assert the rules list is rendered (at least one rule exists). */
  async expectListVisible(): Promise<void> {
    await expect(this.list()).toBeVisible();
  }
}
