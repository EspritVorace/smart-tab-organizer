import { type Preset, type PresetsFile, presetsFileSchema } from '@/types/preset.js';
import { logger } from './logger.js';

export type { Preset, PresetsFile, PresetCategory } from '@/types/preset.js';

let presetsCache: PresetsFile | null = null;

export async function loadPresets(): Promise<PresetsFile> {
  if (presetsCache) {
    return presetsCache;
  }

  try {
    const response = await fetch('/data/presets.json');
    if (!response.ok) {
      throw new Error(`Failed to load presets: ${response.status}`);
    }

    const data = await response.json();
    presetsCache = presetsFileSchema.parse(data);
    return presetsCache;
  } catch (error) {
    logger.error('Error loading presets:', error);
    return { categories: [] };
  }
}

export async function getAllPresets(): Promise<Preset[]> {
  const presetsFile = await loadPresets();
  return presetsFile.categories.flatMap(category => category.presets);
}

export async function getPresetById(id: string): Promise<Preset | null> {
  const presets = await getAllPresets();
  return presets.find(preset => preset.id === id) || null;
}

export async function getPresetsForDomain(domain: string): Promise<Preset[]> {
  const presets = await getAllPresets();
  return presets.filter(preset =>
    preset.domainFilters.some(filter =>
      filter === '*' || domain.includes(filter.replace('*', ''))
    )
  );
}

export function clearPresetsCache(): void {
  presetsCache = null;
}

