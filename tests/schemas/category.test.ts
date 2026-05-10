import { describe, it, expect } from 'vitest';
import { ruleCategorySchema, categoriesFileSchema } from '../../src/schemas/category';

describe('ruleCategorySchema', () => {
  it('accepts a built-in category with labelKey only', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'development',
      emoji: '💻',
      color: 'blue',
      labelKey: 'category_development',
      builtIn: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a custom category with label only', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'gaming',
      emoji: '🎮',
      color: 'purple',
      label: 'Gaming',
      builtIn: false,
    });
    expect(result.success).toBe(true);
  });

  it('defaults builtIn to false', () => {
    const parsed = ruleCategorySchema.parse({
      id: 'x',
      emoji: '✨',
      color: 'green',
      label: 'X',
    });
    expect(parsed.builtIn).toBe(false);
  });

  it('rejects a category with neither labelKey nor label', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '✨',
      color: 'green',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported color', () => {
    const result = ruleCategorySchema.safeParse({
      id: 'x',
      emoji: '✨',
      color: 'magenta',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty id', () => {
    const result = ruleCategorySchema.safeParse({
      id: '',
      emoji: '✨',
      color: 'green',
      label: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty emoji', () => {
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
  it('accepts an empty list', () => {
    const result = categoriesFileSchema.safeParse({ categories: [] });
    expect(result.success).toBe(true);
  });

  it('accepts the complete seed file', () => {
    const result = categoriesFileSchema.safeParse({
      categories: [
        { id: 'development', emoji: '💻', color: 'blue', labelKey: 'category_development', builtIn: true },
        { id: 'media', emoji: '🎬', color: 'red', labelKey: 'category_media', builtIn: true },
      ],
    });
    expect(result.success).toBe(true);
  });
});
