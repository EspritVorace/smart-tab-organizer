#!/usr/bin/env bash
# Creates all GitHub issues from the user-stories/ Markdown files.
# Prerequisites: gh CLI installed and authenticated (gh auth login).
# Usage: cd smart-tab-organizer && bash user-stories/create-issues.sh

set -euo pipefail

LABELS="story,enhancement"
DIR="$(cd "$(dirname "$0")" && pwd)"

declare -A ISSUES=(
  ["US-G-grouping.md"]="User Stories: Domain G, automatic tab grouping"
  ["US-D-deduplication.md"]="User Stories: Domain D, automatic tab deduplication"
  ["US-C-combined.md"]="User Stories: Domain C, interactions between Grouping and Deduplication"
  ["US-AS-autosync.md"]="User Stories: Domain AS, automatic profile sync (background)"
  ["US-S-sessions.md"]="User Stories: Domain S, sessions (additions US-S009 to US-S015)"
  ["US-E-editor.md"]="User Stories: Domain E, session editor (additions US-E003 to US-E005)"
  ["US-P-profiles.md"]="User Stories: Domain P, profiles (additions US-P005 to US-P009)"
  ["US-PO-popup.md"]="User Stories: Domain PO, popup (additions US-PO003 to US-PO005)"
  ["US-W-window.md"]="User Stories: Domain W, window/profile exclusivity (additions US-W002 to US-W003)"
  ["US-O-onboarding.md"]="User Stories: Domain O, onboarding and contextual help (additions US-O002 to US-O004)"
  ["US-N-notifications.md"]="User Stories: Domain N, notifications with Undo action (US-N001 to US-N005)"
  ["US-G-naming.md"]="User Stories: Domain G, group naming modes and presets (US-G011 to US-G017)"
  ["US-IE-import-export.md"]="User Stories: Domain IE, import / export of domain rules (US-IE001 to US-IE009)"
  ["US-SC-screenshots.md"]="User Stories: Domain SC, automatic screenshot generation (US-SC001 to US-SC004)"
)

# Ensure labels exist.
gh label create "story"       --color "0075ca" --description "User story"             2>/dev/null || true
gh label create "enhancement" --color "a2eeef" --description "New feature or request" 2>/dev/null || true

for file in US-G-grouping.md US-D-deduplication.md US-C-combined.md US-AS-autosync.md \
            US-S-sessions.md US-E-editor.md US-P-profiles.md US-PO-popup.md \
            US-W-window.md US-O-onboarding.md US-N-notifications.md US-G-naming.md \
            US-IE-import-export.md US-SC-screenshots.md; do
  title="${ISSUES[$file]}"
  body_file="$DIR/$file"

  echo "-> Creating issue: $title"
  url=$(gh issue create \
    --title "$title" \
    --label "$LABELS" \
    --body-file "$body_file")
  echo "  + $url"
done

echo ""
echo "All issues have been created."
