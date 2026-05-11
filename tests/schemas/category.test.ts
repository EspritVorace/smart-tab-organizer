import { describe, it, expect } from 'vitest';
import { ruleCategorySchema, categoriesFileSchema } from '../../src/schemas/category';

describe('ruleCategorySchema', () => {
  it('accepts a built-in category with labelKey only', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'development',
      emoji: '💻',
      labelKey: 'category_development',
      builtIn: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a custom category with label only', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'gaming',
      emoji: '🎮',
      label: 'Gaming',
      builtIn: false,
    });
    expect(result.success).toBe(true);
  });

  it('defaults builtIn to false', () => {
    const parsed = ruleCategorySchema.parse({
      id: 'x',
      emoji: '✨',
      label: 'X',
    });
    expect(parsed.builtIn).toBe(false);
  });

  it('rejects a category with neither labelKey nor label', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '✨',
    });
    expect(result.success).toBe(false);
  });

  it('strips an unknown color field (color belongs on rules now)', () => {
    const parsed = ruleCategorySchema.parse({
      id: 'x',
      emoji: '✨',
      color: 'blue',
      label: 'X',
    });
    expect((parsed as Record<string, unknown>).color).toBeUndefined();
  });

  it('rejects an empty id', () => {
    const result = ruleCategorySchema.safeParse({
      id: '',
      emoji: '✨',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty emoji', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });
});

describe('categoriesFileSchema', () => {
  it('accepts an empty list', () => {
    const result = categoriesFileSchema.safeParse({ categories: [] });
    expect(result.success).toBe(true);
  });

  it('accepts the complete seed file', () => {
    const result = categoriesFileSchema.safeParse({
      categories: [
        { id: 'development', emoji: '💻', labelKey: 'category_development', builtIn: true },
        { id: 'media', emoji: '🎬', labelKey: 'category_media', builtIn: true },
      ],
    });
    expect(result.success).toBe(true);
  });
});
