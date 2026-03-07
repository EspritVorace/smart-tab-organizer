#!/usr/bin/env bash
# Crée toutes les issues GitHub à partir des fichiers Markdown user-stories/.
# Prérequis : gh CLI installé et authentifié (gh auth login)
# Usage : cd smart-tab-organizer && bash user-stories/create-issues.sh

set -euo pipefail

LABELS="story,enhancement"
DIR="$(cd "$(dirname "$0")" && pwd)"

declare -A ISSUES=(
  ["US-G-grouping.md"]="User Stories — Domaine G : Regroupement automatique d'onglets"
  ["US-D-deduplication.md"]="User Stories — Domaine D : Déduplication automatique d'onglets"
  ["US-C-combined.md"]="User Stories — Domaine C : Interactions entre Regroupement et Déduplication"
  ["US-AS-autosync.md"]="User Stories — Domaine AS : Synchronisation automatique des profils (background)"
  ["US-S-sessions.md"]="User Stories — Domaine S : Sessions (compléments US-S009→S015)"
  ["US-E-editeur.md"]="User Stories — Domaine E : Éditeur de session (compléments US-E003→E005)"
  ["US-P-profiles.md"]="User Stories — Domaine P : Profils (compléments US-P005→P009)"
  ["US-PO-popup.md"]="User Stories — Domaine PO : Popup (compléments US-PO003→PO005)"
  ["US-W-window.md"]="User Stories — Domaine W : Exclusivité fenêtre/profil (compléments US-W002→W003)"
  ["US-O-onboarding.md"]="User Stories — Domaine O : Onboarding et aide contextuelle (compléments US-O002→O004)"
  ["US-N-notifications.md"]="User Stories — Domaine N : Notifications avec action Annuler (US-N001→N005)"
  ["US-G-nommage.md"]="User Stories — Domaine G : Nommage des groupes — modes et presets (US-G011→G017)"
  ["US-IE-import-export.md"]="User Stories — Domaine IE : Import / Export de règles de domaine (US-IE001→IE009)"
)

# Ensure labels exist
gh label create "story"       --color "0075ca" --description "User story"             2>/dev/null || true
gh label create "enhancement" --color "a2eeef" --description "New feature or request" 2>/dev/null || true

for file in US-G-grouping.md US-D-deduplication.md US-C-combined.md US-AS-autosync.md \
            US-S-sessions.md US-E-editeur.md US-P-profiles.md US-PO-popup.md \
            US-W-window.md US-O-onboarding.md US-N-notifications.md US-G-nommage.md \
            US-IE-import-export.md; do
  title="${ISSUES[$file]}"
  body_file="$DIR/$file"

  echo "→ Création issue : $title"
  url=$(gh issue create \
    --title "$title" \
    --label "$LABELS" \
    --body-file "$body_file")
  echo "  ✓ $url"
done

echo ""
echo "Toutes les issues ont été créées."
