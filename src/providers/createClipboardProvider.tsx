
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { generateUUID } from '../utils/utils';
import { createUniqueNamedCopy, type NamedEntity } from '../utils/nameUtils';

// Interface pour le contexte du presse-papiers
interface ClipboardContextType<T> {
  copy: (item: T) => void;
  paste: (existingItems: T[]) => T | null;
  isPasteAvailable: boolean;
}

// Factory pour créer un contexte de presse-papiers
export function createClipboardProvider<T extends NamedEntity & { id: string }>() {
  const ClipboardContext = createContext<ClipboardContextType<T> | undefined>(undefined);

  const ClipboardProvider = ({ children }: { children: ReactNode }) => {
    const [clipboardItem, setClipboardItem] = useState<T | null>(null);

    const copy = useCallback((item: T) => {
      setClipboardItem(item);
    }, []);

    const paste = useCallback((existingItems: T[]): T | null => {
      if (!clipboardItem) {
        return null;
      }
      const newId = generateUUID();
      return createUniqueNamedCopy(clipboardItem, existingItems, newId);
    }, [clipboardItem]);

    const isPasteAvailable = clipboardItem !== null;

    const value = {
      copy,
      paste,
      isPasteAvailable,
    };

    return (
      <ClipboardContext.Provider value={value}>
        {children}
      </ClipboardContext.Provider>
    );
  };

  const useClipboard = (): ClipboardContextType<T> => {
    const context = useContext(ClipboardContext);
    if (context === undefined) {
      throw new Error('useClipboard must be used within a ClipboardProvider');
    }
    return context;
  };

  return { ClipboardProvider, useClipboard };
}
