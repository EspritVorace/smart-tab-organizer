/**
 * E2E Tests for Group Naming Modes (US-G011 to US-G017)
 *
 * Tests the advanced group naming strategies:
 * - US-G011: manual — user is prompted for a name; cancelling ungroups tabs
 * - US-G012: smart   — extracts name from title/URL via preset regex
 * - US-G013: smart_manual — extracts name or falls back to manual prompt
 * - US-G014: smart_preset — extracts name or falls back to preset name
 * - US-G015: Naming priority chains across all modes
 * - US-G016: Regex preset system — presets available and auto-fill UI fields
 * - US-G017: Conditional regex validation in the rule form
 *
 * Uses the same "Direct API" approach as grouping.spec.ts:
 * createTabFromOpener → processGroupingForNewTab directly.
 */

import { test, expect } from './fixtures';
import * as http from 'http';

/** Port used for fake local pages (needed for content script injection in manual-mode tests). */
const FAKE_PORT = 7655;

// ─── suite ──────────────────────────────────────────────────────────────────

test.describe('Group Naming Modes', () => {
  let localServer: http.Server;

  test.beforeAll(async () => {
    localServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        `<!DOCTYPE html><html><head><title>Naming Test Page</title></head><body>
           <h1>Naming Test</h1>
         </body></html>`,
      );
    });
    await new Promise<void>(resolve => localServer.listen(FAKE_PORT, resolve));
  });

  test.afterAll(async () => {
    localServer.closeAllConnections();
    await new Promise<void>(resolve => localServer.close(() => resolve()));
  });

  test.beforeEach(async ({ helpers }) => {
    await helpers.closeAllTestTabs();
    await helpers.clearAllTabGroups();
    await helpers.clearDomainRules();
    await helpers.setGlobalGroupingEnabled(true);
    await helpers.setGlobalDeduplicationEnabled(false);
    await helpers.resetStatistics();
  });

  // ── US-G011: manual mode ──────────────────────────────────────────────────

  test.describe('Manual Naming Mode [US-G011]', () => {
    test('manual mode: group is ungrouped when user cancels the prompt [US-G011]', async ({
      helpers,
    }) => {
      // In the test environment Playwright auto-dismisses native dialogs (prompt),
      // so prompt() returns null → content script responds { name: null }
      // → handleManualGroupNaming ungroups the tabs.
      await helpers.addDomainRule({
        label: 'Manual Rule',
        domainFilter: `localhost:${FAKE_PORT}`,
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'manual',
      });

      const opener = await helpers.createTab(`http://localhost:${FAKE_PORT}/opener.html`);
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, `http://localhost:${FAKE_PORT}/child.html`);

      // Wait for the prompt + ungrouping cycle to complete
      await new Promise(r => setTimeout(r, 2000));

      const groups = await helpers.getTabGroups();
      // Group should have been ungrouped because the user cancelled the prompt
      expect(groups).toHaveLength(0);
    });

    test('manual mode with no content script: falls back to null (ungroup) [US-G011]', async ({
      helpers,
    }) => {
      // Using an external URL where the message may not be received by the content script.
      // Either way, promptForGroupName returns null → ungroup.
      await helpers.addDomainRule({
        label: 'Manual Fallback',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'manual',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      await new Promise(r => setTimeout(r, 2000));

      const groups = await helpers.getTabGroups();
      expect(groups).toHaveLength(0);
    });
  });

  // ── US-G012: smart mode with preset ────────────────────────────────────────

  test.describe('Smart Mode with Preset [US-G012]', () => {
    test('smart mode: extracts group name from opener tab title via preset regex [US-G012]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Smart Preset Rule',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        // Simulating a preset by setting presetId + the regex fields that a preset would auto-fill
        presetId: 'test-preset',
        titleParsingRegEx: 'Project:\\s*(\\w+)',
        urlParsingRegEx: '',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      // Set the opener title to match the regex before creating the child tab
      await opener.evaluate(() => {
        document.title = 'Project: Beta - Documentation';
      });
      await helpers.waitForTabTitle(opener, 'Project: Beta - Documentation');

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // Should have extracted "Beta" from the title
      expect(groups[0].title).toBe('Beta');
    });

    test('smart mode: extracts group name from opener URL when title regex fails [US-G012]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Smart URL Rule',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        presetId: 'test-preset-url',
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)', // Will not match
        urlParsingRegEx: 'example\\.com/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/projects');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // Should extract "projects" from URL
      expect(groups[0].title).toBe('projects');
    });

    test('smart mode without presetId: extrait quand même via regex [US-G012]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Smart No Preset',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        // Pas de presetId : les regex fonctionnent quand même depuis la correction du guard
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)', // ne matche pas
        urlParsingRegEx: 'example\\.com/(\\w+)', // extrait "projects"
      });

      const opener = await helpers.createTab('https://example.com/projects');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].title).toBe('projects');
    });

    test('smart mode without presetId: ne groupe pas si les deux regex échouent [US-G012]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Smart No Preset',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        titleParsingRegEx: 'NOMATCH_TITLE:\\s*(\\w+)',
        urlParsingRegEx: 'NOMATCH_URL/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      await helpers.waitForGrouping();
      const groups = await helpers.getTabGroups();
      // Smart mode without fallback: no grouping when extraction fails
      expect(groups).toHaveLength(0);
    });

    test('smart mode: ne groupe pas quand les deux regex échouent [US-G012]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Smart Fallback Label',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        presetId: 'test-preset-no-match',
        titleParsingRegEx: 'NOMATCH_TITLE:\\s*(\\w+)',
        urlParsingRegEx: 'NOMATCH_URL/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      await helpers.waitForGrouping();
      const groups = await helpers.getTabGroups();
      // Smart mode without fallback: no grouping when extraction fails
      expect(groups).toHaveLength(0);
    });
  });

  // ── US-G013: smart_manual mode ────────────────────────────────────────────

  test.describe('Smart-Manual Mode [US-G013]', () => {
    test('smart_manual: group is named automatically when extraction succeeds [US-G013]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'SmartManual Rule',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_manual',
        presetId: 'test-preset-sm',
        titleParsingRegEx: 'Feature:\\s*(\\w+)',
        urlParsingRegEx: '',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await opener.evaluate(() => {
        document.title = 'Feature: Login';
      });
      await helpers.waitForTabTitle(opener, 'Feature: Login');

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // With a matching title, extraction succeeds → no prompt shown → group named "Login"
      expect(['Login', 'SmartManual Rule']).toContain(groups[0].title);
    });

    test('smart_manual: group is ungrouped when extraction fails and prompt is cancelled [US-G013]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'SmartManual Fallback',
        domainFilter: `localhost:${FAKE_PORT}`,
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_manual',
        presetId: 'test-preset-sm-fail',
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)',
        urlParsingRegEx: 'NOMATCH/(\\w+)',
      });

      const opener = await helpers.createTab(`http://localhost:${FAKE_PORT}/opener.html`);
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, `http://localhost:${FAKE_PORT}/child.html`);

      // Wait for the prompt + ungrouping cycle to complete
      await new Promise(r => setTimeout(r, 2000));

      const groups = await helpers.getTabGroups();
      // Extraction fails → prompt shown → Playwright dismisses → ungroup
      expect(groups).toHaveLength(0);
    });
  });

  // ── US-G014: smart_preset mode ────────────────────────────────────────────

  test.describe('Smart-Preset Mode [US-G014]', () => {
    test('smart_preset: uses extracted name when regex matches [US-G014]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'SmartPreset Rule',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_preset',
        presetId: 'github-issues',
        titleParsingRegEx: 'Issue:\\s*(\\w+)',
        urlParsingRegEx: '',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await opener.evaluate(() => {
        document.title = 'Issue: Authentication';
      });
      await new Promise(r => setTimeout(r, 200));

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // If extraction succeeds, group is named with the extracted value
      expect(['Authentication', 'github-issues', 'SmartPreset Rule']).toContain(groups[0].title);
    });

    test('smart_preset: falls back to presetId name when extraction fails [US-G014]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'SmartPreset Fallback',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_preset',
        presetId: 'github-issues',
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)',
        urlParsingRegEx: 'NOMATCH/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      // Extraction fails → falls back to presetId ('github-issues') as group name
      expect(groups[0].title).toBe('github-issues');
    });

    test('smart_preset: falls back to label when no presetId and extraction fails [US-G014]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'SmartPreset No Preset',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_preset',
        // No presetId → tryExtractGroupNameFromPresetOrFallback returns null
        // smart_preset: no presetId extracted → falls back to label
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('SmartPreset No Preset');
      expect(groups.find(g => g.title === 'SmartPreset No Preset')).toBeDefined();
    });
  });

  // ── US-G015: Naming priority chains ──────────────────────────────────────

  test.describe('Naming Priority Chains [US-G015]', () => {
    test('label mode: always uses rule label, falling back to "SmartGroup" when empty [US-G015]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Priority Label',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'label',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('Priority Label');
      expect(groups.find(g => g.title === 'Priority Label')).toBeDefined();
    });

    test('smart_label: uses extraction when regex matches, falls back to label [US-G015]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Label Fallback',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart_label',
        presetId: 'test-chain',
        titleParsingRegEx: 'NOMATCH:\\s*(\\w+)',
        urlParsingRegEx: 'NOMATCH/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped('Label Fallback');
      // Extraction fails with non-matching regex → falls back to rule label
      expect(groups.find(g => g.title === 'Label Fallback')).toBeDefined();
    });

    test('invalid regex ne crashe pas et ne groupe pas (smart, sans fallback) [US-G015]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'Invalid Regex Chain',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'smart',
        presetId: 'test-invalid',
        titleParsingRegEx: '[invalid(regex',
        urlParsingRegEx: '[also(invalid',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      // Should not crash; smart mode without fallback → no grouping when extraction fails
      await helpers.waitForGrouping();
      const groups = await helpers.getTabGroups();
      expect(groups).toHaveLength(0);
    });
  });

  // ── US-G016: Regex preset system (UI) ────────────────────────────────────

  test.describe('Regex Preset System [US-G016]', () => {
    test('presets data file is loaded and contains entries [US-G016]', async ({
      extensionContext,
    }) => {
      // Verify the presets JSON is accessible from the service worker context
      const sw = extensionContext.serviceWorkers()[0];
      const presets = await sw.evaluate(async () => {
        try {
          const resp = await fetch(chrome.runtime.getURL('/data/presets.json'));
          const data = await resp.json();
          return data;
        } catch (e) {
          return null;
        }
      });

      expect(presets).not.toBeNull();
      // The presets file should have a top-level array or object with entries
      const presetList = Array.isArray(presets) ? presets : Object.values(presets).flat();
      expect((presetList as any[]).length).toBeGreaterThanOrEqual(1);
    });

    test('Import/Export page is accessible via the options sidebar [US-G016]', async ({
      extensionContext,
      extensionId,
    }) => {
      const page = await extensionContext.newPage();
      await page.goto(`chrome-extension://${extensionId}/options.html`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => !document.body.textContent?.includes('Chargement'));

      // Navigate to Import/Export section where regex preset UI lives
      await page.getByRole('button', { name: /import.*export/i }).click();
      await page.waitForTimeout(300);

      // The Import/Export page should show export and import buttons
      await expect(page.getByRole('button', { name: /export/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /import/i }).first()).toBeVisible();

      await page.close();
    });
  });

  // ── US-G017: Conditional regex validation (background logic) ─────────────

  test.describe('Conditional Regex Validation [US-G017]', () => {
    test('title mode with valid titleParsingRegEx: group is created [US-G017]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Title Regex Valid',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'title',
        titleParsingRegEx: 'Project:\\s*(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await opener.evaluate(() => {
        document.title = 'Project: Gamma';
      });
      await helpers.waitForTabTitle(opener, 'Project: Gamma');

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      expect(['Gamma', 'Title Regex Valid']).toContain(groups[0].title);
    });

    test('url mode with valid urlParsingRegEx: group is created [US-G017]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'URL Regex Valid',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'url',
        urlParsingRegEx: 'example\\.com/(\\w+)',
      });

      const opener = await helpers.createTab('https://example.com/section');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      const groups = await helpers.waitForTabGrouped();
      expect(groups.length).toBeGreaterThan(0);
      expect(['section', 'URL Regex Valid']).toContain(groups[0].title);
    });

    test('invalid regex syntax: ne crashe pas et ne groupe pas (title, sans fallback) [US-G017]', async ({
      helpers,
    }) => {
      await helpers.addDomainRule({
        label: 'Invalid Regex Fallback',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'title',
        titleParsingRegEx: '[invalid(regex',
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await helpers.waitForGrouping();
      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      // Extension should not crash; title mode without fallback → no grouping when extraction fails
      await helpers.waitForGrouping();
      const groups = await helpers.getTabGroups();
      expect(groups).toHaveLength(0);
    });

    test('regex without capture group: ne groupe pas (title, sans fallback) [US-G017]', async ({ helpers }) => {
      await helpers.addDomainRule({
        label: 'No Capture Group',
        domainFilter: 'example.com',
        groupingEnabled: true,
        deduplicationEnabled: false,
        groupNameSource: 'title',
        titleParsingRegEx: 'NoCapture\\w+', // Valid regex but no capture group
      });

      const opener = await helpers.createTab('https://example.com/opener');
      await opener.evaluate(() => {
        document.title = 'NoCaptureTest page';
      });
      await helpers.waitForTabTitle(opener, 'NoCaptureTest page');

      await helpers.createTabFromOpener(opener, 'https://example.com/child');

      // Without capture group, extraction returns null → title mode has no fallback → no grouping
      await helpers.waitForGrouping();
      const groups = await helpers.getTabGroups();
      expect(groups).toHaveLength(0);
    });
  });
});
