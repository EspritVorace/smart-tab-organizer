import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getSettings } from '../../src/background/settings';
import { defaultAppSettings } from '../../src/types/syncSettings';

describe('background/settings', () => {
  it('returns default settings when storage is empty', async () => {
    const settings = await getSettings();
    expect(settings.globalGroupingEnabled).toBe(defaultAppSettings.globalGroupingEnabled);
    expect(settings.globalDeduplicationEnabled).toBe(defaultAppSettings.globalDeduplicationEnabled);
    expect(Array.isArray(settings.domainRules)).toBe(true);
  });

  it('returns an empty domainRules array when none are stored', async () => {
    const settings = await getSettings();
    expect(settings.domainRules).toEqual([]);
  });

  it('normalises stored domain rules with default field values', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'r1',
          domainFilter: 'github.com',
          label: 'GitHub',
          enabled: true,
          badge: '',
          groupNameSource: undefined,
          deduplicationMatchMode: undefined,
          deduplicationEnabled: undefined,
          groupingEnabled: undefined,
          titleParsingRegEx: '',
          urlParsingRegEx: undefined,
          ignoredQueryParams: [],
          presetId: null,
          color: 'blue',
          categoryId: null,
        },
      ],
    });

    const settings = await getSettings();
    const rule = settings.domainRules[0];
    expect(rule.deduplicationEnabled).toBe(true);
    expect(rule.groupingEnabled).toBe(true);
    expect(rule.deduplicationMatchMode).toBe('exact');
    expect(rule.groupNameSource).toBe('title');
    expect(rule.urlParsingRegEx).toBe('');
  });

  it('strips legacy wildcard prefix from domainFilter', async () => {
    await fakeBrowser.storage.local.set({
      domainRules: [
        {
          id: 'r1',
          domainFilter: '*.github.com',
          label: 'GitHub',
          enabled: true,
          badge: '',
          titleParsingRegEx: '',
          urlParsingRegEx: '',
          ignoredQueryParams: [],
          presetId: null,
          color: 'blue',
          categoryId: null,
        },
      ],
    });

    const settings = await getSettings();
    expect(settings.domainRules[0].domainFilter).toBe('github.com');
  });
});
