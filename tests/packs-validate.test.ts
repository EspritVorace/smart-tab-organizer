import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { packFileSchema } from '@/schemas/pack';
import { categoriesFileSchema } from '@/schemas/category';
import { matchesDomain } from '@/utils/utils';

const PACKS_DIR = path.resolve(__dirname, '../src/data/packs');
const CATEGORIES_FILE = path.resolve(__dirname, '../src/data/categories.json');

// Two domain filters "overlap" when they can match a common URL host. We probe
// with representative hosts (the bare domain and one arbitrary subdomain) so the
// check also catches wildcard containment (e.g. `*.google.com` ⊇ `www.google.com`),
// not just identical strings.
function representativeHosts(domainFilter: string): string[] {
  const cleaned = domainFilter.startsWith('*.') ? domainFilter.slice(2) : domainFilter;
  return [`https://${cleaned}/`, `https://sub.${cleaned}/`];
}

function filtersOverlap(a: string, b: string): boolean {
  return (
    representativeHosts(a).some((h) => matchesDomain(h, b)) ||
    representativeHosts(b).some((h) => matchesDomain(h, a))
  );
}

// Domains intentionally shared by two packs. Each case is benign because the two
// rules target disjoint URL paths on the same host, so the grouping engine's
// fall-through (`findGroupingRuleForTab` in src/background/grouping.ts) stays
// deterministic. Any NEW cross-pack overlap must be justified here or removed.
const INTENTIONAL_DOMAIN_OVERLAPS: Array<{ packs: [string, string]; reason: string }> = [
  {
    packs: ['pk-edu-corporate', 'pk-social-linkedin'],
    reason:
      'LinkedIn Learning (/learning/) vs social LinkedIn (/in/, /company/, jobs) — disjoint paths.',
  },
  {
    packs: ['pk-finance-markets', 'pk-search-engines'],
    reason: 'Google Finance (/finance/quote/) vs Google Search (?q=) — disjoint paths.',
  },
];

const ALLOWED_OVERLAP_KEYS = new Set(
  INTENTIONAL_DOMAIN_OVERLAPS.map((o) => [...o.packs].sort().join(' <> ')),
);

describe('packs data files', () => {
  const files = fs.readdirSync(PACKS_DIR).filter(f => f.endsWith('.json'));

  it('src/data/categories.json validates against the unified categoriesFileSchema', () => {
    const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const r = categoriesFileSchema.safeParse(data);
    if (!r.success) console.error(JSON.stringify(r.error.issues, null, 2));
    expect(r.success).toBe(true);
  });

  it('every pack categoryId references a known unified category', () => {
    const data = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    const knownIds = new Set<string>(
      categoriesFileSchema.parse(data).categories.map((c) => c.id),
    );
    const unknownReferences: Array<{ file: string; categoryId: string }> = [];
    for (const f of files.filter((f) => !f.startsWith('_'))) {
      const packData = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, f), 'utf8'));
      const categoryId = packData?.pack?.categoryId;
      if (categoryId && !knownIds.has(categoryId)) {
        unknownReferences.push({ file: f, categoryId });
      }
    }
    expect(unknownReferences).toEqual([]);
  });

  it('no two packs target the same domain unless explicitly allowlisted', () => {
    // Collect the unique domain filters declared by each pack.
    const perPack: Array<{ pack: string; domainFilter: string }> = [];
    for (const f of files.filter((f) => !f.startsWith('_'))) {
      const packData = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, f), 'utf8'));
      const packId: string = packData?.pack?.id ?? f;
      const seenFilters = new Set<string>();
      for (const rule of packData?.domainRules ?? []) {
        if (rule?.domainFilter && !seenFilters.has(rule.domainFilter)) {
          seenFilters.add(rule.domainFilter);
          perPack.push({ pack: packId, domainFilter: rule.domainFilter });
        }
      }
    }

    const violations: string[] = [];
    for (let i = 0; i < perPack.length; i++) {
      for (let k = i + 1; k < perPack.length; k++) {
        const a = perPack[i];
        const b = perPack[k];
        if (a.pack === b.pack) continue;
        if (!filtersOverlap(a.domainFilter, b.domainFilter)) continue;
        const key = [a.pack, b.pack].sort().join(' <> ');
        if (ALLOWED_OVERLAP_KEYS.has(key)) continue;
        violations.push(`${a.pack} (${a.domainFilter}) <-> ${b.pack} (${b.domainFilter})`);
      }
    }

    expect(violations).toEqual([]);
  });

  for (const f of files.filter(f => !f.startsWith('_'))) {
    it(`${f} validates against schema`, () => {
      const data = JSON.parse(
        fs.readFileSync(path.join(PACKS_DIR, f), 'utf8'),
      );
      const r = packFileSchema.safeParse(data);
      if (!r.success) console.error(f, JSON.stringify(r.error.issues, null, 2));
      expect(r.success).toBe(true);
    });
  }
});
