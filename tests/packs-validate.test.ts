import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { packCategoriesFileSchema, packFileSchema } from '@/schemas/pack';

const PACKS_DIR = path.resolve(__dirname, '../src/data/packs');

describe('packs data files', () => {
  const files = fs.readdirSync(PACKS_DIR).filter(f => f.endsWith('.json'));

  it('_categories.json validates against schema', () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(PACKS_DIR, '_categories.json'), 'utf8'),
    );
    const r = packCategoriesFileSchema.safeParse(data);
    if (!r.success) console.error(JSON.stringify(r.error.issues, null, 2));
    expect(r.success).toBe(true);
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
