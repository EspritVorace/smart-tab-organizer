#!/usr/bin/env bash
#
# Grep guard: forbid direct DOM access in Playwright specs (lot 7, #325).
#
# Page Objects in `e2e-shared/pages/` own the locators that target Radix
# dialogs and wizards. Specs and pipeline helpers must consume Page
# Objects instead of reaching into the DOM with `page.getByRole('dialog')`
# or `page.locator(...)`. This is what makes a UI refactor break every
# spec at the same call site (the convergence guarantee documented in
# `CLAUDE.md`).
#
# This script grep's `tests/e2e/` and `e2e-doc-scenarios/` for the two
# forbidden patterns, then filters out:
#
# 1. Lines whose own content or whose immediately preceding line carries
#    the marker `// allow-inline-dom`. Use the marker for one-off
#    legitimate cases (a `<mark>` highlight, a drag-handle attribute
#    selector, a `body.click()` gesture, ...).
# 2. Entire files listed in `e2e-inline-dom-allowlist.txt` (meta-tests
#    whose purpose IS to assert on the raw `role="dialog"` element).
#
# Run locally:
#
#   bash .github/scripts/e2e-no-inline-dom.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ALLOWLIST="${ROOT}/.github/scripts/e2e-inline-dom-allowlist.txt"

cd "${ROOT}"

# Forbidden patterns:
#   - getByRole('dialog' / "dialog"
#   - page.locator(...) anchored on the `page` variable (helpers that
#     receive a Locator and chain `.locator(...)` are not matched).
PATTERN='getByRole\(['"'"'"]dialog|page\.locator\('
MARKER='allow-inline-dom'

# Use awk over each file: per match, accept if the current line OR any
# of the contiguous comment / blank lines immediately preceding it carry
# the marker. This makes the marker tolerant of multi-line comment
# blocks ("// foo\n// bar\n// allow-inline-dom\nawait expect(...)").
# Output mirrors `grep -rn` (`path:lineno:content`).
collect_violations() {
  local root="$1"
  find "${root}" -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 \
    | while IFS= read -r -d '' file; do
        awk -v file="${file}" -v pat="${PATTERN}" -v marker="${MARKER}" '
          {
            lines[NR] = $0
          }
          END {
            for (i = 1; i <= NR; i++) {
              if (lines[i] !~ pat) continue
              if (lines[i] ~ marker) continue
              found = 0
              # Look back through contiguous comment / blank / continuation
              # lines for the marker. Stop at the first non-comment code line.
              for (j = i - 1; j >= 1 && j >= i - 8; j--) {
                if (lines[j] ~ marker) { found = 1; break }
                # Lines counted as "still attached to i": blank, // comment,
                # /* ... */ block comment, or an opening `await expect(`
                # / `await` line that wraps onto the next line.
                if (lines[j] ~ /^[[:space:]]*$/) continue
                if (lines[j] ~ /^[[:space:]]*\/\//) continue
                if (lines[j] ~ /^[[:space:]]*\*/) continue
                if (lines[j] ~ /^[[:space:]]*\/\*/) continue
                if (lines[j] ~ /^[[:space:]]*await[[:space:]]+expect\([[:space:]]*$/) continue
                if (lines[j] ~ /^[[:space:]]*expect\([[:space:]]*$/) continue
                break
              }
              if (!found) {
                printf("%s:%d:%s\n", file, i, lines[i])
              }
            }
          }
        ' "${file}"
      done
}

matches=$(collect_violations tests/e2e; collect_violations e2e-doc-scenarios)

# Apply the file-level allow-list (paths listed there are skipped wholesale).
if [ -s "${ALLOWLIST}" ] && [ -n "${matches}" ]; then
  while IFS= read -r entry; do
    case "${entry}" in
      ''|\#*) continue ;;
    esac
    matches=$(echo "${matches}" | grep -v -F "${entry}" || true)
  done < "${ALLOWLIST}"
fi

if [ -z "${matches}" ]; then
  echo "No inline DOM access detected."
  exit 0
fi

echo "Inline DOM access detected outside Page Objects:"
echo ""
echo "${matches}"
echo ""
echo "Either wrap the locator in a Page Object under e2e-shared/pages/,"
echo "or tag the offending line (or the line just above it) with:"
echo ""
echo "  // allow-inline-dom"
echo ""
echo "if the selector is legitimately local (e.g. <mark> highlight, drag"
echo "handle, body.click()). For meta-tests that assert on the raw"
echo "role='dialog' element, add the file path to:"
echo ""
echo "  .github/scripts/e2e-inline-dom-allowlist.txt"
echo ""
exit 1
