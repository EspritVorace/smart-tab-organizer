/**
 * Main narrative journey — Phase 2.1 (3 locales x 2 themes).
 *
 * Six acts walking from a freshly-installed extension to advanced use, with
 * captures organised by `captureStep`. Rule creation happens through the
 * actual wizard UI; tab opening uses the mimetic-sites server (real-looking
 * URLs resolved locally via Chromium's `--host-resolver-rules`).
 *
 * Locale and theme are read from the project metadata declared in
 * `playwright.doc.config.ts`; one project => one persistent Chromium context,
 * resulting in 6 isolated runs.
 *
 * Captures requiring features that do not yet exist in the source (rule-
 * creation toast, grouping toast with undo, sessions snapshot multi-step
 * wizard, file-picker driven export-success toast) remain deferred and are
 * documented in `user-stories/doc-scenarios/clarifications.md`.
 */
import { test } from '../helpers/doc-fixture.js';
import { waitForServiceWorker } from '../../e2e-shared/extension-id.js';
import {
  captureStep,
  startScenario,
} from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  dismissRuleWizard,
  fillRuleWizardStep1,
  fillSessionsSearch,
  fillSnapshotName,
  fillSnapshotNotes,
  getFirstSessionId,
  hoverSessionCardName,
  importWizardNextToClassification,
  openExportRulesWizard,
  openExtensionPage,
  openImportRulesWizard,
  openMimeticTab,
  openRuleWizard,
  openSnapshotWizard,
  pasteImportJson,
  pinSession,
  ruleWizardNextToOptions,
  ruleWizardNextToSummary,
  saveSnapshotWizard,
  selectConfigurationMode,
  toggleRuleEnabled,
  waitForGroupingSettled,
} from '../helpers/ui-actions.js';
import { MAIN_JOURNEY_MANIFEST } from './00-main-journey.routing.js';

/**
 * Minimal rule fixture used to populate the list and exercise grouping.
 * Mirrors the schema from `src/types/syncSettings.ts` -> DomainRuleSetting.
 */
const SEED_RULES = [
  {
    id: 'doc-rule-github',
    domainFilter: 'github.com',
    label: 'GitHub',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'grey',
    categoryId: 'development',
    presetId: null,
    enabled: true,
  },
  {
    id: 'doc-rule-youtube',
    domainFilter: 'youtube.com',
    label: 'YouTube',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'red',
    categoryId: null,
    presetId: null,
    enabled: true,
  },
  {
    id: 'doc-rule-google',
    domainFilter: 'google.com',
    label: 'Google',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'blue',
    categoryId: null,
    presetId: null,
    enabled: true,
  },
  {
    id: 'doc-rule-lemonde',
    domainFilter: 'lemonde.fr',
    label: 'Le Monde',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'orange',
    categoryId: null,
    presetId: null,
    enabled: true,
  },
];

const SCENARIO_ID = '00-main-journey';

test.describe.configure({ mode: 'serial' });

test('main journey', async (
  { extensionContext, extensionId, locale, theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [MAIN_JOURNEY_MANIFEST],
  });

  // Reset extension storage so Act 1 captures are reproducible.
  const sw = await waitForServiceWorker(extensionContext);
  await sw.evaluate(async () => {
    await chrome.storage.local.clear();
  });

  await test.step('Act 1 - Empty state', async () => {
    const popupPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'popup',
      locale,
      theme,
    );
    await captureStep(popupPage, 'popup-empty', {
      description: 'Popup at first launch (no rules, statistics at zero).',
    });
    await popupPage.close();

    const rulesPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );
    await rulesPage.getByTestId('page-rules').waitFor({ state: 'visible' });
    await captureStep(rulesPage, 'options-rules-empty', {
      description: 'Rules page in empty state.',
    });
    await rulesPage.close();

    const sessionsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'sessions',
      locale,
      theme,
    );
    await sessionsPage.getByTestId('page-sessions').waitFor({ state: 'visible' });
    await captureStep(sessionsPage, 'options-sessions-empty', {
      description: 'Sessions page in empty state.',
    });
    await sessionsPage.close();

    const statsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'stats',
      locale,
      theme,
    );
    await statsPage.getByTestId('page-stats').waitFor({ state: 'visible' });
    await captureStep(statsPage, 'options-statistics-empty', {
      description: 'Statistics page with counters at zero.',
    });
    await statsPage.close();

    const importExportPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'importexport',
      locale,
      theme,
    );
    await importExportPage
      .getByTestId('page-import-export')
      .waitFor({ state: 'visible' });
    await captureStep(importExportPage, 'options-import-export-empty', {
      description: 'Import/Export page in initial state.',
    });
    await importExportPage.close();
  });

  await test.step('Act 2 - Rule wizard, all configuration modes', async () => {
    const rulesPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );

    // Walk 1 — Ask mode through every step. We use Ask rather than Preset
    // because Preset mode requires picking a preset via CMDK (hard to drive
    // headlessly without flake). Captures still cover the entire 4-step flow.
    await openRuleWizard(rulesPage);
    await captureStep(rulesPage, 'rules-wizard-step1-identity', {
      force: 10,
      description: 'Rule wizard step 1 (identity fields).',
    });
    await fillRuleWizardStep1(rulesPage, {
      label: 'GitHub',
      domainFilter: 'github.com',
    });
    await selectConfigurationMode(rulesPage, 'preset');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-preset', {
      force: 11,
      description: 'Rule wizard step 2, Preset mode selected.',
    });
    await selectConfigurationMode(rulesPage, 'ask');
    await ruleWizardNextToOptions(rulesPage);
    await captureStep(rulesPage, 'rules-wizard-step3-options', {
      force: 12,
      description: 'Rule wizard step 3 (options: deduplication, etc.).',
    });
    await ruleWizardNextToSummary(rulesPage);
    await captureStep(rulesPage, 'rules-wizard-step4-summary', {
      force: 13,
      description: 'Rule wizard step 4 (summary before save).',
    });
    await dismissRuleWizard(rulesPage);

    // Walk 2 — Ask mode capture only.
    await openRuleWizard(rulesPage);
    await fillRuleWizardStep1(rulesPage, {
      label: 'YouTube',
      domainFilter: 'youtube.com',
    });
    await selectConfigurationMode(rulesPage, 'ask');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-ask', {
      force: 15,
      description: 'Rule wizard step 2, Ask mode selected.',
    });
    await dismissRuleWizard(rulesPage);

    // Walk 3 — Manual mode capture only.
    await openRuleWizard(rulesPage);
    await fillRuleWizardStep1(rulesPage, {
      label: 'Google',
      domainFilter: 'google.com',
    });
    await selectConfigurationMode(rulesPage, 'manual');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-manual', {
      force: 16,
      description: 'Rule wizard step 2, Manual mode (regex fields visible).',
    });
    await dismissRuleWizard(rulesPage);

    // Seed the four rules so Act 3 can exercise grouping and the list view
    // is populated with a representative state. SEED_RULES mirrors the
    // schema from src/types/syncSettings.ts -> DomainRuleSetting.
    await sw.evaluate(async (rules) => {
      await chrome.storage.local.set({ domainRules: rules });
    }, SEED_RULES);

    // Reload the rules page to pick up the seeded list.
    await rulesPage.reload();
    await rulesPage.waitForLoadState('domcontentloaded');
    await rulesPage
      .getByTestId('page-rules-list')
      .waitFor({ state: 'visible' });
    await captureStep(rulesPage, 'rules-list-populated', {
      force: 18,
      description: 'Rules list with four rules covering every configuration mode.',
    });
    await rulesPage.close();

    const popupPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'popup',
      locale,
      theme,
    );
    await captureStep(popupPage, 'popup-with-rules', {
      description: 'Popup with rules configured (statistics still at zero).',
    });
    await popupPage.close();
  });

  await test.step('Act 3 - Real usage, mimetic tabs', async () => {
    const tabUrls = [
      'http://github.com/repo-readme.html',
      'http://github.com/repo-issues.html',
      'http://youtube.com/watch-tutorial.html',
      'http://youtube.com/watch-music.html',
      'http://google.com/search-wxt.html',
      'http://google.com/search-radix.html',
      'http://lemonde.fr/article.html',
    ];

    const openedTabs = [];
    for (const url of tabUrls) {
      openedTabs.push(await openMimeticTab(extensionContext, url));
    }

    await waitForGroupingSettled(extensionContext, 6_000);

    const popupPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'popup',
      locale,
      theme,
    );
    await captureStep(popupPage, 'popup-stats-incremented', {
      force: 21,
      description: 'Popup after grouping/dedup of mimetic tabs.',
    });
    await popupPage.close();

    const statsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'stats',
      locale,
      theme,
    );
    await statsPage.getByTestId('page-stats').waitFor({ state: 'visible' });
    await captureStep(statsPage, 'options-statistics-populated', {
      description: 'Statistics page with real counters after Act 3.',
    });
    await statsPage.close();

    // Tabs stay open into Act 4 so the snapshot wizard has groups to capture.
    void openedTabs;
  });

  await test.step('Act 4 - Sessions snapshot', async () => {
    const sessionsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'sessions',
      locale,
      theme,
    );

    await openSnapshotWizard(sessionsPage);
    await fillSnapshotName(sessionsPage, 'Morning research');
    await fillSnapshotNotes(
      sessionsPage,
      'Initial research session captured at the start of the day.',
    );
    await captureStep(sessionsPage, 'sessions-snapshot-wizard-filled', {
      force: 30,
      description: 'Snapshot wizard with name and notes filled in.',
    });
    await saveSnapshotWizard(sessionsPage);

    await sessionsPage
      .getByTestId('page-sessions-list')
      .waitFor({ state: 'visible' });
    await captureStep(sessionsPage, 'sessions-list-with-snapshot', {
      force: 33,
      description: 'Sessions list with one snapshot freshly created.',
    });

    // Card-level captures: relative time + HoverCard.
    const sessionId = await getFirstSessionId(sessionsPage);
    await captureStep(sessionsPage, 'sessions-card-relative-time', {
      force: 34,
      description: 'Session card showing relative time and metadata.',
      elementSelector: `[data-testid="session-card-${sessionId}"]`,
    });

    await hoverSessionCardName(sessionsPage, sessionId);
    await captureStep(sessionsPage, 'sessions-card-hovercard', {
      force: 35,
      description: 'HoverCard open on the session card name.',
    });
    // Move the cursor away to dismiss the HoverCard before the next capture.
    await sessionsPage.mouse.move(0, 0);
    await sessionsPage.waitForTimeout(200);

    await sessionsPage.close();

    // Popup pin onboarding hint: with sessions present but none pinned,
    // PopupProfilesList renders the "no pinned profiles yet" callout
    // (data-testid="popup-pinned-empty").
    const popupPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'popup',
      locale,
      theme,
    );
    await popupPage
      .getByTestId('popup-pinned-empty')
      .waitFor({ state: 'visible' })
      .catch(async () => {
        // Empty hint is collapsible; expand it if needed.
        const toggle = popupPage.getByTestId('popup-pinned-empty-toggle');
        if (await toggle.count()) {
          await toggle.click();
          await popupPage.getByTestId('popup-pinned-empty').waitFor({ state: 'visible' });
        }
      });
    await captureStep(popupPage, 'sessions-pin-onboarding', {
      force: 36,
      description: 'Popup pin onboarding hint (sessions exist but none pinned yet).',
    });
    await popupPage.close();

    // Pin the snapshot to expose the "list with pinned" state.
    const sessionsPage2 = await openExtensionPage(
      extensionContext,
      extensionId,
      'sessions',
      locale,
      theme,
    );
    await sessionsPage2
      .getByTestId('page-sessions-list')
      .waitFor({ state: 'visible' });
    await pinSession(sessionsPage2, sessionId);
    await captureStep(sessionsPage2, 'sessions-list-with-pinned', {
      force: 37,
      description: 'Sessions list with one pinned profile.',
    });
    await sessionsPage2.close();
  });

  await test.step('Act 5 - Import / Export', async () => {
    const page = await openExtensionPage(
      extensionContext,
      extensionId,
      'importexport',
      locale,
      theme,
    );
    await page
      .getByTestId('page-import-export')
      .waitFor({ state: 'visible' });
    await captureStep(page, 'import-export-with-data', {
      force: 40,
      description: 'Import/Export page once rules and a session exist.',
    });

    // Open the rules export wizard and capture the selection step.
    await openExportRulesWizard(page);
    await captureStep(page, 'export-wizard-selection', {
      force: 41,
      description: 'Rules export wizard, selection step (all rules pre-selected).',
    });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').first().waitFor({ state: 'hidden' }).catch(() => {});

    // Open the import wizard, switch to Text mode, and paste a rules payload.
    await openImportRulesWizard(page);
    const samplePayload = JSON.stringify(
      {
        domainRules: [
          {
            label: 'Stack Overflow',
            domainFilter: 'stackoverflow.com',
            titleParsingRegEx: '',
            urlParsingRegEx: '',
            groupNameSource: 'smart_label',
            deduplicationMatchMode: 'exact',
            deduplicationEnabled: true,
            color: 'gray',
          },
          {
            label: 'GitHub',
            domainFilter: 'github.com',
            titleParsingRegEx: '',
            urlParsingRegEx: '',
            groupNameSource: 'smart_label',
            deduplicationMatchMode: 'exact',
            deduplicationEnabled: true,
            color: 'green',
          },
        ],
      },
      null,
      2,
    );
    await pasteImportJson(page, samplePayload);
    await captureStep(page, 'import-wizard-paste', {
      force: 43,
      description: 'Rules import wizard, JSON pasted in Text mode (validated).',
    });

    await importWizardNextToClassification(page);
    await captureStep(page, 'import-wizard-classification', {
      force: 44,
      description: 'Rules import wizard, classification step (new + conflicting).',
    });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').first().waitFor({ state: 'hidden' }).catch(() => {});

    await page.close();
  });

  await test.step('Act 6 - Advanced state', async () => {
    const rulesPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );
    await rulesPage
      .getByTestId('page-rules-list')
      .waitFor({ state: 'visible' });

    // Disable one rule (Google) so the list shows a representative
    // disabled-rule visual: dimmed card, switch off.
    await toggleRuleEnabled(rulesPage, 'doc-rule-google');
    await captureStep(rulesPage, 'rules-list-with-disabled', {
      force: 50,
      description: 'Rules list with one rule disabled (toggle off, dimmed card).',
    });
    await rulesPage.close();

    // Sessions search: filter by name then by deep-search keyword.
    const sessionsPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'sessions',
      locale,
      theme,
    );
    await sessionsPage
      .getByTestId('page-sessions-list')
      .waitFor({ state: 'visible' });
    await fillSessionsSearch(sessionsPage, 'Morning');
    await captureStep(sessionsPage, 'sessions-search-active', {
      force: 51,
      description: 'Sessions list with an active search filtering by session name.',
    });
    await fillSessionsSearch(sessionsPage, 'tutorial');
    await captureStep(sessionsPage, 'sessions-search-deep', {
      force: 52,
      description: 'Sessions list with a deep search matching tab titles inside the snapshot.',
    });
    await sessionsPage.close();

    const finalPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'rules',
      locale,
      theme,
    );
    await finalPage
      .getByTestId('page-rules-list')
      .waitFor({ state: 'visible' });
    await captureStep(finalPage, 'rules-list-final', {
      force: 60,
      description: 'Rules list at the end of the journey (advanced state).',
    });
    await finalPage.close();
  });

  await writeScenarioReadme({
    title: `Main journey - \`00-main-journey\` (${locale} x ${theme})`,
    intro:
      'Narrative walkthrough captured by `pnpm doc:scenarios`. Phase 2.1 covers the full 3 locales x 2 themes matrix (en/fr/es x dark/light). Captures depending on UI features that are not yet implemented (e.g. rule-creation toast, grouping toast with undo, multi-step snapshot wizard, file-picker driven export-success toast) remain deferred and are tracked in `user-stories/doc-scenarios/clarifications.md`.',
  });
});
