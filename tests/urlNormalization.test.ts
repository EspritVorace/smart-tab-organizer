import { describe, it, expect } from 'vitest';
import { normalizeUrlIgnoringParams, paramNameMatches } from '../src/utils/urlNormalization';

describe('paramNameMatches', () => {
  it('matches on exact name when no wildcard', () => {
    expect(paramNameMatches('utm_source', 'utm_source')).toBe(true);
    expect(paramNameMatches('utm_source', 'utm_medium')).toBe(false);
  });

  it('is case-sensitive by default', () => {
    expect(paramNameMatches('UTM_source', 'utm_source')).toBe(false);
  });

  it('supports prefix wildcard pattern', () => {
    expect(paramNameMatches('utm_source', 'utm_*')).toBe(true);
    expect(paramNameMatches('utm_medium', 'utm_*')).toBe(true);
    expect(paramNameMatches('ref', 'utm_*')).toBe(false);
  });

  it('supports suffix wildcard pattern', () => {
    expect(paramNameMatches('session_id', '*_id')).toBe(true);
    expect(paramNameMatches('user_id', '*_id')).toBe(true);
    expect(paramNameMatches('name', '*_id')).toBe(false);
  });

  it('supports catch-all wildcard', () => {
    expect(paramNameMatches('anything', '*')).toBe(true);
    expect(paramNameMatches('', '*')).toBe(true);
  });

  it('supports middle wildcard', () => {
    expect(paramNameMatches('foo_bar_baz', 'foo_*_baz')).toBe(true);
    expect(paramNameMatches('foo__baz', 'foo_*_baz')).toBe(true);
    expect(paramNameMatches('foo_baz_bar', 'foo_*_baz')).toBe(false);
  });

  it('returns false for empty pattern', () => {
    expect(paramNameMatches('utm_source', '')).toBe(false);
  });
});

describe('normalizeUrlIgnoringParams', () => {
  it('returns the URL unchanged when no patterns are supplied', () => {
    const url = 'https://example.com/page?a=1&b=2';
    expect(normalizeUrlIgnoringParams(url, [])).toBe(url);
  });

  it('removes an exact query param', () => {
    expect(
      normalizeUrlIgnoringParams('https://example.com/page?utm_source=a&ref=x', ['utm_source']),
    ).toBe('https://example.com/page?ref=x');
  });

  it('removes multiple params matching a wildcard', () => {
    expect(
      normalizeUrlIgnoringParams(
        'https://example.com/page?utm_source=a&utm_medium=b&ref=x',
        ['utm_*'],
      ),
    ).toBe('https://example.com/page?ref=x');
  });

  it('preserves the order of the remaining params', () => {
    expect(
      normalizeUrlIgnoringParams(
        'https://example.com/page?a=1&utm_source=a&b=2&utm_medium=c&c=3',
        ['utm_*'],
      ),
    ).toBe('https://example.com/page?a=1&b=2&c=3');
  });

  it('preserves the fragment', () => {
    expect(
      normalizeUrlIgnoringParams('https://example.com/page?utm_source=a#section', ['utm_*']),
    ).toBe('https://example.com/page#section');
  });

  it('preserves hostname and path', () => {
    expect(
      normalizeUrlIgnoringParams('https://sub.example.com:8443/a/b?x=1&y=2', ['x']),
    ).toBe('https://sub.example.com:8443/a/b?y=2');
  });

  it('returns the input unchanged when the URL cannot be parsed', () => {
    const broken = 'not a url';
    expect(normalizeUrlIgnoringParams(broken, ['utm_*'])).toBe(broken);
  });

  it('drops the trailing ? when the query becomes empty', () => {
    expect(
      normalizeUrlIgnoringParams('https://example.com/page?utm_source=a', ['utm_*']),
    ).toBe('https://example.com/page');
  });

  it('drops the trailing ? before a fragment when the query becomes empty', () => {
    expect(
      normalizeUrlIgnoringParams('https://example.com/page?utm_source=a#x', ['utm_*']),
    ).toBe('https://example.com/page#x');
  });

  it('returns the URL unchanged when no param matches', () => {
    const url = 'https://example.com/page?a=1&b=2';
    expect(normalizeUrlIgnoringParams(url, ['utm_*'])).toBe(url);
  });

  it('handles repeated param names (removes every occurrence)', () => {
    expect(
      normalizeUrlIgnoringParams('https://example.com/page?tag=a&tag=b&keep=1', ['tag']),
    ).toBe('https://example.com/page?keep=1');
  });
});
