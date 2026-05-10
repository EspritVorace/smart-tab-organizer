# User Stories - Domain SC: Automatic screenshot generation

> Playwright script dedicated to producing screenshots for the
> documentation and the stores (Chrome Web Store, Firefox Add-ons).
> Based on the existing E2E infrastructure (`tests/e2e/fixtures.ts`,
> `tests/e2e/helpers/seed.ts`).

---

## US-SC001 - Multi-locale and multi-theme screenshot generation script

**As a** developer or extension release manager,
**I want** to run a single command that generates screenshots of all main features in the 3 languages and in light and dark themes,
**so that** I have up-to-date illustrations for the documentation, the stores, and the release notes, without producing them manually.

### Acceptance criteria

- [ ] An `npm run screenshots` command runs the generation script.
- [ ] The script iterates over the 3 supported locales: **en**, **fr**, **es**.
- [ ] For each locale, the extension is launched via `chromium.launchPersistentContext()` with the `--lang={locale}` argument.
- [ ] For each locale, captures are taken in **light theme** then in **dark theme** (toggling via the ThemeToggle button of the interface).
- [ ] Captures are saved into `screenshots/{locale}/{theme}/` with a descriptive filename (e.g. `popup.png`, `grouping-rules.png`).
- [ ] The script reuses the existing seeding helpers (`seedSessions`, `addDomainRule`, etc.) to populate the extension with realistic data before each capture.
- [ ] The viewport is set to a consistent resolution for all captures (e.g. 1280 x 800 px).
- [ ] The script does not crash if a capture fails: the error is logged and the next capture is attempted.

---

## US-SC002 - Coverage of main features

**As a** developer,
**I want** the script to capture the most representative screens of each main feature,
**so that** each capture clearly illustrates the value added by the feature.

### Acceptance criteria

The following captures are produced for every locale x theme combination:

#### Popup
- [ ] `popup.png`: Popup with active domain rules and statistics shown.

#### Grouping (options -> Domain Rules)
- [ ] `grouping-rules-list.png`: List of domain rules with multiple configured rules (varied colors, filters).
- [ ] `grouping-rule-form.png`: Domain rule add/edit modal open.

#### Deduplication (options -> Domain Rules)
- [ ] `deduplication-toggle.png`: Rules section with the deduplication toggle enabled on at least one rule.

#### Sessions (options -> Sessions)
- [ ] `sessions-list.png`: List of sessions with at least 2 ordinary sessions and 1 pinned profile.
- [ ] `restore-wizard-conflicts.png`: Restore wizard open at the conflict resolution step (simulated data with duplicates and conflicting groups).

#### Import / Export (options -> Domain Rules)
- [ ] `import-wizard-step1.png`: Import wizard at the rule classification step (new + conflicting + identical).
- [ ] `import-wizard-step2.png`: Import wizard at the confirmation step with a recap.
- [ ] `export-wizard.png`: Export wizard at the rule selection step.

---

## US-SC003 - Organization and naming of output files

**As a** developer,
**I want** captures to be organized in a clear tree,
**so that** I can find and use them easily.

### Acceptance criteria

- [ ] Output structure:
  ```
  screenshots/
  |-- en/
  |   |-- light/
  |   |   |-- popup.png
  |   |   |-- grouping-rules-list.png
  |   |   `-- ...
  |   `-- dark/
  |       |-- popup.png
  |       `-- ...
  |-- fr/
  |   |-- light/
  |   `-- dark/
  `-- es/
      |-- light/
      `-- dark/
  ```
- [ ] The `screenshots/` folder is created automatically if it does not exist.
- [ ] Existing files are overwritten on each run (no accumulation of stale captures).
- [ ] The `screenshots/` folder is listed in `.gitignore` (captures are not versioned).

---

## US-SC004 - Realistic demo data

**As a** developer,
**I want** captures to be fed by data representative of real usage,
**so that** illustrations are convincing for potential users.

### Acceptance criteria

#### Domain rules (at least 4 rules)
- [ ] A "Google" rule (filter: `google.com`, color: blue, grouping + deduplication enabled).
- [ ] A "GitHub" rule (filter: `github.com`, color: purple, grouping enabled).
- [ ] A "YouTube" rule (filter: `youtube.com`, color: red, grouping enabled, deduplication enabled).
- [ ] A "News" rule (filter: `lemonde.fr|lefigaro.fr`, color: orange, grouping enabled).

#### Sessions
- [ ] A pinned profile "Work" with a `briefcase` icon, containing 2 groups ("GitHub", "Docs") and 3 tabs.
- [ ] An ordinary session "Research" with 1 group and 4 tabs.
- [ ] An ordinary session "Side Project" with 2 groups and 5 tabs.

#### Conflicts for the restore wizard
- [ ] At least 2 simulated duplicate tabs (same URL already open in the window).
- [ ] At least 1 conflicting group (same title + same color as an existing group).

#### Import
- [ ] Prepared import JSON containing: 2 new rules, 1 conflicting rule (same label, different domainFilter), 1 identical rule.
