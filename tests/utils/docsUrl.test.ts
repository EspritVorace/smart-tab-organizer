import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let uiLanguage: string | (() => string) = 'fr';

vi.mock('wxt/browser', () => ({
  browser: {
    i18n: {
      getUILanguage: () => {
        if (typeof uiLanguage === 'function') return uiLanguage();
        return uiLanguage;
      },
    },
  },
}));

beforeEach(() => {
  uiLanguage = 'fr';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDocsUrl', () => {
  it('returns the English subpath when the UI language is en', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/en/');
  });

  it('returns the Spanish subpath when the UI language is es', async () => {
    uiLanguage = 'es';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/es/');
  });

  it('returns the root URL for the French UI language', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/');
  });

  it('returns the root URL for unknown languages', async () => {
    uiLanguage = 'de';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/');
  });

  it('returns a docs URL even when getUILanguage throws', async () => {
    uiLanguage = () => {
      throw new Error('boom');
    };
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl().startsWith('https://docs.esprit-vorace.fr/')).toBe(true);
  });
});
