import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getMessage, getPluralMessage } from '../src/utils/i18n';

// fakeBrowser does not implement browser.i18n at all — when getMessage is
// called, the underlying property is undefined and accessing .getMessage
// throws. We attach a stubbable i18n.getMessage and reattach after each
// fakeBrowser.reset() (the global setup calls reset in its own beforeEach).
const mockGetMessage = vi.fn();

beforeEach(() => {
  // The global tests/setup.ts beforeEach runs fakeBrowser.reset() before this
  // file's hook. Re-attach i18n with our stub each time.
  (fakeBrowser as any).i18n = { getMessage: mockGetMessage };
  mockGetMessage.mockReset();
});

afterEach(() => {
  delete (fakeBrowser as any).i18n;
});

describe('getMessage — happy path', () => {
  it('forwards the key to browser.i18n.getMessage and returns its result', () => {
    mockGetMessage.mockReturnValue('Smart Tab Organizer');

    const result = getMessage('extensionName');

    expect(result).toBe('Smart Tab Organizer');
    expect(mockGetMessage).toHaveBeenCalledWith('extensionName', undefined);
  });

  it('passes a single string substitution through', () => {
    mockGetMessage.mockReturnValue('Hello, Alice');

    const result = getMessage('greeting', 'Alice');

    expect(result).toBe('Hello, Alice');
    expect(mockGetMessage).toHaveBeenCalledWith('greeting', 'Alice');
  });

  it('passes an array of substitutions through', () => {
    mockGetMessage.mockReturnValue('5 tabs grouped');

    const result = getMessage('tabsGrouped', ['5', 'tabs']);

    expect(result).toBe('5 tabs grouped');
    expect(mockGetMessage).toHaveBeenCalledWith('tabsGrouped', ['5', 'tabs']);
  });
});

describe('getMessage — fallback', () => {
  it('returns the key itself when browser.i18n.getMessage throws', () => {
    mockGetMessage.mockImplementation(() => {
      throw new Error('i18n unavailable');
    });

    const result = getMessage('missingKey');

    expect(result).toBe('missingKey');
  });

  it('returns the key when browser.i18n is not defined at all', () => {
    delete (fakeBrowser as any).i18n;

    const result = getMessage('anyKey');

    expect(result).toBe('anyKey');
  });
});

describe('getPluralMessage', () => {
  it('uses the singular key when count === 1 and passes no substitution', () => {
    mockGetMessage.mockReturnValue('1 tab');

    const result = getPluralMessage(1, 'oneTab', 'manyTabs');

    expect(result).toBe('1 tab');
    expect(mockGetMessage).toHaveBeenCalledOnce();
    expect(mockGetMessage).toHaveBeenCalledWith('oneTab', undefined);
  });

  it('uses the plural key when count > 1 and passes count as substitution', () => {
    mockGetMessage.mockReturnValue('5 tabs');

    const result = getPluralMessage(5, 'oneTab', 'manyTabs');

    expect(result).toBe('5 tabs');
    expect(mockGetMessage).toHaveBeenCalledWith('manyTabs', ['5']);
  });

  it('uses the plural key when count === 0', () => {
    mockGetMessage.mockReturnValue('0 tabs');

    const result = getPluralMessage(0, 'oneTab', 'manyTabs');

    expect(result).toBe('0 tabs');
    expect(mockGetMessage).toHaveBeenCalledWith('manyTabs', ['0']);
  });

  it('uses the plural key for negative counts', () => {
    mockGetMessage.mockReturnValue('-1 tabs');

    const result = getPluralMessage(-1, 'oneTab', 'manyTabs');

    expect(result).toBe('-1 tabs');
    expect(mockGetMessage).toHaveBeenCalledWith('manyTabs', ['-1']);
  });

  it('falls back to the plural key string when getMessage throws', () => {
    mockGetMessage.mockImplementation(() => {
      throw new Error('i18n unavailable');
    });

    const result = getPluralMessage(3, 'oneTab', 'manyTabs');

    // getMessage's fallback returns the key itself.
    expect(result).toBe('manyTabs');
  });
});
