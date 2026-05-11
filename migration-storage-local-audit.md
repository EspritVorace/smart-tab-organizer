# Audit: migrating `storage.sync` to `storage.local`

## 1.1 Inventory of `storage.sync` access

### Direct accesses to `browser.storage.sync`

| File | Line | Access type | Data | Frequency |
|---|---|---|---|---|
| `src/utils/migration.ts` | 50 | Read | Key `domainRules` (fresh-install detection) | Init (onInstalled) |
| `src/utils/migration.ts` | 88 | Read | Key `statistics` in `storage.local` (control) | Init (onInstalled) |

### Access through WXT storage items (prefix `sync:`)

These accesses do not call `browser.storage.sync` directly but use `storage.defineItem('sync:...')` from WXT, which internally routes to `storage.sync`.

| File | Role | Frequency |
|---|---|---|
| `src/utils/storageItems.ts` | Definition of the 7 `sync:*` items and the `syncSettingsItemMap` | Static declaration |
| `src/utils/settingsUtils.ts` | `getSyncSettings`, `setSyncSettings`, `updateSyncSettings`, `watchSyncSettings`, `watchSyncSettingsField` | Init + user action + background |
| `src/hooks/useSyncedSettings.ts` | `loadSyncSettingsFromStorage`, `watchSyncSettings`, `saveSettingsToStorage` | Runtime (React) |

### Hooks wrapping the access

| Hook | File | Role |
|---|---|---|
| `useSyncedSettings` | `src/hooks/useSyncedSettings.ts` | Loads, watches, and writes the (sync) settings |
| `useSyncedState<T>` | `src/hooks/useSyncedState.ts` | Generic load/watch/save, used by `useSyncedSettings` and `useStatistics` |

`useStatistics` (via `useSyncedState`) reads and writes `local:statistics` only, not impacted.

### `storage.onChanged` listeners

| File | Filter | Usage |
|---|---|---|
| `src/hooks/useSessions.ts` (l. 40-46) | `areaName === 'local'` only | Refreshes sessions when `local.sessions` changes. Not impacted. |
| `src/hooks/useSyncedSettings.ts` (l. 81-86) | Through WXT's `item.watch()` (internal) | Watches changes on each `sync:*` item. To migrate to `local:*`. |

---

## 1.2 Keys stored in `storage.sync`

| WXT key | Raw key | Zod schema | TypeScript type | Default value | Read | Write |
|---|---|---|---|---|---|---|
| `sync:globalGroupingEnabled` | `globalGroupingEnabled` | `z.boolean()` | `boolean` | `true` | `getSyncSettings`, `useSyncedSettings` | `setSyncSettings`, `updateSyncSettings`, `useSyncedSettings` |
| `sync:globalDeduplicationEnabled` | `globalDeduplicationEnabled` | `z.boolean()` | `boolean` | `true` | id. | id. |
| `sync:deduplicateUnmatchedDomains` | `deduplicateUnmatchedDomains` | `z.boolean()` | `boolean` | `false` | id. | id. |
| `sync:deduplicationKeepStrategy` | `deduplicationKeepStrategy` | `z.enum([...])` | `DeduplicationKeepStrategyValue` | `'keep-grouped-or-new'` | id. | id. |
| `sync:domainRules` | `domainRules` | `z.array(domainRuleSchema)` | `DomainRuleSettings` | `[]` | id. | id. |
| `sync:notifyOnGrouping` | `notifyOnGrouping` | `z.boolean()` | `boolean` | `true` | id. | id. |
| `sync:notifyOnDeduplication` | `notifyOnDeduplication` | `z.boolean()` | `boolean` | `true` | id. | id. |

All these keys are aggregated in the `SyncSettings` interface (`src/types/syncSettings.ts`) and in `syncSettingsItemMap` (`src/utils/storageItems.ts`).

---

## 1.3 Impact on existing user stories

No user story in the `user-stories/` folder references `storage.sync`, `chrome.storage.sync`, `browser.storage.sync`, or the notion of inter-device sync. The only persistence mentions in the US files are:

- `US-S-DND.md` (l. 39): mentions `browser.storage.local` for sessions. Not impacted.
- `US-S-sessions.md` (l. 151): refers to "storage" generically. Not impacted.

**Conclusion: no user story needs to change.**

---

## 1.4 Impact on tests

### Vitest tests mocking `storage.sync`

| File | Number of usages | Nature |
|---|---|---|
| `tests/migration.test.ts` | 11 | `fakeBrowser.storage.sync.set(...)` to seed the initial state, `fakeBrowser.storage.sync.get(...)` for assertions |
| `tests/hooks/useSyncedSettings.test.ts` | 2 | `fakeBrowser.storage.sync.set(...)` to pre-fill storage |
| `tests/utils/settingsUtils.test.ts` | 4 | `fakeBrowser.storage.sync.set/get(...)`, `vi.spyOn(fakeBrowser.storage.sync, 'get')` |

**Total: 17 usages to migrate to `fakeBrowser.storage.local`.**

### Playwright E2E tests using `chrome.storage.sync`

| File | Number of usages | Nature |
|---|---|---|
| `tests/e2e/fixtures.ts` | 4 | Helpers `syncSet`, `addDomainRule`, `clearDomainRules`, `getSettings` |
| `tests/e2e/import-export.spec.ts` | 2 | Pre-test rule setup |
| `tests/e2e/options-toasts.spec.ts` | 1 | `chrome.storage.sync.set({ domainRules: [] })` |
| `tests/e2e/notifications.spec.ts` | 1 | `chrome.storage.sync.set(...)` |
| `tests/e2e/popup-organize.spec.ts` | 4 | `chrome.storage.sync.set(...)` for notifyOn* |

**Total: 12 E2E usages to migrate to `chrome.storage.local`.**

The `syncSet` helper in `tests/e2e/fixtures.ts` (l. 92-113) handles the retry on `MAX_WRITE_OPERATIONS_PER_MINUTE`. That problem disappears with `storage.local` (unlimited writes). The retry logic can be removed or simplified.

### Tests marked flaky

No test carries a `.only`, `test.skip`, `// flaky`, or `// TODO flaky` marker in the analyzed files. The flakiness mentioned in the motivation is behavioral (slow async `storage.sync` in E2E), not annotated in the code.

---

## 1.5 Runtime migration strategy

### Principle

On the first start with the new version, the background reads the data from `storage.sync` and copies it to `storage.local`, then sets a flag `settingsMigratedToLocal: true` in `storage.local`. Subsequent versions detect the flag and skip the migration.

The data in `storage.sync` **is not deleted**, allowing a rollback to the previous version.

### Where to place the code

Create `src/background/migration.ts` (distinct from `src/utils/migration.ts`, which handles default initialization). Call this module from `event-handlers.ts > setupInstallationHandler()`, just before `initializeDefaults()`.

Call sequence in `setupInstallationHandler`:
```
1. migrateSettingsFromSyncToLocal()   // new
2. initializeDefaults()               // existing
```

### Migration detection

```ts
const { settingsMigratedToLocal } = await browser.storage.local.get('settingsMigratedToLocal');
if (settingsMigratedToLocal) return; // already done
```

### Migration logic (idempotent)

```
1. Read every sync key (* or named keys) from browser.storage.sync
2. For each known key (domainRules, globalGroupingEnabled, ...),
   if the value exists in sync AND does not yet exist in local:
     write it to local
3. Set the flag: browser.storage.local.set({ settingsMigratedToLocal: true })
```

The condition "does not yet exist in local" guarantees idempotence: if the migration has been partially run and interrupted, replaying it does not corrupt the already-migrated data.

### Case: fresh install (no data in sync)

`browser.storage.sync.get(keys)` returns an empty object or `undefined` values for missing keys. The migration simply skips every key, sets the flag, and `initializeDefaults()` writes the default values to `local`. Behavior unchanged.

### Case: user rollback

The data stays in `storage.sync`. The previous version reads it as before. No degradation.

### Error handling

- Wrap the migration in a `try/catch`.
- On error, log with `logger.error` and do not set the flag: the migration will be retried on the next startup.
- No immediate retry, to avoid blocking the service worker.

---

## 1.6 Hook renaming

### Problem

After the migration, `useSyncedSettings` and `useSyncedState` have misleading names: "synced" suggests inter-device sync, which is no longer the case.

### Proposals

| Current name | Proposed name | Rationale |
|---|---|---|
| `useSyncedSettings` | `useSettings` | Short and accurate. The hook handles the extension settings, period. |
| `useSyncedState<T>` | `useStorageState<T>` | Conveys that state is persisted in storage, without prejudging the backend. |
| `getSyncSettings` | `getSettings` | Aligned with the new hook name. |
| `setSyncSettings` | `setSettings` | id. |
| `updateSyncSettings` | `updateSettings` | id. |
| `watchSyncSettings` | `watchSettings` | id. |
| `watchSyncSettingsField` | `watchSettingsField` | id. |
| `SyncSettings` (type) | `AppSettings` | Avoids confusion with the sync notion, stays distinct from generic types. |
| `defaultSyncSettings` | `defaultAppSettings` | Aligned. |
| `syncSettingsItemMap` | `settingsItemMap` | id. |

### Files to update during the rename

**Hook and utilities (file rename + content):**
- `src/hooks/useSyncedSettings.ts` -> `src/hooks/useSettings.ts`
- `src/hooks/useSyncedState.ts` -> `src/hooks/useStorageState.ts`
- `src/utils/settingsUtils.ts` (rename exported functions)
- `src/utils/storageItems.ts` (rename `syncSettingsItemMap`)
- `src/types/syncSettings.ts` (rename type + constant)

**Consumers (imports + usages):**
- `src/background/settings.ts`
- `src/background/deduplication.ts`
- `src/background/grouping.ts`
- `src/background/organize.ts`
- `src/hooks/useStatistics.ts`
- `src/pages/options.tsx`
- `src/pages/popup.tsx`
- `src/pages/DomainRulesPage.tsx`
- `src/pages/ImportExportPage.tsx`
- `src/pages/StatisticsPage.tsx`
- `src/pages/SessionsPage.tsx`
- `src/components/Core/DomainRule/RuleWizardModal.tsx`
- `src/components/Core/DomainRule/RuleDetailPopover.tsx`
- `src/components/Core/DomainRule/DomainRuleCard.tsx`
- `src/components/UI/ImportExportWizards/ImportWizard.tsx`
- `src/components/UI/ImportExportWizards/ExportWizard.tsx`
- `src/components/UI/ImportExportWizards/RuleImportRows.tsx`
- `src/components/UI/PageLayout/PageLayout.tsx`
- `src/components/UI/SettingsPage/SettingsPage.tsx`
- `src/utils/importClassification.ts`
- `src/utils/migration.ts` (existing) and `src/background/migration.ts` (new)
- `src/utils/ruleOrderUtils.ts`
- Stories: `src/components/*/**.stories.tsx` (anywhere `SyncSettings` is imported)
- Tests: `tests/hooks/useSyncedSettings.test.ts` -> `tests/hooks/useSettings.test.ts`
- Tests: `tests/utils/settingsUtils.test.ts`

---

## 1.7 Sequencing plan (phase 2)

### Lot 1: storageItems + settingsUtils + types (utilities)

Changes:
- `src/utils/storageItems.ts`: switch the 7 `sync:` prefixes to `local:`, rename `syncSettingsItemMap` to `settingsItemMap`.
- `src/types/syncSettings.ts`: rename `SyncSettings` to `AppSettings`, `defaultSyncSettings` to `defaultAppSettings`.
- `src/utils/settingsUtils.ts`: rename every exported function (`getSyncSettings` -> `getSettings`, etc.).
- `src/background/settings.ts`: update imports.

Invariant: `pnpm compile` must pass. Other files do not compile yet because their imports are broken.

**Note: this lot is the most delicate because it breaks every import. It must happen in a single pass with simultaneous updates of every consumer (see Lot 2).**

### Lot 2: hooks + React consumers

Changes:
- Rename `useSyncedSettings.ts` -> `useSettings.ts`, adapt its content.
- Rename `useSyncedState.ts` -> `useStorageState.ts`, adapt its content.
- `src/hooks/useStatistics.ts`: update the import.
- Every page/ and component/ file listed in 1.6: update imports.

Invariant: `pnpm compile` passes, `pnpm test` passes.

### Lot 3: runtime migration

Changes:
- Create `src/background/migration.ts` with `migrateSettingsFromSyncToLocal()`.
- Adapt `src/utils/migration.ts` (`initializeDefaults`): replace `browser.storage.sync.get('domainRules')` with a `local:domainRules` read.
- Adapt `src/entrypoints/background.ts` or `event-handlers.ts` to call the migration.

Invariant: `pnpm compile` passes, `pnpm test` passes.

### Lot 4: Vitest tests

Changes:
- `tests/migration.test.ts`: migrate the 11 `fakeBrowser.storage.sync` usages to `fakeBrowser.storage.local`. Adapt assertions.
- `tests/hooks/useSyncedSettings.test.ts` -> rename to `useSettings.test.ts`, migrate the 2 usages.
- `tests/utils/settingsUtils.test.ts`: migrate the 4 usages, adapt the spy.

Invariant: `pnpm test` fully passes.

### Lot 5: E2E tests (helpers only, without execution)

Changes:
- `tests/e2e/fixtures.ts`: replace `syncSet` (and its quota retry) with a direct `chrome.storage.local.set` call. Update `addDomainRule`, `clearDomainRules`, `getSettings`.
- `tests/e2e/import-export.spec.ts`, `options-toasts.spec.ts`, `notifications.spec.ts`, `popup-organize.spec.ts`: replace `chrome.storage.sync.set` with `chrome.storage.local.set`.

Invariant: files modified but tests are not executed (left to the user).

### Lot 6: documentation

Changes:
- `CLAUDE.md`: detailed edits described in section 1.9.
- `wxt.config.ts`: update the comment on line 22 (drop "sync").
- `README.md`, `README-fr.md`, `README-es.md`: no mention of sync detected, no action (verified by scan).
- `DESIGN.md`: to verify when working on this lot (no occurrence of `storage.sync` in scan, but careful re-read).
- `CHANGELOG.md`: add an entry for the migration.
- Create `user-stories/migration-storage/clarifications.md`.

---

## 1.8 Identified risks

| Risk | Probability | Mitigation |
|---|---|---|
| **Race condition during the migration**: two windows open at the same time, `onInstalled` fires in two SWs, both migrate in parallel and overwrite data. | Low (onInstalled only fires once per install/update, not per window). The SW is unique. | Confirm that onInstalled does not fire twice by re-reading the WXT/MV3 docs. Otherwise, use a lock via `storage.session`. |
| **Old code reads `sync` after the migration**: if an older SW instance remains active (cached), it still reads `sync`. | Very low (MV3 terminates the SW after inactivity). | The `sync` data is preserved, so the previous version still works on read. |
| **Data too large for `storage.local`**: theoretically no per-item limit (unlike `sync`: 8 KB/item), but the global quota is 5 MB by default. | Negligible (domain rules rarely exceed a few KB). | None. |
| **E2E tests break on `storage.local` quotas**: `storage.local` has no operations-per-minute limit. | Positive: the risk disappears after the migration. The retry logic in `syncSet` can be removed. | Remove the retry. |
| **Regression in `initializeDefaults`**: fresh-install detection currently uses `browser.storage.sync.get('domainRules')`. After the migration it must read `local:domainRules`. | Real if we forget to adapt this code. | Lot 3 covers this explicitly. Covered by the Lot 4 tests. |
| **Storybook stories break**: stories that import `SyncSettings` or `useSyncedSettings` stop compiling unless Lot 1 is atomic with Lot 2. | Real on a partial commit. | Do Lots 1 and 2 in the same work session, run `pnpm compile` before each commit. |
| **User installs the new version, rolls back, reinstalls**: on the reinstall, `settingsMigratedToLocal` is present in `local`, so the migration is skipped. But the data has been in `local` since the first run. | Benign. | The migration is idempotent, `initializeDefaults` fills in any missing values. |

---

## 1.9 `CLAUDE.md` edits

`CLAUDE.md` contains several references to `storage.sync` and to the hooks being renamed. The exact spots and proposed reformulations follow.

### Lines 43-45 (Storage table)

**Before:**
```
| Backend | Contents |
|---|---|
| `browser.storage.sync` | Domain rules, grouping/dedup toggles, notification prefs |
| `browser.storage.local` | Sessions, UI prefs (e.g. `popupStatsCollapsed`), help prefs |
| `browser.storage.session` | Profile-window map, sync drafts, editing guard |
```

**After:**
```
| Backend | Contents |
|---|---|
| `browser.storage.local` | Domain rules, grouping/dedup toggles, notification prefs, sessions, UI prefs (e.g. `popupPinnedEmptyCollapsed`), statistics |
```

Note: `browser.storage.session` does not contain any item in the current code (verified: zero call to `browser.storage.session` in `src/`). The auto-sync of profiles is no longer implemented. The `storage.session` row of the table is therefore to **remove entirely**.

Also, `popupStatsCollapsed` mentioned on line 44 does not exist in the code (the actual key is `popupPinnedEmptyCollapsed`). Corrected in the reformulation above.

### Line 47 (hook description)

**Before:**
```
`useSyncedSettings` hook uses refs to prevent race conditions. `useSyncedState` unifies synchronized storage access for settings and statistics.
```

**After:**
```
`useSettings` hook uses refs to prevent race conditions. `useStorageState` unifies local storage access for settings and statistics.
```

### Line 71 (hook tree)

**Before:**
```
  hooks/           # useSyncedState · useSyncedSettings · useStatistics · useSessions
```

**After:**
```
  hooks/           # useStorageState · useSettings · useStatistics · useSessions
```

### Line 157 (clarification rule)

**Before:**
```
- The US interacts with `chrome.storage.sync` or `browser.storage.local`.
```

**After:**
```
- The US interacts with `browser.storage.local` or `browser.storage.session`.
```

### Line 93 (Sessions & Profiles feature)

The term "auto-sync" refers to the automatic profile-to-window synchronization. That feature is no longer implemented per the project feedback. The phrase "pinned profiles with icon, auto-sync, window exclusivity" must be revisited in phase 2 lot 6 (out of scope of the storage migration, but worth noting).

### Line 172 (skill jscpd)

The term "synchronize" refers to lockfile synchronization, not `storage.sync`. **No change.**

### Summary of `CLAUDE.md` occurrences to edit

| Line | Action |
|---|---|
| 43 | Remove the `browser.storage.sync` row and merge its content into `browser.storage.local` |
| 44 | Enrich the content and fix `popupStatsCollapsed` -> `popupPinnedEmptyCollapsed` |
| 45 | Remove the `browser.storage.session` row (unused in code; profile auto-sync not implemented) |
| 47 | Rename `useSyncedSettings` -> `useSettings`, `useSyncedState` -> `useStorageState` |
| 71 | id. in the hook list |
| 93 | Drop "auto-sync" from the Sessions & Profiles description (feature not implemented) |
| 157 | Drop the `chrome.storage.sync` mention |
