#!/usr/bin/env bash
#
# Install the fonts vendored under ci/fonts/ into the fontconfig user directory
# so the Playwright / Chromium screenshot pipelines render deterministically.
#
# This replaces the font packages that `playwright install --with-deps chromium`
# used to apt-get from the Ubuntu mirrors (the flakiest step of the pipeline).
# The Chromium runtime libraries are already present on the GitHub-hosted
# ubuntu-latest image, so only the fonts need to be provided here.
set -euo pipefail

FONTS_DEST="${HOME}/.local/share/fonts"
mkdir -p "${FONTS_DEST}"

cp ci/fonts/freefont/*.ttf "${FONTS_DEST}/"
cp ci/fonts/noto-color-emoji/*.ttf "${FONTS_DEST}/"

fc-cache -f "${FONTS_DEST}"

echo "Installed vendored CI fonts into ${FONTS_DEST}:"
fc-list | grep -iE "freefont|noto color emoji" || {
  echo "::error::Vendored CI fonts were not registered by fontconfig." >&2
  exit 1
}
