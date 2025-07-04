import { useState } from 'react';
import { generateUUID } from '../utils/utils';
import { createUniqueNamedCopy, type NamedEntity } from '../utils/nameUtils';

/**
 * Hook pour la gestion du copier-coller d'entités avec noms uniques
 * @template T Type de l'entité (doit avoir un id et un label/name)
 */
export function useClipboard<T extends NamedEntity & { id: string }>() {
  const [clipboardItem, setClipboardItem] = useState<T | null>(null);
  
  /**
   * Copie un élément dans le presse-papiers
   * @param item L'élément à copier
   */
  const copy = (item: T) => {
    setClipboardItem(item);
  };
  
  /**
   * Colle l'élément du presse-papiers avec un nom unique
   * @param existingItems Liste des éléments existants pour éviter les doublons
   * @returns L'élément collé avec un nom unique, ou null si rien à coller
   */
  const paste = (existingItems: T[]): T | null => {
    if (!clipboardItem) return null;
    
    const newId = generateUUID();
    return createUniqueNamedCopy(clipboardItem, existingItems, newId);
  };
  
  /**
   * Vide le presse-papiers
   */
  const clear = () => {
    setClipboardItem(null);
  };
  
  /**
   * Indique si le presse-papiers contient un élément
   */
  const isPasteAvailable = clipboardItem !== null;
  
  /**
   * Retourne l'élément actuellement dans le presse-papiers
   */
  const getClipboardItem = () => clipboardItem;
  
  return {
    copy,
    paste,
    clear,
    isPasteAvailable,
    getClipboardItem
  };
}

/**
 * Type pour les props des composants supportant le copier-coller
 */
export interface ClipboardActionProps<T extends NamedEntity & { id: string }> {
  onCopy: (item: T) => void;
  onPaste: (existingItems: T[]) => void;
  isPasteAvailable: boolean;
}