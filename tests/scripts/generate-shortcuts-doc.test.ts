/**
 * Validates the committed Starlight reference pages stay in sync with
 * `src/shortcuts/registry.ts`. Acts as the in-PR guardrail before the
 * `doc-scenarios.yml` job re-runs the generator and `git diff --exit-code`s.
 *
 * Strategy: rather than spawning the generator script per-test (slow,
 * creates filesystem side-effects), we read the committed MDX files and
 * assert structural invariants. If a contributor adds/removes a registry
 * entry without running `pnpm shortcuts:doc`, one of these expectations
 * trips.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { SHORTCUTS_REGISTRY } from '../../src/shortcuts/registry';
import {
  GROUP_DESCRIPTORS,
  getDisplayTree,
} from '../../src/shortcuts/groups';

type Locale = 'fr' | 'en' | 'es';

const PROJECT_ROOT = join(__dirname, '..', '..');

const DOC_PATHS: Record<Locale, string> = {
  en: 'docs/src/content/docs/reference/keyboard-shortcuts.mdx',
  fr: 'docs/src/content/docs/fr/reference/keyboard-shortcuts.mdx',
  es: 'docs/src/content/docs/es/reference/keyboard-shortcuts.mdx',
};

function readDoc(locale: Locale): string {
  return readFileSync(join(PROJECT_ROOT, DOC_PATHS[locale]), 'utf-8');
}

function loadMessages(locale: Locale): Record<string, { message: string }> {
  return JSON.parse(
    readFileSync(
      join(PROJECT_ROOT, 'public', '_locales', locale, 'messages.json'),
      'utf-8',
    ),
  );
}

function countTableRows(md: string): number {
  const lines = md.split('\n');
  const isSeparator = (line: string) => /^\| --- \| --- \|$/.test(line);
  const isTableLine = (line: string) => /^\| .+ \| .+ \|$/.test(line);
  const tables = lines.filter(isSeparator).length;
  const dataAndHeaders = lines.filter((line) => isTableLine(line) && !isSeparator(line)).length;
  return dataAndHeaders - tables; // exclude one header per table
}

const LOCALES: Locale[] = ['fr', 'en', 'es'];

describe('generate-shortcuts-doc output (committed mdx)', () => {
  for (const locale of LOCALES) {
    describe(`locale ${locale}`, () => {
      it('starts with a Starlight front-matter block (title + description)', () => {
        const md = readDoc(locale);
        expect(md.startsWith('---\n')).toBe(true);
        const messages = loadMessages(locale);
        const title = messages.docsKeyboardShortcutsTitle?.message;
        const description = messages.docsKeyboardShortcutsIntro?.message;
        expect(title).toBeDefined();
        expect(description).toBeDefined();
        expect(md).toContain(`title: ${title}`);
        expect(md).toContain(`description: ${description}`);
      });

      it('renders every visible top-level group as an H2 in canonical order', () => {
        const md = readDoc(locale);
        const messages = loadMessages(locale);
        const tree = getDisplayTree('options');
        const headers = tree.map(
          ({ descriptor }) => `## ${messages[descriptor.titleKey]?.message ?? descriptor.titleKey}`,
        );

        let cursor = 0;
        for (const header of headers) {
          const idx = md.indexOf(header, cursor);
          expect(idx, `missing header "${header}" after position ${cursor}`).toBeGreaterThan(-1);
          cursor = idx + header.length;
        }
      });

      it('renders every visible subgroup as an H3', () => {
        const md = readDoc(locale);
        const messages = loadMessages(locale);
        for (const { subgroups } of getDisplayTree('options')) {
          for (const sub of subgroups) {
            expect(md).toContain(`### ${messages[sub.titleKey]?.message ?? sub.titleKey}`);
          }
        }
      });

      it('total table rows equal the number of (entry x group/subgroup) renderings', () => {
        const md = readDoc(locale);
        const expectedRows = getDisplayTree('options').reduce((acc, { descriptor, subgroups }) => {
          const own = Object.values(SHORTCUTS_REGISTRY).filter((e) => e.group === descriptor.id).length;
          const subRows = subgroups.reduce(
            (sum, sub) =>
              sum + Object.values(SHORTCUTS_REGISTRY).filter((e) => e.group === sub.id).length,
            0,
          );
          return acc + own + subRows;
        }, 0);
        expect(countTableRows(md)).toBe(expectedRows);
      });

      it('renders the description of every registry entry at least once', () => {
        const md = readDoc(locale);
        const messages = loadMessages(locale);
        for (const entry of Object.values(SHORTCUTS_REGISTRY)) {
          const visibleSomewhere = Object.values(getDisplayTree('options')).some(
            ({ descriptor, subgroups }) =>
              descriptor.id === entry.group ||
              subgroups.some((s) => s.id === entry.group),
          );
          if (!visibleSomewhere) continue;
          const description = messages[entry.descriptionKey]?.message;
          expect(description, `missing description ${entry.descriptionKey}`).toBeDefined();
          expect(md, `description ${entry.descriptionKey} not rendered`).toContain(description as string);
        }
      });
    });
  }

  it('all GROUP_DESCRIPTORS used by registry are reachable from getDisplayTree("options")', () => {
    const tree = getDisplayTree('options');
    const reachable = new Set<string>();
    for (const { descriptor, subgroups } of tree) {
      reachable.add(descriptor.id);
      subgroups.forEach((s) => reachable.add(s.id));
    }
    const usedGroups = new Set(Object.values(SHORTCUTS_REGISTRY).map((e) => e.group));
    for (const g of usedGroups) {
      expect(reachable, `group ${g} is not reachable in the options surface tree`).toContain(g);
      expect(GROUP_DESCRIPTORS[g], `group descriptor missing for ${g}`).toBeDefined();
    }
  });
});
