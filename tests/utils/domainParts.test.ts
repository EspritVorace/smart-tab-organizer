import { describe, it, expect } from 'vitest';
import { isPlainDomain, splitDomainParts, type DomainPart } from '../../src/utils/domainParts';

/** Helper: map parts to a compact `{ text, kind }[]` for readable assertions. */
function annotate(value: string): { text: string; kind: DomainPart['kind'] }[] {
  return splitDomainParts(value).map((p) => ({ text: value.slice(p.from, p.to), kind: p.kind }));
}

describe('isPlainDomain', () => {
  it('accepts localhost and dotted hostnames', () => {
    expect(isPlainDomain('localhost')).toBe(true);
    expect(isPlainDomain('example.com')).toBe(true);
    expect(isPlainDomain('mail.google.com')).toBe(true);
  });

  it('rejects regex-like, bare, or trailing-dot values', () => {
    expect(isPlainDomain('github\\.com')).toBe(false);
    expect(isPlainDomain('^.*\\.foo\\.com$')).toBe(false);
    expect(isPlainDomain('example')).toBe(false);
    expect(isPlainDomain('example.com.')).toBe(false);
    expect(isPlainDomain('')).toBe(false);
  });
});

describe('splitDomainParts', () => {
  it('returns empty for non-plain-domain values', () => {
    expect(splitDomainParts('github\\.com')).toEqual([]);
    expect(splitDomainParts('example')).toEqual([]);
  });

  it('classifies a simple domain (domain + tld + dot)', () => {
    expect(annotate('example.com')).toEqual([
      { text: 'example', kind: 'domain' },
      { text: '.', kind: 'dot' },
      { text: 'com', kind: 'tld' },
    ]);
  });

  it('classifies a subdomain', () => {
    expect(annotate('mail.google.com')).toEqual([
      { text: 'mail', kind: 'subdomain' },
      { text: '.', kind: 'dot' },
      { text: 'google', kind: 'domain' },
      { text: '.', kind: 'dot' },
      { text: 'com', kind: 'tld' },
    ]);
  });

  it('treats a compound public suffix (co.uk) as the extension', () => {
    expect(annotate('a.b.example.co.uk')).toEqual([
      { text: 'a', kind: 'subdomain' },
      { text: '.', kind: 'dot' },
      { text: 'b', kind: 'subdomain' },
      { text: '.', kind: 'dot' },
      { text: 'example', kind: 'domain' },
      { text: '.', kind: 'dot' },
      { text: 'co', kind: 'tld' },
      { text: '.', kind: 'dot' },
      { text: 'uk', kind: 'tld' },
    ]);
  });

  it('treats a single-label host (localhost) as the domain', () => {
    expect(annotate('localhost')).toEqual([{ text: 'localhost', kind: 'domain' }]);
  });
});
