import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  resolveLocalized,
  resolvePackName,
  resolvePackDescription,
  resolvePackParamLabel,
  resolvePackOptionLabel,
  resolvePackCategoryLabel,
} from '../../src/utils/packLabel';

const mockGetUILanguage = vi.fn();

beforeEach(() => {
  (fakeBrowser as unknown as { i18n: unknown }).i18n = {
    getUILanguage: mockGetUILanguage,
  };
  mockGetUILanguage.mockReset();
});

afterEach(() => {
  delete (fakeBrowser as unknown as { i18n?: unknown }).i18n;
});

describe('resolveLocalized', () => {
  it('returns a plain string value as-is', () => {
    expect(resolveLocalized('plain', 'fallback')).toBe('plain');
  });

  it('uses exact locale match when present', () => {
    mockGetUILanguage.mockReturnValue('fr-FR');
    expect(resolveLocalized({ 'fr-FR': 'Bonjour', en: 'Hello' })).toBe('Bonjour');
  });

  it('falls back to the language base when exact locale is missing', () => {
    mockGetUILanguage.mockReturnValue('fr-CA');
    expect(resolveLocalized({ fr: 'Salut', en: 'Hello' })).toBe('Salut');
  });

  it('falls back to "en" when nothing else matches', () => {
    mockGetUILanguage.mockReturnValue('de-DE');
    expect(resolveLocalized({ en: 'Hello', es: 'Hola' })).toBe('Hello');
  });

  it('falls back to first record entry when no English entry exists', () => {
    mockGetUILanguage.mockReturnValue('zh');
    expect(resolveLocalized({ es: 'Hola', it: 'Ciao' })).toBe('Hola');
  });

  it('returns the fallback when value is undefined', () => {
    expect(resolveLocalized(undefined, 'default-text')).toBe('default-text');
  });

  it('returns empty string fallback by default', () => {
    expect(resolveLocalized(undefined)).toBe('');
  });

  it('returns the fallback when the record is empty', () => {
    mockGetUILanguage.mockReturnValue('fr');
    expect(resolveLocalized({}, 'fallback')).toBe('fallback');
  });

  it('handles getUILanguage throwing gracefully', () => {
    mockGetUILanguage.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(resolveLocalized({ en: 'Hello' })).toBe('Hello');
  });

  it('handles getUILanguage returning empty string', () => {
    mockGetUILanguage.mockReturnValue('');
    expect(resolveLocalized({ en: 'Hello' })).toBe('Hello');
  });
});

describe('resolvePackName', () => {
  it('resolves the localized name', () => {
    mockGetUILanguage.mockReturnValue('fr');
    expect(resolvePackName({ id: 'p1', name: { fr: 'NomFr', en: 'NameEn' } } as never)).toBe('NomFr');
  });

  it('falls back to the pack id when name is missing', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(resolvePackName({ id: 'pack-id', name: undefined } as never)).toBe('pack-id');
  });
});

describe('resolvePackDescription', () => {
  it('resolves the description string', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackDescription({ id: 'p', name: 'P', description: { en: 'Desc' } } as never),
    ).toBe('Desc');
  });

  it('returns empty string when description is missing', () => {
    expect(resolvePackDescription({ id: 'p', name: 'P' } as never)).toBe('');
  });
});

describe('resolvePackParamLabel', () => {
  it('resolves the param label', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackParamLabel({ id: 'param-1', label: { en: 'Region' } } as never),
    ).toBe('Region');
  });

  it('falls back to the param id when label cannot resolve', () => {
    expect(
      resolvePackParamLabel({ id: 'param-1', label: undefined } as never),
    ).toBe('param-1');
  });
});

describe('resolvePackOptionLabel', () => {
  it('resolves the option label', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackOptionLabel({ value: 'us-east-1', label: { en: 'US East' } } as never),
    ).toBe('US East');
  });

  it('falls back to the option value when label is missing', () => {
    expect(
      resolvePackOptionLabel({ value: 'us-east-1', label: undefined } as never),
    ).toBe('us-east-1');
  });
});

describe('resolvePackCategoryLabel', () => {
  it('resolves a PackCategory.label', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackCategoryLabel({ id: 'cloud', label: { en: 'Cloud' } } as never),
    ).toBe('Cloud');
  });

  it('returns empty string for a PackCategory whose label is undefined', () => {
    expect(
      resolvePackCategoryLabel({ id: 'cloud', label: undefined } as never),
    ).toBe('');
  });

  it('uses the category id as fallback when label record is empty', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackCategoryLabel({ id: 'cloud', label: {} } as never),
    ).toBe('cloud');
  });

  it('resolves PackManifest.category when set', () => {
    mockGetUILanguage.mockReturnValue('en');
    expect(
      resolvePackCategoryLabel({
        id: 'p1',
        name: 'Pack',
        category: { en: 'Inline' },
      } as never),
    ).toBe('Inline');
  });

  it('returns empty string when manifest has no category', () => {
    expect(
      resolvePackCategoryLabel({ id: 'p1', name: 'Pack' } as never),
    ).toBe('');
  });
});
