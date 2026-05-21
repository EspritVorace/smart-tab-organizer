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
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ALLOWLIST="${ROOT}/.github/scripts/e2e-inline-dom-allowlist.txt"

cd "${ROOT}"

# Forbidden patterns:
#   - getByRole('dialog' / "dialog"
#   - page.locator(...) anchored on the `page` variable (helpers that
#     receive a Locator and chain `.locator(...)` are not matched).
PATTERN='getByRole\(['"'"'"]dialog|page\.locator\('
MARKER='allow-inline-dom'

# Collect candidate violations: `grep -rnE` returns `path:lineno:content`
# for every line matching the forbidden pattern. The `|| true` swallows
# grep's exit code 1 (no matches), which is the success case for us.
candidates=$(
  grep -rnE "${PATTERN}" tests/e2e e2e-doc-scenarios \
    --include='*.ts' --include='*.tsx' \
    2>/dev/null || true
)

if [ -z "${candidates}" ]; then
  echo "No inline DOM access detected."
  exit 0
fi

# For each candidate `path:lineno:content`, accept it if:
#  - the matched line itself carries the marker, or
#  - any of the up-to-8 preceding non-code lines (comments, blanks,
#    bare `await expect(` wrappers) carries the marker.
violations=""
while IFS= read -r line; do
  # Skip blank entries (defensive).
  [ -z "${line}" ] && continue

  # Parse `path:lineno:content`. The content may itself contain colons,
  # so cut just the first two fields.
  file=${line%%:*}
  rest=${line#*:}
  lineno=${rest%%:*}
  content=${rest#*:}

  # Marker on the matched line itself.
  case "${content}" in
    *"${MARKER}"*) continue ;;
  esac

  # Look back up to 8 lines for the marker. Stop early at a code line
  # (not a comment / blank / bare `await expect(` wrapper).
  found_marker=0
  start=$((lineno - 1))
  end=$((lineno - 8))
  [ "${end}" -lt 1 ] && end=1

  for ((n = start; n >= end; n--)); do
    prev_line=$(sed -n "${n}p" "${file}")
    case "${prev_line}" in
      *"${MARKER}"*) found_marker=1; break ;;
    esac
    # Trim leading whitespace for the "is this still attached" check.
    trimmed=${prev_line#"${prev_line%%[![:space:]]*}"}
    case "${trimmed}" in
      ''|//*|'*'*|'/*'*) continue ;;
      'await expect('|'expect(') continue ;;
      *) break ;;
    esac
  done

  if [ "${found_marker}" -eq 0 ]; then
    violations="${violations}${line}"$'\n'
  fi
done <<< "${candidates}"

# Apply the file-level allow-list (paths listed there are skipped wholesale).
if [ -s "${ALLOWLIST}" ] && [ -n "${violations}" ]; then
  while IFS= read -r entry; do
    case "${entry}" in
      ''|\#*) continue ;;
    esac
    violations=$(echo "${violations}" | grep -v -F "${entry}" || true)
  done < "${ALLOWLIST}"
fi

# Trim trailing newline for the empty check.
violations=$(printf '%s' "${violations}")

if [ -z "${violations}" ]; then
  echo "No inline DOM access detected."
  exit 0
fi

echo "Inline DOM access detected outside Page Objects:"
echo ""
echo "${violations}"
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
