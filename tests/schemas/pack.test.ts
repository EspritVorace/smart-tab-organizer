import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));
vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import {
  localizedStringSchema,
  packParamSchema,
  packManifestSchema,
  packFileSchema,
  packCategoriesFileSchema,
} from '../../src/schemas/pack';
import { importDataSchema } from '../../src/schemas/importExport';

const validRule = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  presetId: null,
  enabled: true,
};

describe('localizedStringSchema', () => {
  it('accepte une string simple non vide', () => {
    expect(localizedStringSchema.safeParse('Cloud Providers').success).toBe(true);
  });

  it('accepte un record avec en/fr/es', () => {
    expect(
      localizedStringSchema.safeParse({
        en: 'Cloud Providers',
        fr: 'Fournisseurs Cloud',
        es: 'Proveedores Cloud',
      }).success,
    ).toBe(true);
  });

  it('accepte un record partiel { en } uniquement', () => {
    expect(localizedStringSchema.safeParse({ en: 'Hello' }).success).toBe(true);
  });

  it('rejette une string vide', () => {
    expect(localizedStringSchema.safeParse('').success).toBe(false);
  });

  it('rejette un record vide', () => {
    expect(localizedStringSchema.safeParse({}).success).toBe(false);
  });
});

describe('packParamSchema', () => {
  it('accepte un param dont le default figure dans options', () => {
    const result = packParamSchema.safeParse({
      id: 'service',
      label: 'Service',
      default: 'aws',
      options: [
        { value: 'aws', label: 'AWS' },
        { value: 'gcp', label: 'GCP' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejette un param dont le default ne figure pas dans options', () => {
    const result = packParamSchema.safeParse({
      id: 'service',
      label: 'Service',
      default: 'azure',
      options: [
        { value: 'aws', label: 'AWS' },
        { value: 'gcp', label: 'GCP' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejette un param avec options vide', () => {
    const result = packParamSchema.safeParse({
      id: 'service',
      label: 'Service',
      default: 'aws',
      options: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('packManifestSchema', () => {
  it('accepte un manifest avec categoryId seul', () => {
    const result = packManifestSchema.safeParse({
      id: 'pack-1',
      name: 'Cloud',
      categoryId: 'cloud',
    });
    expect(result.success).toBe(true);
  });

  it('accepte un manifest avec category seul', () => {
    const result = packManifestSchema.safeParse({
      id: 'pack-1',
      name: 'Cloud',
      category: { en: 'Cloud', fr: 'Cloud' },
    });
    expect(result.success).toBe(true);
  });

  it('rejette un manifest avec categoryId ET category', () => {
    const result = packManifestSchema.safeParse({
      id: 'pack-1',
      name: 'Cloud',
      categoryId: 'cloud',
      category: 'Cloud',
    });
    expect(result.success).toBe(false);
  });

  it('rejette un manifest sans categoryId ni category', () => {
    const result = packManifestSchema.safeParse({
      id: 'pack-1',
      name: 'Cloud',
    });
    expect(result.success).toBe(false);
  });
});

describe('packFileSchema', () => {
  it('accepte un fichier de pack complet', () => {
    const result = packFileSchema.safeParse({
      version: 1,
      pack: {
        id: 'pack-1',
        name: 'GitHub',
        categoryId: 'dev',
      },
      domainRules: [validRule],
    });
    expect(result.success).toBe(true);
  });

  it('rejette une version differente de 1', () => {
    const result = packFileSchema.safeParse({
      version: 2,
      pack: { id: 'pack-1', name: 'GitHub', categoryId: 'dev' },
      domainRules: [validRule],
    });
    expect(result.success).toBe(false);
  });

  it('un fichier de pack passe a importDataSchema voit le bloc pack strippe', () => {
    const packPayload = {
      version: 1,
      pack: { id: 'pack-1', name: 'GitHub', categoryId: 'dev' },
      domainRules: [validRule],
    };
    const parsed = importDataSchema.parse(packPayload);
    expect('pack' in parsed).toBe(false);
    expect(parsed.domainRules).toHaveLength(1);
  });
});

describe('packCategoriesFileSchema', () => {
  it('accepte une liste vide', () => {
    expect(packCategoriesFileSchema.safeParse({ categories: [] }).success).toBe(true);
  });

  it('accepte des categories avec label localized record', () => {
    const result = packCategoriesFileSchema.safeParse({
      categories: [
        { id: 'cloud', label: { en: 'Cloud', fr: 'Cloud' } },
        { id: 'dev', label: 'Development' },
      ],
    });
    expect(result.success).toBe(true);
  });
});
