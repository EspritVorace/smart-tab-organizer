# Audit : Focus initial des dialogues

Date : 2026-05-05  
Branche : `claude/dialog-initial-focus-6R6oa`

## Résumé

15 dialogues identifiés dans l'extension. 5 ont déjà un focus management correct (custom `onOpenAutoFocus` ou `data-autofocus`). 10 nécessitent une action.

Le problème principal : `DialogShell.defaultOnOpenAutoFocus` ne fait rien quand aucun `[data-autofocus]` n'est présent. Radix donne alors le focus à la croix de fermeture (premier élément focusable du DOM). Appuyer sur `Enter` immédiatement après l'ouverture ferme le dialogue.

---

## Inventaire complet

### Catégorie A : `DialogShell` / `WizardModal`

| # | Composant | Fichier | Type WAI-ARIA | Focus actuel | Cible recommandée | `data-autofocus` ? | `onOpenAutoFocus` custom ? | Action | Risque |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DialogShell (base) | `src/components/UI/DialogShell/DialogShell.tsx` | Base | Croix si aucun `[data-autofocus]` | Titre (fallback) | N/A | Oui (defaultOnOpenAutoFocus) | Renforcer fallback vers titre (tabIndex=-1) | Faible |
| 2 | WorkspaceFormDialog | `src/components/UI/Workspace/WorkspaceFormDialog.tsx` | Formulaire (création/édition workspace) | Input nom (Radix default : premier focusable dans Dialog.Content = probablement input car croix absente) | Input nom (`#workspace-form-name`) | Non | Non | Migrer vers DialogShell + `data-autofocus` sur input | Faible |
| 3 | SessionEditDialog | `src/components/Core/Session/SessionEditDialog.tsx` | Formulaire (édition session) | Input nom (`#session-edit-name`) | Input nom | Non | Oui (target `#session-edit-name`) | Vérifier uniquement : OK | Faible |
| 4 | RestoreWizard step 0 | `src/components/UI/SessionWizards/RestoreWizard.tsx` | Wizard | Bouton Restaurer | Bouton Restaurer | Oui (sur le bouton) | Non | OK. Ajouter `data-autofocus` au step 1 | Faible |
| 5 | SnapshotWizard | `src/components/UI/SessionWizards/SnapshotWizard.tsx` | Wizard (capture session) | Input nom session | Input nom | Non | Oui (target `input[aria-label]`) | Vérifier uniquement : OK | Faible |
| 6 | RuleWizardModal | `src/components/Core/DomainRule/RuleWizardModal.tsx` | Wizard multi-étapes (règle domaine) | Input label | Input label | Non | Oui (target `input[name="label"]`) | Vérifier uniquement : OK | Faible |
| 7 | ConfigEditModal | `src/components/Core/DomainRule/ConfigEditModal.tsx` | Formulaire (config règle) | Croix (fallback Radix, aucun data-autofocus) | Titre (nouveau fallback DialogShell) | Non | Non | Fallback titre s'appliquera après Lot 1 | Faible |
| 8 | ImportWorkspaceDialog | `src/components/UI/Workspace/ImportWorkspaceDialog.tsx` | Wizard (import workspace) | Croix (fallback Radix) | Source textarea ou premier input step 0 | Non | Non | Ajouter `data-autofocus` sur premier champ | Faible |
| 9 | ExportWorkspaceDialog | `src/components/UI/Workspace/ExportWorkspaceDialog.tsx` | Wizard (export workspace) | Croix (fallback Radix) | Titre (fallback - contenu principalement informatif) | Non | Non | Fallback titre s'appliquera après Lot 1 | Faible |
| 10 | ImportSessionsWizard / ExportSessionsWizard | `src/components/UI/ImportExportWizards/` | Wizard (import/export sessions et règles) | Croix (fallback Radix) | Titre (fallback) ou premier champ | Non | Non | Fallback titre s'appliquera après Lot 1 | Faible |

### Catégorie B : `AlertDialog.Root` direct

| # | Composant | Fichier | Type WAI-ARIA | Focus actuel | Cible recommandée | `data-autofocus` ? | `onOpenAutoFocus` custom ? | Action | Risque |
|---|---|---|---|---|---|---|---|---|---|
| 11 | ConfirmDialog | `src/components/UI/ConfirmDialog/ConfirmDialog.tsx` | Confirmation destructive (rouge) | Bouton Annuler (Radix AlertDialog default : premier focusable) | Bouton Annuler (explicite) | Non | Non | `data-autofocus` + `focusAutoFocusTarget` | Faible |
| 12 | WorkspaceDeleteConfirmDialog | `src/components/UI/Workspace/WorkspaceDeleteConfirmDialog.tsx` | Destructif avec input obligatoire | Premier élément focusable (TextField ou Cancel) | Input saisie nom workspace | Non | Non | `data-autofocus` sur TextField + `focusAutoFocusTarget` | Faible |
| 13 | AlertDialogShell | `src/components/Core/TabTree/AlertDialogShell.tsx` | Confirmation destructive 3-boutons | Bouton Annuler (Radix default) | Bouton Annuler (explicite) | Non | Non | `data-autofocus` + `focusAutoFocusTarget` | Faible |
| 14 | SessionEditDialog sub-AlertDialog | `src/components/Core/Session/SessionEditDialog.tsx` (lignes 229-248) | Confirmation destructive (quitter sans sauver) | Premier élément focusable | Bouton Annuler | Non | Non | `data-autofocus` + `focusAutoFocusTarget` | Faible |

### Catégorie C : `Dialog.Root` direct (hors DialogShell)

| # | Composant | Fichier | Type WAI-ARIA | Focus actuel | Cible recommandée | `data-autofocus` ? | `onOpenAutoFocus` custom ? | Action | Risque |
|---|---|---|---|---|---|---|---|---|---|
| 15 | ShortcutsDrawer | `src/components/UI/ShortcutsPanel/ShortcutsDrawer.tsx` | Panneau navigation/aide (modal) | Premier trigger ouvert dans ShortcutsContent (via `focusFirstOpenTrigger`) | Premier trigger (comportement OK) | Non | Oui (requestAnimationFrame + document.querySelector fragile) | Harmoniser : remplacer `document.querySelector` par `e.currentTarget` | Faible |

---

## État détaillé par composant

### 1. DialogShell
- **Problème :** `defaultOnOpenAutoFocus` retombe sur le comportement Radix (croix) quand aucun `[data-autofocus]` n'est présent.
- **Correction :** Ajouter `tabIndex={-1}` et `data-dialog-title` sur `Dialog.Title`. Modifier le fallback pour cibler `[data-dialog-title]` avant de laisser Radix agir.

### 2. WorkspaceFormDialog
- **Problème :** Utilise `Dialog.Root` directement, pas `DialogShell`. Pas de `onOpenAutoFocus`. Le premier élément focusable est probablement l'input nom (pas de DialogCloseButton ici), mais c'est non garanti et non documenté.
- **Correction :** Migrer vers `DialogShell`. Ajouter `data-autofocus` sur l'input nom.

### 11. ConfirmDialog
- **Problème :** Pas de `onOpenAutoFocus`. Radix AlertDialog focase le premier focusable (Cancel en général), mais c'est implicite et non garanti si la structure change.
- **Correction :** Rendre le comportement explicite avec `data-autofocus` + `focusAutoFocusTarget`.

### 12. WorkspaceDeleteConfirmDialog
- **Problème :** Pas de `onOpenAutoFocus`. L'input de saisie suit le titre et la description dans le DOM, avant les boutons. Radix pourrait focaliser un élément imprévu.
- **Correction :** `data-autofocus` sur l'input + `focusAutoFocusTarget`. Justification : le bouton Confirmer est disabled jusqu'à la saisie correcte, donc aucun risque.

### 13. AlertDialogShell
- **Problème :** Pas de `onOpenAutoFocus`. Trois boutons : Cancel, SoftAction, DestructiveAction. Radix focalise Cancel (premier), OK par défaut mais implicite.
- **Correction :** Rendre explicite avec `data-autofocus` + `focusAutoFocusTarget`.

### 14. SessionEditDialog sub-AlertDialog
- **Problème :** AlertDialog imbriqué "unsaved changes". Pas de `onOpenAutoFocus`. Boutons : Cancel, Leave (rouge).
- **Correction :** `data-autofocus` sur Cancel + `focusAutoFocusTarget`.

### 15. ShortcutsDrawer
- **Problème :** `document.querySelector('[data-testid="shortcuts-drawer"]')` est fragile (pourrait sélectionner un mauvais élément si plusieurs instances). Comportement fonctionnel mais non robuste.
- **Correction :** Remplacer par `e.currentTarget as HTMLElement`.

---

## Analyse des risques sur les tests E2E existants

| Test | Fichier | Interaction concernée | Impact |
|---|---|---|---|
| "Escape closes the wizard modal" | `tests/e2e/rule-wizard.spec.ts` | Presse Escape après ouverture | Aucun : Escape != Enter |
| `urlInput.press('Enter')` | `tests/e2e/session-editor.spec.ts` | Enter dans un input à l'intérieur du dialogue | Aucun : focus déjà sur l'input |
| `nameInput.press('Enter')` | `tests/e2e/session-editor.spec.ts` | Enter dans un input group rename | Aucun : focus déjà sur l'input |

Aucune spec existante ne s'appuie sur le focus initial sur la croix. Aucune correction requise sur les specs existantes.

---

## Plan d'action (lots)

| Lot | Description | Fichiers modifiés |
|---|---|---|
| Lot 1 | Renforcer DialogShell fallback vers titre | `DialogShell.tsx`, `DialogShell.stories.tsx` (nouveau) |
| Lot 2 | Créer `focusAutoFocusTarget` utilitaire | `autoFocusHandler.ts` (nouveau), `DialogShell/index.ts` |
| Lot 3 | AlertDialogs sans focus management | `ConfirmDialog.tsx`, `AlertDialogShell.tsx`, `WorkspaceDeleteConfirmDialog.tsx`, `SessionEditDialog.tsx` |
| Lot 4 | Forms + WorkspaceFormDialog migration + ShortcutsDrawer | `WorkspaceFormDialog.tsx`, `ConfigEditModal.tsx`, `RestoreWizard.tsx`, `ImportWorkspaceDialog.tsx`, `ShortcutsDrawer.tsx` |
| Lot 5 | Stories + test E2E | `DialogShell.stories.tsx`, `ConfirmDialog.stories.tsx`, `AlertDialogShell.stories.tsx`, `dialog-initial-focus.spec.ts` |
| Lot 6 | User story US-A11Y001 | `user-stories/US-A11Y-focus-dialog.md` |
