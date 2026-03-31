# Changelog

## 1.1.0 — since 1.0.3

### New Features
- Sessions management: create snapshots, pin sessions, restore from popup
- Session import/export wizard with Zod-validated JSON and conflict resolution
- Session editor: interactive tab tree editing (tabs, groups, colors)
- Deep search on sessions (tab titles, URLs, group names) with accent-folding
- Search highlighting in domain rules and session cards
- 4-step domain rule creation wizard (replaces inline modal)
- "Organize All Tabs" one-click grouping action
- Category support for domain rules
- Config mode HoverCard tooltips on rule form options
- "More actions" dropdown in domain rule list
- Popup: pinned sessions list and Save Session button; empty-state placeholder when no rules

### Improvements
- Migrated package manager from npm to pnpm; CI upgraded to Node 22
- Replaced `console.log/warn/error` with structured no-op-in-prod logger
- Unified accent color to indigo; wizards auto-close after system notification
- Simplified restore and import/export wizard flows (fewer steps)
- Storage access abstracted via WXT `storageItems`
- Chrome Web Store screenshot generation system added

### Bug Fixes
- Extension update no longer resets domain rules (wrong WXT storage key)
- Tab grouping fallback via `onTabUpdated` for redirect URL mismatch
- Grouping: URL→title fallback for title/url modes; removed stale `presetId` guard
- Fixed 14 broken regex presets
