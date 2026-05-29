import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { packFileSchema } from '@/schemas/pack';
import { categoriesFileSchema } from '@/schemas/category';

const PACKS_DIR = path.resolve(__dirname, '../src/data/packs');
const CATEGORIES_FILE = path.resolve(__dirname, '../src/data/categories.json');

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
