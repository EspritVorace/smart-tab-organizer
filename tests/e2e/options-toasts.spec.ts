/**
 * E2E Tests for in-page toasts (Options page)
 *
 * When an action is triggered from the Options page (import/export of rules,
 * import/export of sessions, snapshot, restore), user feedback is shown via
 * an in-page toast (<Toaster /> in src/components/UI/Toaster/) instead of a
 * native browser notification.
 *
 * Native notifications remain the channel for background events (grouping,
 * deduplication) -- tested separately in tests/e2e/notifications.spec.ts.
 *
 * The import rules flow (Text mode paste + Next + Import) is the simplest
 * user trigger that produces a toast without needing any browser permission
 * (clipboard, filesystem...). We use it to assert toast behaviour.
 *
 * Migrated to the Page Object / Domain Action architecture (lot 5).
 */
import { test, expect } from './fixtures';
import { goToImportExportSection } from './helpers/navigation';
import {
  getServiceWorker,
  getSmartTabNotificationIds,
  openRulesImportWizard,
} from '../../e2e-shared/actions/index.js';
import type { ImportWizardPage } from '../../e2e-shared/pages/index.js';

function makeRuleJson(label: string, domainFilter: string): string {
  return JSON.stringify({
    domainRules: [
      {
        id: `toast-${Date.now()}`,
        label,
        domainFilter,
        enabled: true,
        deduplicationEnabled: false,
        deduplicationMatchMode: 'exact',
        groupNameSource: 'title',
        presetId: null,
        color: 'blue',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        badge: '',
      },
    ],
  });
}

/** Drive the wizard through Text-mode import. Optionally bring your own wizard. */
async function submitTextImport(
  wizard: ImportWizardPage,
  json: string,
): Promise<void> {
  await wizard.selectTextMode();
  await wizard.pasteJson(json);
  await expect(wizard.nextButton()).toBeEnabled();
  await wizard.clickNext();
  await expect(wizard.confirmButton()).toBeVisible();
  await wizard.confirmImport();
}

test.describe('Options page toasts', () => {
  test.beforeEach(async ({ helpers }) => {
    await helpers.clearDomainRules();
  });

  test('rule import shows an in-page toast and no native notification', async ({
    extensionContext,
    extensionId,
    extensionPage,
  }) => {
    await goToImportExportSection(extensionPage, extensionId);

    const sw = await getServiceWorker(extensionContext);
    const notifBefore = await getSmartTabNotificationIds(sw);

    const wizard = await openRulesImportWizard(extensionPage);
    await expect(extensionPage).toHaveDialogOpen();

    await submitTextImport(wizard, makeRuleJson('Toast Rule', 'toast-visible.com'));

    await expect(extensionPage).toHaveToast('success');
    await expect(extensionContext).toHaveDomainRulesCount(1);

    const notifAfter = await getSmartTabNotificationIds(sw);
    expect(notifAfter).toEqual(notifBefore);
  });

  test('closing a toast removes it from the viewport', async ({
    extensionId,
    extensionPage,
  }) => {
    await goToImportExportSection(extensionPage, extensionId);

    const wizard = await openRulesImportWizard(extensionPage);
    await submitTextImport(wizard, makeRuleJson('Toast Close Rule', 'toast-close.com'));

    await expect(extensionPage).toHaveToast('success');

    await extensionPage.getByTestId('toast-btn-close').first().click();
    await expect(extensionPage.getByTestId('toast-success')).toBeHidden({ timeout: 2000 });
  });
});
