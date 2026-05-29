import { describe, it, expect } from 'vitest';
import { deriveLabelFromDomain } from '../../src/utils/labelFromDomain';

describe('deriveLabelFromDomain', () => {
  it('returns empty string for empty input', () => {
    expect(deriveLabelFromDomain('')).toBe('');
    expect(deriveLabelFromDomain('   ')).toBe('');
  });

  it('handles localhost as a special case', () => {
    expect(deriveLabelFromDomain('localhost')).toBe('Localhost');
    expect(deriveLabelFromDomain('LOCALHOST')).toBe('Localhost');
  });

  it('extracts the SLD from a simple 2-part domain', () => {
    expect(deriveLabelFromDomain('atlassian.net')).toBe('Atlassian');
    expect(deriveLabelFromDomain('example.com')).toBe('Example');
  });

  it('strips common subdomains', () => {
    expect(deriveLabelFromDomain('mail.google.com')).toBe('Google');
    expect(deriveLabelFromDomain('www.example.com')).toBe('Example');
    expect(deriveLabelFromDomain('app.figma.com')).toBe('Figma');
    expect(deriveLabelFromDomain('api.github.com')).toBe('Github');
  });

  it('keeps custom subdomains and uses the next-to-last segment', () => {
    expect(deriveLabelFromDomain('sub.atlassian.net')).toBe('Atlassian');
    expect(deriveLabelFromDomain('news.ycombinator.com')).toBe('Ycombinator');
  });

  it('handles compound public suffixes', () => {
    expect(deriveLabelFromDomain('example.co.uk')).toBe('Example');
    expect(deriveLabelFromDomain('site.com.br')).toBe('Site');
    expect(deriveLabelFromDomain('shop.example.co.uk')).toBe('Example');
  });

  it('returns empty string for filters that look like regexes', () => {
    expect(deriveLabelFromDomain('*.foo.com')).toBe('');
    expect(deriveLabelFromDomain('foo\\.bar\\.com')).toBe('');
    expect(deriveLabelFromDomain('(foo|bar)\\.com')).toBe('');
    expect(deriveLabelFromDomain('foo[1-9].com')).toBe('');
  });

  it('handles deeply nested subdomains', () => {
    expect(deriveLabelFromDomain('a.b.c.d.com')).toBe('D');
  });

  it('falls back to the only segment when there is just one part', () => {
    expect(deriveLabelFromDomain('intranet')).toBe('Intranet');
  });
});
