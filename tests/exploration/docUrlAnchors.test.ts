import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOG } from '../../src/exploration/catalog';

/**
 * Guard test (US exploration / docs): every `docUrl` declared in the catalogue
 * must resolve to a real English Starlight page, and when it carries a
 * `#fragment`, that fragment must match an explicit `\{#id}` anchor on a heading
 * of that page. This keeps the exploration "Read the docs" buttons honest: a
 * renamed heading or a typo in the catalogue fails here instead of shipping a
 * dead link. Anchors are locale-stable ids, so checking the EN source is enough.
 */

// Vitest runs with the repository root as cwd.
const DOCS_ROOT = resolve(process.cwd(), 'docs/src/content/docs');

/** Collects the explicit heading anchor ids (`\{#id}`) declared in an .mdx file. */
function anchorsOf(filePath: string): Set<string> {
  const content = readFileSync(filePath, 'utf8');
  const ids = new Set<string>();
  for (const match of content.matchAll(/\{#([a-z0-9-]+)\}/g)) {
    ids.add(match[1]);
  }
  return ids;
}

const entriesWithDoc = CATALOG.filter((entry) => entry.docUrl != null);

describe('catalogue docUrl anchors resolve in the English docs', () => {
  it('covers every catalogue entry with a docUrl', () => {
    // Sanity: the catalogue aims for full coverage; a regression that drops a
    // docUrl should be visible here.
    expect(entriesWithDoc.length).toBe(CATALOG.length);
  });

  it.each(entriesWithDoc.map((entry) => [entry.id, entry.docUrl as string]))(
    '%s -> %s',
    (_id, docUrl) => {
      const [path, fragment] = docUrl.split('#');
      const filePath = resolve(DOCS_ROOT, `${path}.mdx`);
      const pageExists = existsSync(filePath);
      const anchorExists = pageExists && (!fragment || anchorsOf(filePath).has(fragment));
      expect(pageExists, `missing docs page: ${path}.mdx`).toBe(true);
      expect(anchorExists, `missing anchor "#${fragment}" in ${path}.mdx`).toBe(true);
    },
  );
});
