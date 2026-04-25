/**
 * Seed data for domain-rules screenshots.
 *
 * Types are defined locally to mirror the project's types exactly as read from:
 *   src/types/syncSettings.ts  → DomainRuleSetting
 *   src/schemas/domainRule.ts  → DomainRule fields
 *   src/schemas/enums.ts       → ColorValue, GroupNameSourceValue, DeduplicationMatchModeValue, BadgeType
 *
 * No fields have been invented; all field names and value ranges come directly
 * from the Zod schemas and TypeScript interfaces in the repo.
 */
import type { BrowserContext } from '@playwright/test';
import { getServiceWorker } from '../helpers/screenshot-helper.js';

// ─── Local type mirrors (match src/types/syncSettings.ts + src/schemas/) ────

type ColorValue =
  | 'grey' | 'blue' | 'red' | 'yellow' | 'green'
  | 'pink' | 'purple' | 'cyan' | 'orange';

type GroupNameSourceValue =
  | 'title' | 'url' | 'manual' | 'smart'
  | 'smart_manual' | 'smart_preset' | 'smart_label';

type DeduplicationMatchModeValue = 'exact' | 'includes';

type BadgeType = 'NEW' | 'WARNING' | 'DELETED';

/** Mirrors src/types/syncSettings.ts → DomainRuleSetting */
interface DomainRuleSetting {
  // ── From domainRuleSchema (src/schemas/domainRule.ts) ──
  id: string;
  domainFilter: string;
  label: string;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  groupNameSource: GroupNameSourceValue;
  deduplicationMatchMode: DeduplicationMatchModeValue;
  color?: ColorValue;
  categoryId?: string | null;
  deduplicationEnabled: boolean;
  presetId: string | null;
  // ── Added by DomainRuleSetting ──
  enabled: boolean;
  badge?: BadgeType;
  groupingEnabled?: boolean;
}

// ─── Seed data ───────────────────────────────────────────────────────────────

/**
 * 6 varied rules covering the main UI states shown in the Web Store screenshots:
 *  1. Preset rule (Jira-style alphanumeric ID)
 *  2. Manual domain rule (GitHub, smart_label grouping)
 *  3. Title-regex rule (Notion, title parsing)
 *  4. Smart-manual rule (Trello, "ask"-style behaviour)
 *  5. Disabled rule (Reddit, shows toggle in off state)
 *  6. Jira-pattern rule (Linear, illustrates the killer use-case)
 */
export const SCREENSHOT_RULES: DomainRuleSetting[] = [
  {
    id: 'sc-rule-jira',
    domainFilter: '*.atlassian.net',
    label: 'Jira',
    titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
    urlParsingRegEx: 'browse/([A-Z]+-\\d+)',
    groupNameSource: 'smart_preset',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'blue',
    categoryId: 'development',
    presetId: 'alphanumeric-id',
    enabled: true,
  },
  {
    id: 'sc-rule-github',
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
    id: 'sc-rule-notion',
    domainFilter: '*.notion.so',
    label: 'Notion',
    // groupNameSource 'title' + presetId null → titleParsingRegEx required (non-empty)
    titleParsingRegEx: '(.+?)\\s*[-\u2013]\\s*Notion',
    urlParsingRegEx: '',
    groupNameSource: 'title',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'purple',
    categoryId: 'productivity',
    presetId: null,
    enabled: true,
  },
  {
    id: 'sc-rule-trello',
    domainFilter: 'trello.com',
    label: 'Trello',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    // smart_manual: tries smart detection, falls back to asking the user
    groupNameSource: 'smart_manual',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'cyan',
    categoryId: 'productivity',
    presetId: null,
    enabled: true,
  },
  {
    id: 'sc-rule-reddit',
    domainFilter: 'reddit.com',
    label: 'Reddit',
    titleParsingRegEx: '',
    // groupNameSource 'url' + presetId null → urlParsingRegEx required
    urlParsingRegEx: 'r/(\\w+)',
    groupNameSource: 'url',
    deduplicationMatchMode: 'includes',
    deduplicationEnabled: false,
    color: 'orange',
    categoryId: 'social',
    presetId: null,
    enabled: false, // disabled — shows the toggle in the off state
  },
  {
    id: 'sc-rule-linear',
    domainFilter: 'linear.app',
    label: 'Linear',
    titleParsingRegEx: '',
    urlParsingRegEx: '',
    groupNameSource: 'smart_label',
    deduplicationMatchMode: 'exact',
    deduplicationEnabled: true,
    color: 'purple',
    categoryId: 'development',
    presetId: null,
    enabled: true,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Inject SCREENSHOT_RULES into chrome.storage.local, bypassing the UI. */
export async function seedRules(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async (rules) => {
    await chrome.storage.local.set({ domainRules: rules });
  }, SCREENSHOT_RULES as unknown as Parameters<typeof sw.evaluate>[1]);
  await new Promise((r) => setTimeout(r, 150));
}

/** Remove all domain rules from storage. */
export async function clearRules(context: BrowserContext): Promise<void> {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    await chrome.storage.local.set({ domainRules: [] });
  });
  await new Promise((r) => setTimeout(r, 100));
}
