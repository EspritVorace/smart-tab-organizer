# Firefox QA Checklist

Manual smoke test to run before each Firefox release until we have an automated Firefox E2E suite (see [wxt-dev/wxt#1699](https://github.com/wxt-dev/wxt/issues/1699)).

## Prerequisites

- Firefox >= 139 (required for `browser.tabGroups`)
- `pnpm build:firefox`, then load `.output/firefox-mv2` via `about:debugging#/runtime/this-firefox` -> "Load Temporary Add-on..." -> select `manifest.json`
- Or `pnpm dev:firefox` for auto-reload

## 1. Storage and bootstrap

- [ ] No `The storage API will not work with a temporary addon ID` error in the Firefox console (gecko ID regression, see `wxt.config.ts`)
- [ ] No `[useSyncedState] load error` at startup
- [ ] Open Options: every toggle loads its default state without console errors

## 2. Sessions: save

- [ ] Open 3-4 real tabs (e.g. github.com, mdn.dev, news.ycombinator.com)
- [ ] Click the popup's Snapshot button: the wizard opens
- [ ] **The SmartTab Options page must NOT appear in the selectable tabs list** (`moz-extension://` regression, see `tabCapture.ts`)
- [ ] Enter a name, save: success notification
- [ ] Reopen Options, Sessions tab: the session shows the right tab count
- [ ] Reload the extension (or Firefox): the session is still there

## 3. Sessions: pin and popup

- [ ] Pin a session from its card: the icon changes
- [ ] Open the popup: the "Pinned sessions" section is visible with the session
- [ ] Click restore (current window): tabs open in the current window
- [ ] Click restore (new window): a new window opens with the tabs
- [ ] Unpin: the section disappears from the popup if no pinned sessions remain

## 4. Sessions: edit

- [ ] Edit a session: dialog opens, tree view works
- [ ] Rename a group, change its color, save: changes persisted
- [ ] Unselect a tab and save: the tab disappears from the session
- [ ] Cancel an edit: no change is applied

## 5. Grouping (Firefox 139+)

- [ ] Add a domain rule (e.g. `github.com`, label "GitHub")
- [ ] Open a github.com tab, middle-click an internal link
- [ ] Verify that the new tab is grouped with the "GitHub" label
- [ ] Test all four `groupNameSource` values: label, title, url, smart
- [ ] Verify that a custom rule color is applied
- [ ] Regex preset: try at least one builtin preset (e.g. JIRA)

## 6. Deduplication

- [ ] Enable global dedup and add a rule with `deduplicationEnabled: true`
- [ ] Open the same URL twice: the duplicate must close and focus must move to the original
- [ ] Test all four modes: `exact`, `hostname+path`, `hostname`, `includes`
- [ ] Verify the dedup notification (if enabled in settings)

## 7. Domain Rules CRUD

- [ ] Create a rule: fill the fields, save: it appears in the list
- [ ] Edit an existing rule: edits persisted
- [ ] Toggle enabled/disabled: icon and behavior consistent
- [ ] Drag and drop to reorder: order preserved across reload
- [ ] Delete a rule: confirm dialog, then disappears

## 8. Import / Export

- [ ] Export rules: a JSON file is downloaded with valid contents
- [ ] Import the same file: the wizard detects "identical" for every rule
- [ ] Import an edited file: new/conflicting detection is correct
- [ ] Conflict resolution: `keep`, `replace`, `skip` options all work

## 9. Statistics

- [ ] Grouping and dedup counters increment during the tests above
- [ ] Reset statistics: counters return to 0

## 10. Cross-cutting UI

- [ ] Sidebar navigation between Domain Rules, Sessions, Statistics, Settings, Import-Export
- [ ] Theme toggle light/dark works
- [ ] Test all three locales: EN, FR, ES (change Firefox's language or inspect strings)
- [ ] Popup renders correctly (size, no horizontal scroll)
- [ ] Options page renders correctly at mobile widths (responsive)

## 11. Console

- [ ] No red errors in the background page console
- [ ] No red errors in the Options page console
- [ ] No red errors in the popup console
- [ ] `logger.debug` calls are present in dev but absent in production builds

## Known / not automatable

- The `moz-extension://` bug in `tabCapture.ts` (#bug-scope-du-QA), fixed, recheck on each release
- `browser.tabGroups` is supported since Firefox 139 only. Document the minimum version in the README.
