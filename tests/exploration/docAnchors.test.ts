import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATALOG } from '../../src/exploration/catalog';

/**
 * Guard for the catalogue's documentation deep links.
 *
 * Every `docUrl` that carries a `#fragment` must point at a heading anchor that
 * actually exists in the Starlight page, in all three locales. Starlight derives
 * heading ids from the heading TEXT (which differs per locale), so the docs use
 * explicit, locale-stable `{#id}` anchors; this test fails if a catalogue anchor
 * has no matching `{#id}` in EN, FR and ES, catching drift when a heading is
 * renamed or an anchor removed.
 */

const DOCS_ROOT = join(process.cwd(), 'docs/src/content/docs');
const LOCALE_DIR: Record<string, string> = { en: '', fr: 'fr/', es: 'es/' };

function docFile(locale: string, page: string): string {
  return join(DOCS_ROOT, `${LOCALE_DIR[locale]}${page}.mdx`);
}

const anchored = CATALOG.flatMap((entry) => {
  if (!entry.docUrl || !entry.docUrl.includes('#')) return [];
  const [page, anchor] = entry.docUrl.split('#');
  return [{ id: entry.id, page, anchor }];
});

describe('catalogue documentation anchors', () => {
  it('has at least one anchored doc link (sanity)', () => {
    expect(anchored.length).toBeGreaterThan(0);
  });

  it.each(anchored)('$id -> $page#$anchor exists in EN, FR and ES', ({ page, anchor }) => {
    for (const locale of ['en', 'fr', 'es']) {
      const file = docFile(locale, page);
      expect(existsSync(file), `${locale} doc missing: ${page}.mdx`).toBe(true);
      const content = readFileSync(file, 'utf8');
      expect(content.includes(`{#${anchor}}`), `${locale} ${page} is missing {#${anchor}}`).toBe(true);
    }
  });
});
