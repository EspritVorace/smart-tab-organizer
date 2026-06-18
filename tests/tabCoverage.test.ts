import { describe, it, expect } from 'vitest';
import {
  buildTabCoverageEntries,
  registrableDomainFromHost,
  type CoverageTabInput,
} from '../src/utils/tabCoverage';
import type { DomainRuleSetting } from '../src/types/syncSettings';

/** Minimal enabled rule: only `domainFilter` and `enabled` drive matching. */
function rule(domainFilter: string, enabled = true): DomainRuleSetting {
  return { domainFilter, enabled } as DomainRuleSetting;
}

function tab(url: string): CoverageTabInput {
  return { url };
}

describe('registrableDomainFromHost', () => {
  it('strips a simple subdomain', () => {
    expect(registrableDomainFromHost('gist.github.com')).toBe('github.com');
  });

  it('keeps a bare registrable domain unchanged', () => {
    expect(registrableDomainFromHost('github.com')).toBe('github.com');
  });

  it('handles a compound public suffix', () => {
    expect(registrableDomainFromHost('a.b.example.co.uk')).toBe('example.co.uk');
  });

  it('falls back to the host when it is not a plain dotted domain', () => {
    expect(registrableDomainFromHost('localhost')).toBe('localhost');
  });
});

describe('buildTabCoverageEntries', () => {
  it('merges duplicate hosts and counts the tabs', () => {
    const entries = buildTabCoverageEntries(
      [
        tab('https://github.com/a'),
        tab('https://github.com/b'),
        tab('https://github.com/c'),
      ],
      [],
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ host: 'github.com', tabCount: 3 });
  });

  it('excludes non http(s) URLs', () => {
    const entries = buildTabCoverageEntries(
      [
        tab('chrome://extensions'),
        tab('about:blank'),
        tab('file:///tmp/x.html'),
        tab('https://example.com/'),
      ],
      [],
    );
    expect(entries.map((e) => e.host)).toEqual(['example.com']);
  });

  it('flags coverage from an enabled matching rule', () => {
    const entries = buildTabCoverageEntries(
      [tab('https://mail.google.com/'), tab('https://example.com/')],
      [rule('google.com')],
    );
    const byHost = Object.fromEntries(entries.map((e) => [e.host, e.covered]));
    expect(byHost['mail.google.com']).toBe(true);
    expect(byHost['example.com']).toBe(false);
  });

  it('ignores disabled rules for coverage', () => {
    const entries = buildTabCoverageEntries(
      [tab('https://mail.google.com/')],
      [rule('google.com', false)],
    );
    expect(entries[0].covered).toBe(false);
  });

  it('sorts not covered first, then by tab count descending', () => {
    const entries = buildTabCoverageEntries(
      [
        // covered host with 3 tabs
        tab('https://mail.google.com/1'),
        tab('https://mail.google.com/2'),
        tab('https://mail.google.com/3'),
        // not covered host with 1 tab
        tab('https://example.com/'),
        // not covered host with 2 tabs
        tab('https://news.ycombinator.com/1'),
        tab('https://news.ycombinator.com/2'),
      ],
      [rule('google.com')],
    );
    expect(entries.map((e) => e.host)).toEqual([
      'news.ycombinator.com', // not covered, 2 tabs
      'example.com', // not covered, 1 tab
      'mail.google.com', // covered, 3 tabs (covered always last)
    ]);
  });

  it('derives the registrable domain per entry', () => {
    const entries = buildTabCoverageEntries(
      [tab('https://a.b.example.co.uk/')],
      [],
    );
    expect(entries[0].registrableDomain).toBe('example.co.uk');
  });

  it('skips tabs without a url', () => {
    const entries = buildTabCoverageEntries([{}, tab('https://example.com/')], []);
    expect(entries).toHaveLength(1);
  });
});
