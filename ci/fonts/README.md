# Vendored CI fonts

These font files are committed to the repository on purpose. The CI screenshot
pipelines (Playwright E2E in `tests/e2e/`, narrative captures in
`e2e-doc-scenarios/`, Storybook a11y run) need a deterministic set of fonts so
that rendered PNGs stay stable across runners.

Previously the fonts were pulled at every CI run by
`playwright install --with-deps chromium`, which runs `apt-get install` for a
batch of font packages (`fonts-freefont-ttf`, `fonts-noto-color-emoji`, the
CJK packages, ...) from the Ubuntu mirrors. Those mirrors are intermittently
slow or unreachable, so the font download became the flakiest step of the
pipeline. The Chromium runtime libraries are already present on the
GitHub-hosted `ubuntu-latest` image (the apt step only ever installed the font
packages as "newly installed"), so we keep `playwright install chromium`
(browser binary, served from the cached Playwright CDN) and provide the fonts
from here instead.

## Contents

| Directory | Font | Version | License |
|---|---|---|---|
| `freefont/` | GNU FreeFont (Sans / Serif / Mono) | 20120503 | GPL-3.0-or-later WITH Font-exception-2.0 |
| `noto-color-emoji/` | Noto Color Emoji | 2.051 | OFL-1.1 |

`fonts.manifest.json` is the single source of truth consumed by
`scripts/generate-third-party-licenses.mjs` to attribute these fonts in
`THIRD-PARTY-LICENSES.txt` and the `reference/open-source-licenses` doc pages.
The verbatim license texts live in `licenses/`.

These fonts are **test / CI tooling only**: they are not redistributed inside
the published extension, which relies on the system font stack.

## How CI installs them

Each Playwright job copies the files into the fontconfig user directory and
refreshes the cache before launching Chromium:

```bash
mkdir -p "$HOME/.local/share/fonts"
cp ci/fonts/freefont/*.ttf ci/fonts/noto-color-emoji/*.ttf "$HOME/.local/share/fonts/"
fc-cache -f
```

## Refreshing

- GNU FreeFont: <https://ftp.gnu.org/gnu/freefont/freefont-ttf-20120503.zip>
- Noto Color Emoji: <https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf>

After replacing the binaries, bump the `version` in `fonts.manifest.json`,
refresh the matching file under `licenses/` if the upstream license changed,
then run `pnpm licenses:generate` to regenerate the attribution artifacts.
