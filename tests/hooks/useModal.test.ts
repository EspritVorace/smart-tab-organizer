import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from '../../src/hooks/useModal';

interface TestItem {
  id: string;
  name: string;
}

describe('useModal', () => {
  describe('état initial', () => {
    it('devrait commencer fermé sans élément en édition', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('openForCreate', () => {
    it('devrait ouvrir la modale en mode création', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      act(() => {
        result.current.openForCreate();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });

    it('devrait réinitialiser l\'élément en édition si on était en mode édition', () => {
      const { result } = renderHook(() => useModal<TestItem>());
      const item = { id: '1', name: 'Test Item' };

      // D'abord ouvrir en mode édition
      act(() => {
        result.current.openForEdit(item);
      });
      expect(result.current.editingItem).toEqual(item);

      // Puis ouvrir en mode création
      act(() => {
        result.current.openForCreate();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('openForEdit', () => {
    it('devrait ouvrir la modale avec l\'élément à éditer', () => {
      const { result } = renderHook(() => useModal<TestItem>());
      const item = { id: '1', name: 'Test Item' };

      act(() => {
        result.current.openForEdit(item);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.editingItem).toEqual(item);
      expect(result.current.isEditing).toBe(true);
    });

    it('devrait pouvoir changer l\'élément en édition', () => {
      const { result } = renderHook(() => useModal<TestItem>());
      const item1 = { id: '1', name: 'Item 1' };
      const item2 = { id: '2', name: 'Item 2' };

      act(() => {
        result.current.openForEdit(item1);
      });
      expect(result.current.editingItem).toEqual(item1);

      act(() => {
        result.current.openForEdit(item2);
      });
      expect(result.current.editingItem).toEqual(item2);
    });
  });

  describe('close', () => {
    it('devrait fermer la modale et réinitialiser l\'état', () => {
      const { result } = renderHook(() => useModal<TestItem>());
      const item = { id: '1', name: 'Test Item' };

      // Ouvrir en mode édition
      act(() => {
        result.current.openForEdit(item);
      });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.editingItem).toEqual(item);

      // Fermer
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.editingItem).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });

    it('devrait fonctionner même si la modale est déjà fermée', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.editingItem).toBeNull();
    });
  });

  describe('isEditing', () => {
    it('devrait être false en mode création', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      act(() => {
        result.current.openForCreate();
      });

      expect(result.current.isEditing).toBe(false);
    });

    it('devrait être true en mode édition', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      act(() => {
        result.current.openForEdit({ id: '1', name: 'Test' });
      });

      expect(result.current.isEditing).toBe(true);
    });

    it('devrait être false après fermeture', () => {
      const { result } = renderHook(() => useModal<TestItem>());

      act(() => {
        result.current.openForEdit({ id: '1', name: 'Test' });
      });
      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('typage générique', () => {
    interface ComplexItem {
      id: number;
      data: {
        nested: string;
      };
    }

    it('devrait fonctionner avec des types complexes', () => {
      const { result } = renderHook(() => useModal<ComplexItem>());
      const item: ComplexItem = { id: 42, data: { nested: 'value' } };

      act(() => {
        result.current.openForEdit(item);
      });

      expect(result.current.editingItem).toEqual(item);
      expect(result.current.editingItem?.data.nested).toBe('value');
    });
  });
});
