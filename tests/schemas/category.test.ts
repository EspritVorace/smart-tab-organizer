import { describe, it, expect } from 'vitest';
import { ruleCategorySchema, categoriesFileSchema } from '../../src/schemas/category';

describe('ruleCategorySchema', () => {
  it('accepte une catégorie built-in avec labelKey uniquement', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'development',
      emoji: '💻',
      color: 'blue',
      labelKey: 'category_development',
      builtIn: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepte une catégorie custom avec label uniquement', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'gaming',
      emoji: '🎮',
      color: 'purple',
      label: 'Gaming',
      builtIn: false,
    });
    expect(result.success).toBe(true);
  });

  it('remplit builtIn à false par défaut', () => {
    const parsed = ruleCategorySchema.parse({
      id: 'x',
      emoji: '✨',
      color: 'green',
      label: 'X',
    });
    expect(parsed.builtIn).toBe(false);
  });

  it('rejette une catégorie sans labelKey ni label', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '✨',
      color: 'green',
    });
    expect(result.success).toBe(false);
  });

  it('rejette une couleur non supportée', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '✨',
      color: 'magenta',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un id vide', () => {
    const result = ruleCategorySchema.safeParse({
      id: '',
      emoji: '✨',
      color: 'green',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un emoji vide', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '',
      color: 'green',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });
});

describe('categoriesFileSchema', () => {
  it('accepte une liste vide', () => {
    const result = categoriesFileSchema.safeParse({ categories: [] });
    expect(result.success).toBe(true);
  });

  it('accepte le fichier de seed complet', () => {
    const result = categoriesFileSchema.safeParse({
      categories: [
        { id: 'development', emoji: '💻', color: 'blue', labelKey: 'category_development', builtIn: true },
        { id: 'media', emoji: '🎬', color: 'red', labelKey: 'category_media', builtIn: true },
      ],
    });
    expect(result.success).toBe(true);
  });
});
