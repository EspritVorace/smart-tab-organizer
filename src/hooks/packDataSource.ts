import categoriesData from '@/data/packs/_categories.json';

/**
 * Glob-based loader for pack files. Wrapped in its own module so tests can
 * mock it without touching Vite's `import.meta.glob` directly.
 *
 * Files matching `_*.json` (notably `_categories.json`) are filtered out by
 * convention so they never show up as packs.
 */
const rawPackModules = import.meta.glob('@/data/packs/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

export interface PackSourceEntry {
  path: string;
  data: unknown;
}

export function getPackSourceEntries(): PackSourceEntry[] {
  return Object.entries(rawPackModules)
    .filter(([path]) => {
      const filename = path.split('/').pop() ?? '';
      return !filename.startsWith('_');
    })
    .map(([path, data]) => ({ path, data }));
}

export function getCategoriesSource(): unknown {
  return categoriesData;
}
