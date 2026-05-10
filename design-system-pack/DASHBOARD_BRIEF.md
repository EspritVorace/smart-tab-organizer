# Dashboard Page: Brief

Page to add to the **Options page** of the SmartTab Organizer extension
(not a marketing site, not the web homepage). Goal: give the user a
synthesis view that removes the need to navigate the other tabs to
understand the state of their system.

## Architectural integration (non-negotiable)

The page sits at the same level as the existing pages listed in
`src/pages/options.tsx`:

| id | label (i18n key) | icon | component |
|---|---|---|---|
| `rules` | `domainRulesTab` | `Shield` | `DomainRulesPage` |
| `sessions` | `sessionsTab` | `Archive` | `SessionsPage` |
| `importexport` | `importExportTab` | `FileText` | `ImportExportPage` |
| `stats` | `statisticsTab` | `BarChart3` | `StatisticsPage` |
| `settings` | `settingsTab` | `Settings` | `SettingsPage` |

The new entry is **the first** in the Sidebar:

| id | label (new i18n key) | icon | component |
|---|---|---|---|
| `dashboard` | `dashboardTab` | `LayoutDashboard` (Lucide) | `DashboardPage` |

Integration constraints:

- Hash routing: `window.location.hash = 'dashboard'`. Already handled
  by `useDeepLinking`; just add the case in `options.tsx`.
- Required wrapper: `<PageLayout titleKey="dashboardTab"
  descriptionKey="dashboardPageDescription" icon={LayoutDashboard}
  syncSettings={settings}>`. See `samples/layout/PageLayout.tsx` in
  this pack.
- Unified `indigo` accent, Radix tokens, no hardcoded color.
- Every string via `getMessage('key')` (do NOT hardcode). The new
  keys will be added in all three locales (EN / FR / ES).
- Prefer Radix Themes components (`Card`, `Flex`, `Grid`, `Box`,
  `Heading`, `Text`, `Button`, `IconButton`, `Badge`, `Separator`,
  `Tooltip`).
- Lucide icons with `aria-hidden="true"`. Icon-only buttons carry
  `aria-label` and `title`.

## Dashboard page contents

The user already has these pages elsewhere: Rules, Sessions,
ImportExport, Stats, Settings. The dashboard **does not replace**
those pages, it summarizes them and exposes shortcuts.

### Suggested layout (responsive)

12-column grid (Radix `Grid`) that collapses on mobile. Mobile: each
widget spans 12 columns. Desktop: 2 / 3 / 4 column compositions
depending on the widget.

### Widgets (in reading order)

1. **Welcome / state banner** (12 cols)
   - If **0 rules configured**: call to action "Create your first
     rule" routing to `#rules`.
   - If **grouping OR dedup globally disabled**: callout
     `color="orange"` with an inline toggle to re-enable.
   - Otherwise: subdued banner `color="gray"` with a short summary
     ("12 rules active, 3 pinned sessions").

2. **Global toggles** (4 cols x 2)
   - Two side-by-side cards each with a Radix Switch: Grouping ON/OFF,
     Deduplication ON/OFF. Labels via i18n. Persistence via
     `useSyncedSettings`.

3. **Statistics summary** (3 cols x 2)
   - Reuse the two KPI cards from `StatisticsPage` (Groups created,
     Tabs deduplicated). Same visual: Lucide icon (`Layers`, `Copy`),
     counter at `size="8"` `weight="bold"` with
     `color: var(--accent-11)`, label in `gray`. No reset button
     here, leave that on the Stats page.
   - Add a third card "Active rules" that counts
     `settings.domainRules.filter(r => r.enabled).length` if that
     state is available. If unavailable, omit it.

4. **Pinned sessions** (12 cols, one or several rows)
   - Horizontally scrollable list of pinned sessions (existing
     popup component: `PopupProfilesList`, not provided in this pack
     because it is domain-locked, to be reproduced with the DS
     primitives).
   - Each item: session icon, name, tab count, "Restore" action
     (primary button) plus a `DropdownMenu` (Edit, Unpin, Delete).
   - Empty state when no pinned session: use `EmptyState` from the
     pack (`samples/composed/EmptyState.tsx`) with a dedicated
     message (`dashboardPinnedSessionsEmpty`) and a "Browse sessions"
     button routing to `#sessions`.

5. **Recent activity** (6 cols)
   - Compact list of the 5 most recently created sessions (sorted by
     `createdAt` desc): name + relative date + restore button.
   - When data is unavailable or 0 sessions: compact `EmptyState`.

6. **Quick actions** (6 cols)
   - 2x2 grid of card-buttons: "New rule", "Snapshot current window",
     "Import", "Export".
   - Each card: Lucide icon, title, one-line description, click
     action. Routes to the relevant page or opens the appropriate
     wizard.

### Key interactions

- Click on a stats KPI card: scrolls / routes to `#stats`.
- Click on a pinned session (main area): launches the restore
  (wizard on conflict).
- Click "Snapshot current window": opens the existing
  `SnapshotWizard` (`openSnapshotWizard` in `useDeepLinking`).

### States to cover

| State | Rendering |
|---|---|
| Loading (settings not yet loaded) | `Spinner size="3"` + `Text` (pattern at options.tsx line 66) |
| 0 rules, 0 sessions, toggles off | Welcome state + quick actions only |
| Toggles off but data present | Orange callout + normal widgets |
| Nominal | Subdued welcome banner + every widget |
| Loading error | Red `Callout` with message + retry button (out of scope for v1 if too costly) |

### Accessibility

- One `<h1>` via `Heading as="h1"` in `PageLayout` (already handled).
- Widgets wrapped in `<section aria-labelledby>` with a visible
  `Heading as="h2"` inside each.
- Full keyboard navigation: Tab between widgets, Enter to activate
  the quick actions.
- Each KPI card properly announced: `aria-label` or `<Text>` +
  `<Text>` structure is enough.

### i18n

New keys to add in `public/_locales/{en,fr,es}/messages.json`:

- `dashboardTab`
- `dashboardPageDescription`
- `dashboardWelcomeEmpty`
- `dashboardWelcomeNominal`
- `dashboardTogglesDisabledWarning`
- `dashboardActiveRulesKpi`
- `dashboardPinnedSessionsSection`
- `dashboardPinnedSessionsEmpty`
- `dashboardRecentActivitySection`
- `dashboardQuickActionsSection`
- `dashboardQuickActionNewRule`
- `dashboardQuickActionSnapshot`
- `dashboardQuickActionImport`
- `dashboardQuickActionExport`

Claude Design can produce the page in EN using `getMessage`. FR / ES
translations will follow in a later step.

## Expected deliverables from Claude Design

1. `DashboardPage.tsx` component to place in `src/pages/`.
2. `DashboardPage.stories.tsx` with at least these variants:
   `DashboardEmpty`, `DashboardTogglesOff`, `DashboardNominal`,
   `DashboardNoPinnedSessions`.
3. Optional extraction of sub-components into
   `src/components/UI/Dashboard/` (KpiCard, QuickActionTile,
   WelcomeBanner) when decomposition improves readability.
4. Diff patch (or snippet) for `src/pages/options.tsx` showing the
   added sidebar entry and the `currentTab === 'dashboard'` route.
5. Partial diff for `public/_locales/en/messages.json` with the new
   keys.

## What Claude Design should avoid

- Inventing metrics that do not exist in the `Statistics` type
  (currently: `tabGroupsCreatedCount`, `tabsDeduplicatedCount`).
  When a KPI has no data source, mark it clearly with a
  `[needs data source]` comment and do not display it.
- Adding a 6th sidebar entry beyond Dashboard.
- Re-implementing Pinned Sessions from scratch: propose to reuse the
  existing `PopupProfilesList` component by adapting it (the pack
  does not ship it because it is domain-locked, but Claude Design
  can produce a design-system-aware version using the supplied
  primitives).
- Dark patterns (modal notifications on load, intrusive pop-ups).
- Emojis, em-dashes, hardcoded strings.

## References in the pack

- `samples/layout/PageLayout.tsx`: required page wrapper.
- `samples/composed/EmptyState.tsx`: empty state.
- `samples/atomic/StatusBadge.tsx`: badge (reusable for the on/off
  toggles).
- `samples/composition/SessionCard.tsx`: inspiration for the pinned
  sessions (DnD + HoverCard metadata patterns).
- `samples/form/FormField.tsx` + `FieldError.tsx` + `FieldLabel.tsx`:
  not directly used here, but the composition conventions apply.
- `conventions.md`: global rules (i18n, a11y, writing style).
- `theme/radix-themes.css`: available CSS tokens.
