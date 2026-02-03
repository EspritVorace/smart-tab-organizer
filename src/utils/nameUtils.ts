import { getMessage } from './i18n';

/**
 * Génère un nom unique basé sur un nom de base et une liste de noms existants
 * @param baseName Le nom de base à utiliser
 * @param existingNames Liste des noms existants (insensible à la casse)
 * @param suffix Le suffixe à utiliser (par défaut "Copy" traduit)
 * @returns Un nom unique
 */
export function generateUniqueName(
  baseName: string,
  existingNames: string[],
  suffix?: string
): string {
  const defaultSuffix = suffix || getMessage('copy');
  const normalizedExisting = existingNames.map(name => name.toLowerCase());
  const normalizedBase = baseName.toLowerCase();
  
  // Si le nom de base n'existe pas, on le retourne
  if (!normalizedExisting.includes(normalizedBase)) {
    return baseName;
  }
  
  // Sinon, on cherche un suffixe numérique
  let counter = 1;
  let candidateName: string;
  
  do {
    candidateName = counter === 1 
      ? `${baseName} (${defaultSuffix})`
      : `${baseName} (${defaultSuffix} ${counter})`;
    counter++;
  } while (normalizedExisting.includes(candidateName.toLowerCase()));
  
  return candidateName;
}

/**
 * Type pour les entités avec un nom/label
 */
export interface NamedEntity {
  id?: string; // Optionnel pour la compatibilité avec les types existants
  label?: string;
  name?: string;
}

/**
 * Extrait le nom d'une entité (label ou name)
 * @param entity L'entité dont extraire le nom
 * @returns Le nom de l'entité
 */
export function extractName(entity: NamedEntity): string {
  return entity.label || entity.name || '';
}

/**
 * Crée une copie d'une entité avec un nom unique
 * @param entity L'entité à copier
 * @param existingEntities Liste des entités existantes
 * @param newId Nouvel ID pour la copie
 * @returns Une copie avec un nom unique
 */
export function createUniqueNamedCopy<T extends NamedEntity & { id: string }>(
  entity: T,
  existingEntities: T[],
  newId: string
): T {
  const nameField = 'label' in entity && entity.label ? 'label' : 'name';
  const originalName = extractName(entity);
  
  const existingNames = existingEntities.map(item => extractName(item));
  const copySuffix = getMessage('copySuffix');
  const uniqueName = generateUniqueName(originalName, existingNames, copySuffix);
  
  return {
    ...entity,
    id: newId,
    [nameField]: uniqueName
  } as T;
}