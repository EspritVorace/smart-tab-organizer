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
 * Lot 6 (issue #309): the scenario now drives the UI exclusively through
 * Page Objects and Domain Actions from `e2e-shared/`. Only pipeline-
 * specific helpers (locale-aware page opening, mimetic-tab spawn,
 * Escape-to-dismiss) live in `../helpers/ui-actions.ts`. An evolution of
 * the extension's DOM breaks both pipelines at the same call site, which
 * keeps the `e2e-flaky-detector` agent's diagnoses honest.
 */
import { test } from '../helpers/doc-fixture.js';
import {
  captureStep,
  startScenario,
} from '../helpers/doc-capture.js';
import { writeScenarioReadme } from '../helpers/scenario-readme.js';
import {
  dismissDialog,
  openExtensionPage,
  openMimeticTab,
} from '../helpers/ui-actions.js';
import {
  clearExtensionStorage,
  openRuleWizard,
  openSnapshotWizard,
  openRulesExportWizard,
  openRulesImportWizard,
  pinSession,
  stubShowSaveFilePicker,
  waitForGroupingSettled,
  waitForToast,
} from '../../e2e-shared/actions/index.js';
import {
  DomainRulesListPage,
  SessionsListPage,
} from '../../e2e-shared/pages/index.js';
import { waitForServiceWorker } from '../../e2e-shared/extension-id.js';
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
  { extensionContext, extensionId, docLocale: locale, docTheme: theme },
) => {
  startScenario({
    id: SCENARIO_ID,
    locale,
    theme,
    manifests: [MAIN_JOURNEY_MANIFEST],
  });

  // Reset extension storage so Act 1 captures are reproducible.
  await clearExtensionStorage(extensionContext);
  const sw = await waitForServiceWorker(extensionContext);

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
      elementSelector: '#popup-app',
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

    // Walk 1 — Preset/Ask mode through every step. We use Ask rather than
    // Preset because Preset mode requires picking a preset via CMDK (hard
    // to drive headlessly without flake). Captures still cover the entire
    // 4-step flow.
    const wizard1 = await openRuleWizard(rulesPage);
    await captureStep(rulesPage, 'rules-wizard-step1-identity', {
      force: 10,
      description: 'Rule wizard step 1 (identity fields).',
    });
    await wizard1.fillLabel('GitHub');
    await wizard1.fillDomainFilter('github.com');
    await wizard1.clickNext();
    await wizard1.expectOnStep(2);
    await wizard1.selectConfigMode('preset');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-preset', {
      force: 11,
      description: 'Rule wizard step 2, Preset mode selected.',
    });
    await wizard1.selectConfigMode('ask');
    await wizard1.clickNext();
    await wizard1.expectOnStep(3);
    await captureStep(rulesPage, 'rules-wizard-step3-options', {
      force: 12,
      description: 'Rule wizard step 3 (options: deduplication, etc.).',
    });
    await wizard1.clickNext();
    await wizard1.expectOnStep(4);
    await captureStep(rulesPage, 'rules-wizard-step4-summary', {
      force: 13,
      description: 'Rule wizard step 4 (summary before save).',
    });
    await rulesPage.keyboard.press('Escape');
    await wizard1.expectHidden();

    // Walk 2 — Ask mode capture only.
    const wizard2 = await openRuleWizard(rulesPage);
    await wizard2.fillLabel('YouTube');
    await wizard2.fillDomainFilter('youtube.com');
    await wizard2.clickNext();
    await wizard2.expectOnStep(2);
    await wizard2.selectConfigMode('ask');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-ask', {
      force: 15,
      description: 'Rule wizard step 2, Ask mode selected.',
    });
    await rulesPage.keyboard.press('Escape');
    await wizard2.expectHidden();

    // Walk 3 — Manual mode capture only.
    const wizard3 = await openRuleWizard(rulesPage);
    await wizard3.fillLabel('Google');
    await wizard3.fillDomainFilter('google.com');
    await wizard3.clickNext();
    await wizard3.expectOnStep(2);
    await wizard3.selectConfigMode('manual');
    await captureStep(rulesPage, 'rules-wizard-step2-mode-manual', {
      force: 16,
      description: 'Rule wizard step 2, Manual mode (regex fields visible).',
    });
    await rulesPage.keyboard.press('Escape');
    await wizard3.expectHidden();

    // Seed the four rules so Act 3 can exercise grouping and the list view
    // is populated with a representative state.
    await sw.evaluate(async (rules) => {
      await chrome.storage.local.set({ domainRules: rules });
    }, SEED_RULES);

    // Reload the rules page to pick up the seeded list.
    await rulesPage.reload();
    await rulesPage.waitForLoadState('domcontentloaded');
    const rulesList = new DomainRulesListPage(rulesPage);
    await rulesList.expectListVisible();
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
      elementSelector: '#popup-app',
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
      elementSelector: '#popup-app',
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

    const snapshot = await openSnapshotWizard(sessionsPage);
    await snapshot.fillName('Morning research');
    await snapshot.fillNote(
      'Initial research session captured at the start of the day.',
    );
    await captureStep(sessionsPage, 'sessions-snapshot-wizard-filled', {
      force: 30,
      description: 'Snapshot wizard with name and notes filled in.',
    });
    await snapshot.clickSave();
    await snapshot.expectHidden();

    const sessionsList = new SessionsListPage(sessionsPage);
    await sessionsList.expectListVisible();
    await captureStep(sessionsPage, 'sessions-list-with-snapshot', {
      force: 33,
      description: 'Sessions list with one snapshot freshly created.',
    });

    // Card-level captures: relative time + HoverCard.
    const sessionId = await sessionsList.firstSessionId();
    await captureStep(sessionsPage, 'sessions-card-relative-time', {
      force: 34,
      description: 'Session card showing relative time and metadata.',
      elementSelector: `[data-testid="session-card-${sessionId}"]`,
    });

    await sessionsList.hoverCardName(sessionId);
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
      elementSelector: '#popup-app',
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
    const sessionsList2 = new SessionsListPage(sessionsPage2);
    await sessionsList2.expectListVisible();
    await pinSession(sessionsPage2, sessionId);
    await captureStep(sessionsPage2, 'sessions-list-with-pinned', {
      force: 37,
      description: 'Sessions list with one pinned profile.',
    });
    await sessionsPage2.close();

    // Seed a second workspace so the PopupWorkspaceSwitcher renders (it
    // hides itself when only the default workspace exists). The default
    // workspace must remain present in the index so its scoped data stays
    // reachable. The popup uses `activeWorkspaceId` to pick its accent.
    await sw.evaluate(async () => {
      const now = new Date().toISOString();
      await chrome.storage.local.set({
        workspaces: [
          { id: 'default', name: 'Personal', accentColor: 'indigo', createdAt: now, updatedAt: now },
          { id: 'ws-work', name: 'Work', accentColor: 'green', createdAt: now, updatedAt: now },
        ],
        activeWorkspaceId: 'default',
      });
    });

    // Re-open the popup so it picks up the freshly pinned session, the
    // populated workspace index, and the still-open mimetic tabs (which
    // keep Save enabled). Restore is enabled because a session now exists.
    const popupPinnedPage = await openExtensionPage(
      extensionContext,
      extensionId,
      'popup',
      locale,
      theme,
    );
    await popupPinnedPage
      .getByTestId('popup-workspace-switcher')
      .waitFor({ state: 'visible', timeout: 5_000 })
      .catch(() => undefined);
    await popupPinnedPage
      .getByTestId('popup-profiles-list')
      .waitFor({ state: 'visible', timeout: 5_000 })
      .catch(() => undefined);
    await captureStep(popupPinnedPage, 'popup-with-pinned-and-workspace', {
      force: 38,
      description:
        'Popup with workspace switcher, one pinned profile, and Save/Restore enabled.',
      elementSelector: '#popup-app',
    });
    await popupPinnedPage.close();
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
    const exportWizard = await openRulesExportWizard(page);
    await captureStep(page, 'export-wizard-selection', {
      force: 41,
      description: 'Rules export wizard, selection step (all rules pre-selected).',
    });

    // Stub `showSaveFilePicker` so the file-export path resolves silently
    // (no native save dialog), then trigger the export and capture the
    // success toast that fires once the wizard auto-closes.
    await stubShowSaveFilePicker(page);
    await exportWizard.clickExportToFile();
    await exportWizard.expectHidden();
    await waitForToast(page, { variant: 'success' });
    await captureStep(page, 'export-toast-success', {
      force: 42,
      description: 'In-app success toast after the rules export completes.',
    });

    // Open the import wizard, switch to Text mode, and paste a rules payload.
    // The schema (`importDomainRuleSchema`) requires `id`, `presetId` and
    // `enabled` and rejects unknown color values. Reusing `doc-rule-github`
    // produces a "conflicting" classification entry; the Stack Overflow entry
    // appears as new.
    const importWizard = await openRulesImportWizard(page);
    const samplePayload = JSON.stringify(
      {
        domainRules: [
          {
            id: 'doc-import-stackoverflow',
            label: 'Stack Overflow',
            domainFilter: 'stackoverflow.com',
            titleParsingRegEx: '',
            urlParsingRegEx: '',
            groupNameSource: 'smart_label',
            deduplicationMatchMode: 'exact',
            deduplicationEnabled: true,
            color: 'grey',
            presetId: null,
            enabled: true,
          },
          {
            id: 'doc-rule-github',
            label: 'GitHub',
            domainFilter: 'github.com',
            titleParsingRegEx: '',
            urlParsingRegEx: '',
            groupNameSource: 'smart_label',
            deduplicationMatchMode: 'exact',
            deduplicationEnabled: true,
            color: 'green',
            presetId: null,
            enabled: true,
          },
        ],
      },
      null,
      2,
    );
    await importWizard.pasteJson(samplePayload);
    // Validation runs on each input change; brief stabilisation so the
    // success callout renders before capture.
    await page.waitForTimeout(200);
    await captureStep(page, 'import-wizard-paste', {
      force: 43,
      description: 'Rules import wizard, JSON pasted in Text mode (validated).',
    });

    await importWizard.clickNext();
    // Radix renders step 1 inside the same dialog; small breath so the
    // classification scroll area mounts before capture.
    await page.waitForTimeout(300);
    await captureStep(page, 'import-wizard-classification', {
      force: 44,
      description: 'Rules import wizard, classification step (new + conflicting).',
    });
    await dismissDialog(page);

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
    const rulesList = new DomainRulesListPage(rulesPage);
    await rulesList.expectListVisible();

    // Disable one rule (Google) so the list shows a representative
    // disabled-rule visual: dimmed card, switch off.
    await rulesList.toggleRuleEnabled('doc-rule-google');
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
    const sessionsList = new SessionsListPage(sessionsPage);
    await sessionsList.expectListVisible();
    await sessionsList.search('Morning');
    await captureStep(sessionsPage, 'sessions-search-active', {
      force: 51,
      description: 'Sessions list with an active search filtering by session name.',
    });
    await sessionsList.search('tutorial');
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
    const finalList = new DomainRulesListPage(finalPage);
    await finalList.expectListVisible();
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
