import { describe, it, expect, vi } from 'vitest';

// Map the unit keys to their template so we can assert the formatted output
// without depending on the real locale files or the browser.i18n runtime.
const TEMPLATES: Record<string, string> = {
  statsStorageUnitBytes: '{value} B',
  statsStorageUnitKb: '{value} KB',
  statsStorageUnitMb: '{value} MB',
};

vi.mock('../src/utils/i18n', () => ({
  getMessage: (key: string) => TEMPLATES[key] ?? key,
}));

const { formatBytes } = await import('../src/utils/formatBytes');

describe('formatBytes', () => {
  it('renders raw bytes below 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('renders kilobytes with at most one decimal, trimming .0', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1023)).toBe('1023 KB');
  });

  it('renders megabytes beyond 1 MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('guards against negative or non-finite input', () => {
    expect(formatBytes(-10)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });
});
