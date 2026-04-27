# Changelog

## 1.1.4 — since 1.1.3

### New Features
- Keep-strategy setting for deduplication with group-aware undo
- "Replace tabs" restore mode to switch session context in one click
- Per-rule dedup mode that ignores configured query params
- Opt-out for deduplication on domains without a matching rule
- In-page toasts for user-triggered options actions

### Improvements
- Migrate all storage from browser.storage.sync to storage.local (full 5-lot migration with runtime sync-to-local converter)
- Accessibility auditing pipeline with axe-core (Storybook + Playwright, consolidated reports, CI integration)
- ESLint configuration with blocking pre-commit hook, path alias @/ for src imports, no-explicit-any enforcement
- Popup visual rework: wider layout, rounded toolbar buttons, emoji icons, improved hierarchy
- Replace dismissible intro callout with permanent page descriptions
- Comprehensive test coverage additions (unit tests, stories with play functions, portable stories)
- Handle notifications gracefully in browsers without action buttons

### Bug Fixes
- Restore inset gutter and accent border on active sidebar item
- Fix critical button-name and serious color-contrast a11y violations
- Clear baseline a11y violations

## 1.1.3 — since 1.1.2

### New Features
- Separate pinned and unpinned sessions into distinct sections in the Sessions page

### Improvements
- Maintain pinned sessions in their original storage order
- Remove unused files and clean up dead code
- Adjust edit pencil icon position in session cards following UI redesign

## 1.1.2 — since 1.1.1

### New Features
- Sessions note field for custom session annotations
- Split save button for active tab group with capture validation
- Domain rule drag-and-drop reordering with automatic migration

### Improvements
- Decoupled 4 critical React components for better code maintainability
- CI: Sharded E2E tests across 3 parallel runners; improved test failure reporting
- Enforced unique session names to match domain rule label behavior

## 1.1.1 — since 1.1.0

### Improvements
- Converted remaining JavaScript files to TypeScript

### Bug Fixes
- Skip grouping for tabs in non-normal windows or when name extraction fails
- Reuse initial window tab to avoid duplicates on startup
- Stop injecting default domain rules on init

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
