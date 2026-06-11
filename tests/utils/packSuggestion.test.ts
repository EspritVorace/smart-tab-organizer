import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));
vi.mock('../../src/utils/i18n.js', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import {
  scorePacksByOpenTabs,
  DEFAULT_SUGGESTION_MIN_TABS,
} from '../../src/utils/packSuggestion';
import type { PackFile } from '../../src/schemas/pack';
import type { ImportDomainRule } from '../../src/schemas/importExport';

const baseRule = (overrides: Partial<ImportDomainRule>): ImportDomainRule => ({
  id: overrides.id ?? 'r1',
  domainFilter: overrides.domainFilter ?? 'example.com',
  label: overrides.label ?? 'Label',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'smart',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  enabled: true,
  ...overrides,
});

const githubPack: PackFile = {
  version: 1,
  pack: { id: 'pk-github', name: 'GitHub', categoryId: 'dev' },
  domainRules: [baseRule({ id: 'gh-1', domainFilter: 'github.com', label: 'GitHub' })],
};

const jiraPack: PackFile = {
  version: 1,
  pack: { id: 'pk-jira', name: 'Jira', categoryId: 'dev' },
  domainRules: [
    baseRule({ id: 'jira-1', domainFilter: 'atlassian.net', label: 'Jira' }),
    baseRule({ id: 'jira-2', domainFilter: 'jira.com', label: 'Jira Cloud' }),
  ],
};

const emptySet: ReadonlySet<string> = new Set<string>();

describe('scorePacksByOpenTabs', () => {
  it('scores a pack by the number of open tabs matching its rules', () => {
    const tabs = [
      'https://github.com/a/b',
      'https://sub.github.com/x',
      'https://example.org/',
    ];
    const result = scorePacksByOpenTabs(tabs, [githubPack], emptySet);
    expect(result).toHaveLength(1);
    expect(result[0].pack.pack.id).toBe('pk-github');
    expect(result[0].matchedTabs).toBe(2);
    expect(result[0].matchedDomains).toBe(2);
    expect(result[0].installStatus).toBe('not-installed');
  });

  it('returns nothing when no tab matches', () => {
    const tabs = ['https://example.org/', 'https://news.ycombinator.com/'];
    expect(scorePacksByOpenTabs(tabs, [githubPack, jiraPack], emptySet)).toEqual([]);
  });

  it('respects the minimum-tabs threshold', () => {
    const tabs = ['https://github.com/only-one'];
    expect(scorePacksByOpenTabs(tabs, [githubPack], emptySet)).toEqual([]);

    const enough = ['https://github.com/a', 'https://github.com/b'];
    expect(scorePacksByOpenTabs(enough, [githubPack], emptySet)).toHaveLength(1);
    expect(DEFAULT_SUGGESTION_MIN_TABS).toBe(2);
  });

  it('honors a custom minTabs option', () => {
    const tabs = ['https://github.com/only-one'];
    const result = scorePacksByOpenTabs(tabs, [githubPack], emptySet, { minTabs: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].matchedTabs).toBe(1);
  });

  it('ignores non-http(s) URLs', () => {
    const tabs = [
      'chrome://extensions',
      'about:blank',
      'chrome-extension://abc/popup.html',
      'https://github.com/a',
      'https://github.com/b',
    ];
    const result = scorePacksByOpenTabs(tabs, [githubPack], emptySet);
    expect(result[0].matchedTabs).toBe(2);
  });

  it('excludes fully installed packs but keeps partially installed ones', () => {
    const tabs = ['https://atlassian.net/a', 'https://jira.com/b'];
    const installedAll = new Set(['jira-1', 'jira-2']);
    expect(scorePacksByOpenTabs(tabs, [jiraPack], installedAll)).toEqual([]);

    const installedPartial = new Set(['jira-1']);
    const partial = scorePacksByOpenTabs(tabs, [jiraPack], installedPartial);
    expect(partial).toHaveLength(1);
    expect(partial[0].installStatus).toBe('partial');
  });

  it('orders by matched tabs, then distinct domains, then catalog order', () => {
    const tabs = [
      // 2 github tabs, 1 distinct domain
      'https://github.com/a',
      'https://github.com/b',
      // 2 jira tabs, 2 distinct domains
      'https://atlassian.net/a',
      'https://jira.com/b',
    ];
    const result = scorePacksByOpenTabs(tabs, [githubPack, jiraPack], emptySet);
    expect(result.map((s) => s.pack.pack.id)).toEqual(['pk-jira', 'pk-github']);
    expect(result[0].matchedDomains).toBe(2);
    expect(result[1].matchedDomains).toBe(1);
  });

  it('truncates to the max option (hero limit)', () => {
    const tabs = [
      'https://github.com/a',
      'https://github.com/b',
      'https://atlassian.net/a',
      'https://jira.com/b',
    ];
    const result = scorePacksByOpenTabs(tabs, [githubPack, jiraPack], emptySet, { max: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].pack.pack.id).toBe('pk-jira');
  });

  it('matches subdomains through matchesDomain wildcards', () => {
    const tabs = [
      'https://team.atlassian.net/board',
      'https://other.atlassian.net/x',
    ];
    const result = scorePacksByOpenTabs(tabs, [jiraPack], emptySet);
    expect(result[0].matchedTabs).toBe(2);
    expect(result[0].matchedDomains).toBe(2);
  });
});
