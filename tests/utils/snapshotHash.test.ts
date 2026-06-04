import { describe, it, expect } from 'vitest';
import { buildSnapshotHash } from '../../src/utils/snapshotHash';

describe('buildSnapshotHash', () => {
  it('scopes the snapshot to the active tab group when one is provided', () => {
    expect(buildSnapshotHash(42)).toBe('#sessions?action=snapshot&groupId=42');
  });

  it('omits the groupId when the active tab is not in a group', () => {
    expect(buildSnapshotHash(null)).toBe('#sessions?action=snapshot');
  });

  it('keeps groupId 0 (a valid Chrome group id), not treated as "no group"', () => {
    expect(buildSnapshotHash(0)).toBe('#sessions?action=snapshot&groupId=0');
  });
});
