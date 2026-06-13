import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let uiLanguage: string | (() => string) = 'en';

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
  uiLanguage = 'en';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDocsUrl', () => {
  it('returns the root URL when the UI language is en', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/');
  });

  it('returns the French subpath when the UI language is fr', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/fr/');
  });

  it('returns the Spanish subpath when the UI language is es', async () => {
    uiLanguage = 'es';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl()).toBe('https://docs.esprit-vorace.fr/es/');
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

  it('appends a section path with trailing slash', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl('guides/sessions')).toBe('https://docs.esprit-vorace.fr/guides/sessions/');
  });

  it('combines locale and section', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl('guides/sessions')).toBe('https://docs.esprit-vorace.fr/fr/guides/sessions/');
  });

  it('strips leading and trailing slashes from the section', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl('/guides/sessions/')).toBe('https://docs.esprit-vorace.fr/guides/sessions/');
  });

  it('keeps the trailing slash on the path and appends the fragment after it', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl('guides/domain-rules#create')).toBe(
      'https://docs.esprit-vorace.fr/guides/domain-rules/#create',
    );
  });

  it('combines locale, section and fragment', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrl } = await import('../../src/utils/docsUrl');

    expect(getDocsUrl('guides/sessions#snapshot')).toBe(
      'https://docs.esprit-vorace.fr/fr/guides/sessions/#snapshot',
    );
  });
});

describe('getDocsUrlForTab', () => {
  it('maps a known tab to its docs section', async () => {
    uiLanguage = 'es';
    const { getDocsUrlForTab } = await import('../../src/utils/docsUrl');

    expect(getDocsUrlForTab('rules')).toBe(
      'https://docs.esprit-vorace.fr/es/guides/domain-rules/',
    );
  });

  it('maps the home tab to the discovery page', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrlForTab } = await import('../../src/utils/docsUrl');

    expect(getDocsUrlForTab('home')).toBe(
      'https://docs.esprit-vorace.fr/fr/discover/why/',
    );
  });

  it('falls back to the locale root when the tab is unknown', async () => {
    uiLanguage = 'fr-FR';
    const { getDocsUrlForTab } = await import('../../src/utils/docsUrl');

    expect(getDocsUrlForTab('does-not-exist')).toBe('https://docs.esprit-vorace.fr/fr/');
  });

  it('falls back to the locale root for an undefined tab', async () => {
    uiLanguage = 'en-US';
    const { getDocsUrlForTab } = await import('../../src/utils/docsUrl');

    expect(getDocsUrlForTab(undefined)).toBe('https://docs.esprit-vorace.fr/');
  });
});
