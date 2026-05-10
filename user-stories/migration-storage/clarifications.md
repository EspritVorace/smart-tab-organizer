# Migration storage.sync -> storage.local: decisions

## Context

Migration of all application settings (domainRules, toggles, notification prefs)
from `browser.storage.sync` to `browser.storage.local`.

## Decisions

**D1 - Removal of sync data after migration**
Decision: do not remove the `storage.sync` keys after migration.
Reason: allow a manual rollback without data loss if the user
goes back to an earlier version of the extension.

**D2 - Idempotence of the migration**
Decision: the migration is guarded by a `settingsMigratedToLocal` flag
in `storage.local`. It only runs once, even if
`onInstalled` fires multiple times (updates).

**D3 - Data priority in case of conflict**
Decision: if a key already exists in `storage.local`, the sync data
does not replace it (local has priority).
Reason: avoid overwriting a more recent state with a potentially
stale sync state (e.g. user who modified their rules after installation).

**D4 - Profile auto-sync**
The "auto-sync" feature for pinned profiles is not implemented.
The mention in CLAUDE.md was outdated documentation: removed.

**D5 - storage.session**
After auditing the code, `storage.session` is used only for
ephemeral states (profile-window map, editing guards). It is not
migrated: it remains unchanged.

**D6 - Naming of hooks**
`useSyncedSettings` renamed to `useSettings`.
`useSyncedState` renamed to `useStorageState`.
No deprecation period: direct replacement in all consumers.

**D7 - Sync quota**
The sync quota (100 KB total, 8 KB/item, 120 writes/min) was the source
of E2E test flakiness (retries with backoff in `syncSet()`).
After migration to local, the `syncSet` helper is replaced by `localSet`
without retry logic.
