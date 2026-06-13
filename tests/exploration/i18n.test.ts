import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CATALOG } from '../../src/exploration/catalog';
import { EXPLORATION_DOMAINS, domainLabelKey } from '../../src/exploration/domains';
import { EXPLORATION_PHASES } from '../../src/exploration/phases';

const LOCALES = ['en', 'fr', 'es'] as const;

function loadKeys(locale: string): Set<string> {
  const raw = readFileSync(`public/_locales/${locale}/messages.json`, 'utf8');
  return new Set(Object.keys(JSON.parse(raw) as Record<string, unknown>));
}

const keysByLocale = Object.fromEntries(LOCALES.map((l) => [l, loadKeys(l)])) as Record<string, Set<string>>;

describe('exploration i18n resolvability', () => {
  it('resolves every catalogue label and description in all three locales', () => {
    const missing: string[] = [];
    for (const entry of CATALOG) {
      for (const locale of LOCALES) {
        if (!keysByLocale[locale].has(entry.labelKey)) missing.push(`${locale}:${entry.labelKey}`);
        if (!keysByLocale[locale].has(entry.descriptionKey)) missing.push(`${locale}:${entry.descriptionKey}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('resolves every domain label', () => {
    for (const domain of EXPLORATION_DOMAINS) {
      for (const locale of LOCALES) {
        expect(keysByLocale[locale].has(domainLabelKey(domain))).toBe(true);
      }
    }
  });

  it('resolves every phase label', () => {
    for (const phase of EXPLORATION_PHASES) {
      for (const locale of LOCALES) {
        expect(keysByLocale[locale].has(phase.labelKey)).toBe(true);
      }
    }
  });
});
