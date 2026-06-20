import { describe, it, expect } from 'vitest';
import {
  capabilityLabel,
  formatMissingPrerequisite,
  DOMAIN_ICONS,
  EXPLORATION_ICON,
} from '../../src/components/Core/Exploration/explorationUi';
import type { MissingPrerequisite } from '../../src/exploration/prerequisites';

// getMessage is wired to the real EN catalog via tests/setup-storybook.ts, so
// known keys resolve to their English text and unknown keys echo the key back.

describe('capabilityLabel', () => {
  it('returns the localized label for a known catalog id', () => {
    expect(capabilityLabel('grouping.create')).toBe('Create a rule');
  });

  it('falls back to the raw id for an unknown capability', () => {
    expect(capabilityLabel('does.not.exist')).toBe('does.not.exist');
  });
});

describe('formatMissingPrerequisite', () => {
  it('renders a leaf as its localized label', () => {
    const missing: MissingPrerequisite = { kind: 'leaf', id: 'grouping.create' };
    expect(formatMissingPrerequisite(missing)).toBe('Create a rule');
  });

  it('joins allOf parts with the "and" connector', () => {
    const missing: MissingPrerequisite = {
      kind: 'allOf',
      parts: [
        { kind: 'leaf', id: 'grouping.create' },
        { kind: 'leaf', id: 'grouping.edit' },
      ],
    };
    expect(formatMissingPrerequisite(missing)).toBe('Create a rule and Edit a rule');
  });

  it('joins anyOf parts with the "or" connector', () => {
    const missing: MissingPrerequisite = {
      kind: 'anyOf',
      parts: [
        { kind: 'leaf', id: 'grouping.create' },
        { kind: 'leaf', id: 'grouping.edit' },
      ],
    };
    expect(formatMissingPrerequisite(missing)).toBe('Create a rule or Edit a rule');
  });

  it('renders nested mixed trees recursively', () => {
    const missing: MissingPrerequisite = {
      kind: 'allOf',
      parts: [
        { kind: 'leaf', id: 'grouping.create' },
        {
          kind: 'anyOf',
          parts: [
            { kind: 'leaf', id: 'grouping.edit' },
            { kind: 'leaf', id: 'does.not.exist' },
          ],
        },
      ],
    };
    expect(formatMissingPrerequisite(missing)).toBe(
      'Create a rule and Edit a rule or does.not.exist',
    );
  });
});

describe('DOMAIN_ICONS', () => {
  it('maps every exploration domain to a defined icon component', () => {
    for (const icon of Object.values(DOMAIN_ICONS)) {
      expect(icon).toBeDefined();
    }
  });

  it('exposes a dedicated exploration icon', () => {
    expect(EXPLORATION_ICON).toBeDefined();
  });
});
