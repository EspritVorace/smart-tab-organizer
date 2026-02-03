import { type Preset, type PresetsFile, presetsFileSchema } from '../types/preset.js';

// Re-export types pour faciliter l'import
export type { Preset, PresetsFile } from '../types/preset.js';

// Cache pour les presets
let presetsCache: PresetsFile | null = null;

// Fonction pour charger les presets depuis le fichier JSON
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
    console.error('Error loading presets:', error);
    // Retourner une structure vide en cas d'erreur
    return { categories: [] };
  }
}

// Fonction pour obtenir tous les presets sous forme de liste plate
export async function getAllPresets(): Promise<Preset[]> {
  const presetsFile = await loadPresets();
  return presetsFile.categories.flatMap(category => category.presets);
}

// Fonction pour obtenir un preset par ID
export async function getPresetById(id: string): Promise<Preset | null> {
  const presets = await getAllPresets();
  return presets.find(preset => preset.id === id) || null;
}

// Fonction pour obtenir les presets adaptés à un domaine
export async function getPresetsForDomain(domain: string): Promise<Preset[]> {
  const presets = await getAllPresets();
  return presets.filter(preset => 
    preset.domainFilters.some(filter => 
      filter === '*' || domain.includes(filter.replace('*', ''))
    )
  );
}

// Fonction pour invalider le cache (utile pour les tests)
export function clearPresetsCache(): void {
  presetsCache = null;
}