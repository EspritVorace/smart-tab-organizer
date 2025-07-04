import { useState } from 'react';
import type { SyncSettings } from '../types/syncSettings';

/**
 * Hook générique pour la gestion des modales de création/édition
 * @template T Type de l'entité gérée par la modale
 */
export function useModal<T>() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  
  /**
   * Ouvre la modale en mode création
   */
  const openForCreate = () => {
    setEditingItem(null);
    setIsOpen(true);
  };
  
  /**
   * Ouvre la modale en mode édition avec un élément existant
   * @param item L'élément à éditer
   */
  const openForEdit = (item: T) => {
    setEditingItem(item);
    setIsOpen(true);
  };
  
  /**
   * Ferme la modale et reset l'état
   */
  const close = () => {
    setIsOpen(false);
    setEditingItem(null);
  };
  
  /**
   * Indique si la modale est en mode édition
   */
  const isEditing = editingItem !== null;
  
  return {
    isOpen,
    editingItem,
    isEditing,
    openForCreate,
    openForEdit,
    close
  };
}

/**
 * Type pour les props communes des modales
 */
export interface BaseModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: T) => void;
  item?: T;
  syncSettings: SyncSettings;
}