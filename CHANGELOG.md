# Changelog

## 1.2.6 — since 1.2.5

### New Features
- Tab coverage panel in the rule wizard's domain step, seeding the filter field from open tabs
- Domain-aware preset suggestions in the rule wizard's preset step, plus self-hosted presets (GitLab, Jira, GitHub Enterprise) suggested via subdomain matching
- Keyboard navigation in wizards: Ctrl+Enter to confirm, Ctrl+Backspace to go back
- Vivaldi partial-compatibility notice surfaced in the About dialog (tab groups unsupported, dedup and sessions unaffected)

### Improvements
- Preset search automatically focused on entering Preset mode in the rule wizard
- Enter on a searchable list's search input selects the first result
- Workspace list hidden when only one workspace exists

### Bug Fixes
- Accessibility: high-contrast text for the selected searchable-list row and for tab-coverage badges
- Session card restore button now renders with the correct tile presentation in the full header

## 1.2.5 — since 1.2.4

### New Features
- Exploration referential: a catalogue of every capability across 10 domains, with a coverage summary, phase bar, live-count filters, search, per-domain collapsible groups and interactive status badges
- Capabilities light up automatically as you use the extension (detection touchpoints wired across grouping, deduplication, sessions, import/export, statistics, workspaces, settings, help and navigation)
- Compact exploration widget on the home page and a coverage progress bar in the sidebar
- Prerequisites shown for not-yet-available capabilities, with live unblocking, plus reversible manual marking that persists
- Discreet, fully dismissable "leave a review" prompt shown once you pass the Maîtrise milestone, linking to the right store
- Exploration page reachable via the "m e" shortcut and the #exploration deep link, each capability deep-linking to its UI and its doc section

### Improvements
- About dialog widened on the options page (540px to 680px); popup stays unchanged

### Bug Fixes
- Exploration: the "Take a snapshot" capability now lights up when the snapshot wizard opens (the touchpoint), instead of only after a session is actually saved, so opening it from the catalogue is enough to mark it discovered
- Dropped unreachable catalogue entries (io.deepLink, help.tipVariants) and made the onboarding hero capability reachable from the pack-suggestion variant
- CatalogRow story wrapped in role=list to fix an axe aria-required-parent violation
- PhaseBar nested ternaries extracted into helpers to clear sonarjs lint errors

## 1.2.4 — since 1.2.3

### New Features
- Onboarding hero now suggests rule packs matching your open tabs, pre-selected, behind a single "Import and organize" button (local analysis, persistent dismissal)
- "Organize now" reward offered right after a pack import to rearrange open tabs immediately, with the outcome announced to screen readers
- Pack gallery lifts packs matching your open tabs to the top and flags them with a "Matches your open tabs" label
- Statistics page split into four deep-linked sub-pages
- Local storage usage breakdown added to the statistics page, split per workspace
- Keyboard workspace switching (next, previous, last) reachable from any tab
- Domain rules list gains filter, sort and group controls
- Sessions section headers gain a filter/sort button
- Live regex syntax highlighting for the domain filter (step 1) and for the title/url fields in the rule wizard
- Import/export overflow menu added to list toolbars, plus an "import-pack" empty-state action
- Last used, restored and activated dates now remembered for sessions, rules and workspaces
- Sidebar shows non-archived counters and bolds the active item
- Global theme toggle shortcut (D) and Kbd hints on the docs and theme buttons
- Keyboard shortcuts for the session preview toggle and section jumps
- Search box gains a clear button, a "/" shortcut hint and an Esc tooltip
- Smarter initial focus across the popup and list pages (first pinned session or the Organize button, first result on search), plus loading skeletons and domain-rules group keyboard navigation
- Per-mode internal state preserved when switching config modes in the rule wizard

### Improvements
- Workspace cards harmonised with the session and rule cards
- Grouped rules indented to the right for a clearer hierarchy
- Rule categories turned into read-only in-memory constants
- Type-safe getMessage via @wxt-dev/i18n: an unknown i18n key now fails at compile time
- Public JSON assets minified at build time
- Shared useCodeMirrorSingleLine hook extracted from the domain and regex code fields
- Documentation migrated to English-rooted locales and slugs, with a browser-language redirect for root visitors
- Documentation served as Markdown via content negotiation; AI content usage preferences declared via Content-Signal in robots.txt
- Import/export JSON schema reference page generated, and the statistics sub-pages documented
- CI runs two Playwright workers per shard; domain-rules keyboard drag-and-drop de-flaked

### Bug Fixes
- Popup: the S shortcut now scopes the snapshot to the active tab group
- Popup: the o/s/p shortcuts stay active when a pinned card is focused
- Shortcuts: conflicting global keyboard shortcuts replaced
- UX: domain field alignment, sessions tab focus and statistics tab shortcuts fixed
- Dev: reuse the React root so HMR no longer doubles the keyboard shortcuts
- Scripts: escape backslashes in the JSON-schema doc table cells

## 1.2.3 — since 1.2.2

### New Features
- Annotated popup-overview slide for the Chrome Web Store
- Starlight home turned into a visitor-oriented landing page

### Improvements
- Visitor-oriented review of landing and docs (visuals, FAQ, quick start)
- Landing hero aligned with the closing CTA card style
- Schema.org JSON-LD structured data added for GEO
- robots.txt now explicitly allows AI crawlers
- Version number removed from the options and popup footers
- pnpm screenshots converged into the doc:scenarios pipeline
- Transitive dependency vulnerabilities patched via pnpm overrides (extension and docs sub-project)

### Bug Fixes
- Security: CodeQL js/incomplete-sanitization alerts addressed
- Docs: first capture of the Import/Export page corrected

## 1.2.2 — since 1.2.1

### New Features
- Sessions split into pinned/active/archived buckets, with Active/Archived sub-tabs and per-bucket loading
- Popup reads only pinned and active sessions, never the archive
- Session export grouped into three sets (pinned, active, archived) with archives unchecked by default
- Configurable default action for the session Restore button (US-S022)
- Session statistics block laid out as a 2-column paired grid
- U shortcut refreshes the focused session card
- Domain rules: overlap surfaced on cards via a hovercard plus an accent rank badge
- Domain rules: new fallbackLabel field and 'label' config mode
- Grouping joins an existing same-title same-color group instead of creating a duplicate
- Relative-time labels on rules and workspaces, aligned with sessions
- Toolbar icon badge reflecting grouping and dedup state
- Import: JSON textarea replaced with a CodeMirror editor (syntax highlighting and validation) (US-IE016)
- Keyboard shortcut badges and tooltips across the UI
- Contextual documentation link per page plus F1 shortcut, pointing to docs.esprit-vorace.fr
- Workspaces: keyboard navigation and focus ring on workspace cards
- HomePage: initial focus and single-key shortcuts on quick actions
- Per-page Radix skeletons replacing the Suspense spinner
- Open source license attribution

### Improvements
- Starlight documentation restructured around task-oriented guides
- Radix Kbd replaces native kbd markup
- Workspace card drops the redundant color label
- Shared useSessionBucketLoader hook extracted from the session bucket hooks
- Dependency upgrades (patches and minors), pnpm 11.1.2 to 11.4.0, @astrojs/starlight 0.39.2
- Unit tests added for sessionUtils and workspace import/export, plus bucket routing and archive classification coverage; story interactions consolidated
- Screenshots consolidated under /doc/, legacy /assets/ folder dropped

### Bug Fixes
- Workspaces: rule categories treated as global, not per-workspace, and removed from workspace export
- Workspaces: pinned and archived sessions preserved across export/import
- Sessions: updatedAt preserved when archiving or unarchiving; refresh button shown and icons unified
- Import/export: Options page no longer frozen after a clipboard export
- Domain rules: first field focused when opening edit dialogs
- Statistics: session volume tiles kept on a single row
- Wizard: modal max height raised from 80vh to 85vh
- HomePage: focus ring shown on mouse click, not only after arrow-key navigation

## 1.2.1 — since 1.2.0

### New Features
- Pack Gallery redesign with category navigation, full-card click and configurable params preview
- Pack Gallery now flags installed packs and disables fully installed ones
- Bulk selection and bulk actions on the Sessions page
- Bulk rules export from the rules toolbar with preselection
- HomePage tips section expanded from 5 to 44 entries
- Mnemonic M+letter sidebar nav shortcuts (replaces Alt+1..5)
- Options topbar and UI style tweaks

### Improvements
- Migrate package manager to pnpm 11.1.2
- CI: pnpm store cache and Playwright browser cache across workflows, with hit/miss reporting in job summaries
- Accessibility violations now block the CI pipeline
- Shared Page Objects + Domain Actions architecture; tests/e2e and e2e-doc-scenarios converged onto e2e-shared (lots 5, 6, 7) with extensionPage fixture and 5 custom matchers
- Code-split options page routes via React.lazy
- Mount import/export wizards via React context
- Prioritize mainstream categories in Pack Gallery order
- Extract shared dedupe helpers, EditModalShell and EditModalFooter wrappers across rule edit modals, sharedSectionProps on SessionSection

### Bug Fixes
- Fix hydration race conditions in popup and workspaces
- Pack Gallery: keep search input visible while scrolling the import wizard
- Rule card vertical padding aligned with SessionCard and reused in pack preview
- Raise contrast on rule wizard footer soft gray buttons, step 4 summary badge, and active pack category count
- Doc-scenarios: unblock import and dedup capture modes, add popup-with-pinned capture

## 1.2.0 — since 1.1.4

### New Features
- HomePage with pinned sessions, quick actions, tips, and keyboard navigation
- Per-workspace data containers with workspace switcher hidden when only the default exists
- ListToolbar with search, highlight and shortcuts; workspace import/export dialogs aligned with shared wizard shell
- Pack Gallery: 13 categories and 38 curated packs, available as a third import source
- Central keyboard shortcuts registry with Mod modifier, platform-aware display, key sequences, page-level bindings, and auto-generated documentation page
- Keyboard drag-and-drop on sessions and domain rules
- Status bar exposing shortcuts hint and version
- Popup redesigned with hero CTA toolbar, right-side fullscreen help drawer, and P shortcut for options
- Sidebar nav grouped into Tools, Tracking, Configuration sections
- IconBox component with gradient applied on sidebar, page header and dialog icons
- URL query parameter extraction mode for domain rules
- Statistics: daily buckets per rule with aggregates
- Session card with relative last-activity time, hover-card metadata and restore shortcuts menu
- Summary variants for rule and session cards
- First-run redirect to Options Home on the very first icon click
- Narrative doc-scenarios pipeline (3 locales x 2 themes matrix, manifest-driven routing, audit/sync commands, dedicated CI workflow)
- Autofocus primary action in dialogs; '/' clear-on-Escape; nested shortcut groups in panel

### Improvements
- Move rule color from category onto the rule itself; drop default_settings.json
- Dependency upgrades: React 19, TypeScript 6.0, Zod 4, Vitest 4, Storybook 10, Vite ^8, @dnd-kit 0.4
- ESLint with eslint-plugin-sonarjs (3 priority sweeps cleaned up); SonarJS rules promoted from warn to error
- Cognitive complexity reductions in sessionClassification, tabRestore, tabCapture, sessionOrderUtils
- WAI-ARIA initial focus across dialogs; aria-disabled pattern on focusable controls; color-contrast fixes via Radix Avatar/Kbd
- Storybook browser mock refactor and a11y test coverage improvements
- Shared shells extracted for import/export wizards, dialog close button, session name hover card, searchable select item
- Patched 11 audit vulnerabilities via pnpm.overrides
- i18n: 104 orphan keys removed; French default workspace renamed to "Principal"
- Save button simplified to a single contextual button (no SplitButton)
- Internal developer docs standardized to English; multilingual READMEs rewritten as concise vitrines

### Bug Fixes
- Import wizard: pack mode now uses the wizard Next button
- Import: match rules and sessions by id with label/name fallback
- Grouping: try every domain rule until one yields a group name
- Sidebar: prevent active item overflow and recenter collapsed icon
- Rules: wire keyboard shortcuts on the domain rules page
- Shortcuts: repair cheatsheet layout and Firefox global shortcuts
- E2E: isolate tab state in the flaky Save button aria-disabled test

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
