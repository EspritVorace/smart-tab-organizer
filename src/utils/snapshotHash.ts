/**
 * Builds the deep-link hash that opens the session snapshot wizard. When the
 * active tab sits in a tab group, the hash carries its `groupId` so the wizard
 * pre-fills the group name and scopes the selection to that group.
 *
 * Shared by the popup Save button (`PopupToolbar`) and the `s` keyboard
 * shortcut (`popup.tsx`) so both produce the exact same navigation.
 */
export function buildSnapshotHash(groupId: number | null): string {
  return groupId !== null
    ? `#sessions?action=snapshot&groupId=${groupId}`
    : '#sessions?action=snapshot';
}
