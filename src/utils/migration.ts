import { browser } from 'wxt/browser';
import { getSettings, setSettings } from './settingsUtils.js';
import { logger } from './logger.js';
import { setStatisticsData } from './statisticsUtils.js';
import { defaultAppSettings } from '@/types/syncSettings.js';
import { defaultStatistics } from '@/types/statistics.js';
import type { AppSettings, DomainRuleSetting } from '@/types/syncSettings.js';
import type { ChromeGroupColor } from '@/types/tabTree.js';

function isObject(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

function mergeDeep(target: unknown, source: unknown): unknown {
  const output: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        output[key] = key in target ? mergeDeep(target[key], source[key]) : source[key];
      } else {
        output[key] = source[key]; // Arrays & primitives: source wins
      }
    });
  }
  return output;
}

// Snapshot figé des couleurs que portait categories.json avant que
// `category.color` soit retiré. Sert uniquement à migrer les règles
// existantes : `rule.color` reprend la couleur que sa catégorie avait
// auparavant, pour préserver l'apparence des groupes Chrome.
const LEGACY_CATEGORY_COLORS: Record<string, ChromeGroupColor> = {
  development: 'blue',
  productivity: 'purple',
  commerce: 'orange',
  travel: 'cyan',
  search: 'yellow',
  social: 'pink',
  media: 'red',
  cloud: 'blue',
  finance: 'green',
  education: 'yellow',
};

const RULE_COLOR_FROM_CATEGORY_FLAG = 'ruleColorFromCategoryMigrated';

export async function initializeDefaults(): Promise<void> {
  // Plus de `default_settings.json` : les valeurs par défaut sont définies
  // en TypeScript via `defaultAppSettings`. Le seed initial des règles est
  // assuré par le système de packs (PackGallery) ; ici on ne fait que
  // garantir des toggles globaux cohérents.
  const defaults = defaultAppSettings;
  const rawLocal = await browser.storage.local.get('domainRules');

  if (rawLocal.domainRules === undefined) {
    logger.debug("Init defaults from TS constant...");
    await setSettings(defaults);
  } else {
    logger.debug("Merging existing with TS defaults...");
    const currentSettings = await getSettings();
    const merged = mergeDeep(defaults, currentSettings) as AppSettings;

    // Migrate missing fields on existing rules (never inject new default rules)
    if (merged.domainRules && Array.isArray(merged.domainRules)) {
      merged.domainRules.forEach((rule) => {
        if (typeof rule.label === 'undefined') {
          rule.label = rule.domainFilter || "Untitled Rule";
        }
        const ruleRecord = rule as DomainRuleSetting & Record<string, unknown>;
        if (typeof ruleRecord.groupId !== 'undefined') {
          delete ruleRecord.groupId;
        }
        if (typeof rule.color === 'undefined') {
          rule.color = "grey";
        }
        if (typeof rule.urlParsingRegEx === 'undefined') {
          rule.urlParsingRegEx = '';
        }
        if (typeof rule.groupNameSource === 'undefined') {
          rule.groupNameSource = 'title';
        }
        if (!Array.isArray(rule.ignoredQueryParams)) {
          rule.ignoredQueryParams = [];
        }
      });
    }
    await setSettings(merged);
  }

  const localData = await browser.storage.local.get('statistics');
  if (!localData.statistics) {
    logger.debug("Init stats...");
    await setStatisticsData(defaultStatistics);
  }
}

function backfillRuleColor(rule: Record<string, unknown>): boolean {
  if (typeof rule.color === 'string' && rule.color !== '') return false;
  const categoryId = typeof rule.categoryId === 'string' ? rule.categoryId : null;
  if (!categoryId) return false;
  const legacyColor = LEGACY_CATEGORY_COLORS[categoryId];
  if (!legacyColor) return false;
  rule.color = legacyColor;
  return true;
}

/**
 * Migration une-fois : la couleur appartient maintenant à la règle, plus
 * à la catégorie. Pour chaque règle existante qui a un `categoryId` mais
 * pas encore de `color`, on lui copie la couleur que sa catégorie portait
 * avant ce refactor. Idempotent grâce à un flag dédié.
 */
export async function migrateRuleColorsFromCategories(): Promise<void> {
  try {
    const flagState = await browser.storage.local.get(RULE_COLOR_FROM_CATEGORY_FLAG);
    if (flagState[RULE_COLOR_FROM_CATEGORY_FLAG]) {
      logger.debug('[MIGRATION] Rule colors already migrated from categories.');
      return;
    }

    const stored = await browser.storage.local.get('domainRules');
    const rules = stored.domainRules;
    if (Array.isArray(rules)) {
      const changed = (rules as Array<Record<string, unknown>>)
        .map(backfillRuleColor)
        .some(Boolean);
      if (changed) {
        await browser.storage.local.set({ domainRules: rules });
        logger.debug('[MIGRATION] Copied legacy category colors onto rules.');
      } else {
        logger.debug('[MIGRATION] No rule needed legacy color backfill.');
      }
    }

    await browser.storage.local.set({ [RULE_COLOR_FROM_CATEGORY_FLAG]: true });
  } catch (error) {
    logger.error('[MIGRATION] Rule color migration failed:', error);
  }
}
