import type { PresetCategory } from '@/types/preset';
import { matchesDomain } from './utils.js';

/**
 * Build a representative http(s) URL from an entered domain filter so the
 * preset matcher can be reused verbatim. A leading `*.` is stripped (the bare
 * apex is the most representative sample), mirroring how `domainToRegex`
 * normalizes filters at runtime.
 */
function buildSampleUrl(domain: string): string | null {
  const trimmed = domain.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed;
  if (!cleaned) return null;
  return `https://${cleaned}/`;
}

/**
 * Return the preset ids that specifically target the entered domain, in catalog
 * order. A preset qualifies when at least one of its non-`*` `domainFilters`
 * matches a sample URL built from the domain, using the runtime matcher
 * {@link matchesDomain} (via `domainToRegex`). Generic (`*`) filters never
 * count, so cross-domain presets are never suggested. An empty or whitespace
 * domain yields no suggestions.
 *
 * Pure function: no storage, no network, no side effects.
 */
export function getSuggestedPresetIds(
  domain: string | null | undefined,
  categories: PresetCategory[],
): string[] {
  const sampleUrl = domain ? buildSampleUrl(domain) : null;
  if (!sampleUrl) return [];

  const ids: string[] = [];
  for (const category of categories) {
    for (const preset of category.presets) {
      const specificFilters = preset.domainFilters.filter((filter) => filter !== '*');
      if (specificFilters.some((filter) => matchesDomain(sampleUrl, filter))) {
        ids.push(preset.id);
      }
    }
  }
  return ids;
}
