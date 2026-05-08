# `e2e-doc-scenarios/` — narrative documentation captures

This pipeline produces screenshots organised in **narrative scenarios** (full
user journeys) for the Starlight documentation, the README, and the Chrome
Web Store listing. It coexists with two other pipelines:

| Pipeline | Question it answers | Where it lives |
|---|---|---|
| `tests/e2e/` | Does the feature work in every case (happy path + edge cases)? | unchanged |
| `e2e-screenshots/` | Does each individual screen render correctly across locales/themes? | unchanged |
| `e2e-doc-scenarios/` (this) | Does the nominal user journey produce the right screens, in narrative order? | here |

## Layout

```
e2e-doc-scenarios/
  fixtures/         Static mimetic sites (github.com, youtube.com, …) served on :4173.
  helpers/          doc-fixture, doc-capture (counter), ui-actions, scenario-readme.
  scenarios/        00-main-journey.scenario.ts + 10..13 satellite scenarios.
                    Each scenario ships its `.routing.ts` companion.
  output/           Generated PNGs (gitignored), one folder per (locale, theme, scenario).
```

## Running locally

```bash
pnpm doc:scenarios          # build + Playwright matrix (3 locales × 2 themes)
pnpm doc:scenarios:audit    # static check: manifests vs output vs destinations
pnpm doc:scenarios:sync     # re-route output to docs/src/assets/screenshots, doc/readme, doc/chrome-web-store
```

The full matrix takes a few minutes (one persistent Chromium context per
project, 6 sequential runs). Pass `--project=en-dark` to the underlying
Playwright command to limit it to one combination while iterating:

```bash
pnpm build
xvfb-run -- pnpm exec playwright test \
  --config=e2e-doc-scenarios/playwright.doc.config.ts \
  --project=en-dark
```

The audit report lands at `reports/routing-audit.md` (gitignored). Read it to
spot orphan captures, references that point to nothing, or destination files
that nobody produces anymore.

## CI

`.github/workflows/doc-scenarios.yml` runs the full matrix:

- on `workflow_dispatch` (with an optional `open_pr` input that pushes a PR
  refreshing the routed assets);
- on tag pushes (`v*`);
- on a weekly cron (Monday 06:00 UTC).

It is **not** wired to `pull_request` because the run is too costly to be
useful on every code change — the capture pipeline is decoupled from
functional CI.

The job uploads three artifacts:

- `doc-scenarios-output` — raw `e2e-doc-scenarios/output/`;
- `doc-scenarios-routed` — copies that ended up in `docs/src/assets/screenshots/`,
  `doc/readme/`, `doc/chrome-web-store/` (driven by the routing manifests);
- `doc-scenarios-audit` — the `reports/routing-audit.md` produced by
  `pnpm doc:scenarios:audit`.

## Adding a new scenario

1. Create `scenarios/NN-my-scenario.scenario.ts` — copy `13-grouping-modes` as a
   baseline. It reads `docLocale` / `docTheme` from the project metadata and
   uses `captureStep(page, 'name', { description: '…' })` to save numbered
   captures under `output/{locale}/{theme}/NN-my-scenario/`.
2. Create `scenarios/NN-my-scenario.routing.ts` — start with `{ routes: [] }`.
   Routes are added incrementally once the captures pass visual review.
3. Run the scenario locally (`--project=en-dark` is enough for iteration).
4. Inspect `output/en/dark/NN-my-scenario/` and the `README.md` it generates.
5. Once happy, fill in `routes` so the captures are copied to the right
   destinations (Starlight, README, Chrome Web Store).
6. Run `pnpm doc:scenarios:audit` — it should now pass.

## Adding a route to a manifest

Each `*.routing.ts` exports a `Manifest` describing how individual captures fan
out to destination roots. Routes are typed in `e2e-shared/routing/types.ts`:

```ts
export const MAIN_JOURNEY_MANIFEST: Manifest = {
  routes: [
    {
      capture: 'rules-list-populated',         // capture name passed to captureStep()
      destinations: [
        {
          target: 'starlight',                  // 'starlight' | 'readme' | 'chrome-web-store'
          path: 'journey-rules-list-populated', // final filename, no extension
          locales: ['en', 'fr', 'es'],          // omit to accept every locale
          themes: ['dark', 'light'],            // omit to accept every theme
        },
      ],
    },
  ],
};
```

Filenames without `{locale}` / `{theme}` placeholders are automatically
prefixed with `{locale}-{theme}-` to keep the existing naming convention used
by `e2e-screenshots/`. Use the placeholders explicitly when you need a custom
layout (e.g. one folder per locale).

After adding a route, the next `pnpm doc:scenarios` run will copy the matching
PNG to the destination root. Use `pnpm doc:scenarios:sync` to refresh
destinations from the cached output without re-running Playwright.

## Naming convention for Starlight authors

When a capture is routed to `starlight` with a bare `path` (no placeholder),
it lands at:

```
docs/src/assets/screenshots/{locale}-{theme}-{path}.png
```

MDX pages import the `light` and `dark` variants and pass them to the shared
`<ThemeImage />` component:

```mdx
import ThemeImage from '../../components/ThemeImage.astro';
import imgLight from '../../assets/screenshots/fr-light-journey-rules-list-populated.png';
import imgDark  from '../../assets/screenshots/fr-dark-journey-rules-list-populated.png';

<ThemeImage lightSrc={imgLight} darkSrc={imgDark} alt="…" />
```

Prefix narrative captures with `journey-` when routing them to Starlight to
keep them visually distinct from `e2e-screenshots/` exports (which use the
bare feature name, e.g. `rules-list.png`).
