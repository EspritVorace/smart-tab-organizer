# User Stories — Domaine A11Y : Accessibilité

---

## US-A11Y001 — Focus initial des dialogues

**En tant qu'** utilisateur naviguant au clavier ou utilisant un lecteur d'ecran,
**je veux** que le focus initial d'un dialogue soit positionne sur l'element le plus pertinent a l'ouverture,
**afin de** ne pas fermer accidentellement le dialogue en appuyant sur `Entrée` et de comprendre immediatement le contexte ou l'action attendue.

### Contexte

Radix UI (`Dialog.Content`, `AlertDialog.Content`) place par defaut le focus sur le premier element focusable du DOM, qui est presque toujours la croix de fermeture (`DialogCloseButton`). Un appui immediat sur `Entree` ferme alors le dialogue, ce qui contredit le WAI-ARIA Authoring Practices Guide (APG) Modal Dialog Pattern.

### Convention de focus initial par type de dialogue

| Type | Cible du focus initial | Justification |
|---|---|---|
| Formulaire (creation, edition) | Premier champ de saisie utile | L'utilisateur veut saisir, pas fermer. |
| Wizard multi-etapes | Premier champ utile de l'etape active, ou bouton principal si l'etape n'a pas de champ | Identique, adapte a la progression. |
| Confirmation destructive | Bouton **Annuler** | WAI-ARIA APG Alert Dialog. Evite la confirmation accidentelle. |
| Destructif avec input obligatoire | L'input de validation (le bouton Confirmer est desactive tant que la saisie ne correspond pas) | Pas de risque d'action accidentelle : Confirmer est desactive. |
| Informationnel (sans champ ni action principale claire) | Titre du dialogue (`tabIndex={-1}`) | WAI-ARIA APG, troisieme cas. Le lecteur d'ecran annonce le titre a l'ouverture. |

**Regle absolue : `DialogCloseButton` ne doit jamais recevoir le focus initial.**

### Criteres d'acceptation

- [ ] L'ouverture du wizard de creation de regle place le focus sur l'input « Etiquette ».
- [ ] L'ouverture du dialogue de creation de workspace place le focus sur l'input nom.
- [ ] L'ouverture d'un `ConfirmDialog` (destruction) place le focus sur le bouton Annuler. Appuyer sur `Entree` immediatement ferme le dialogue sans declencher l'action destructive.
- [ ] L'ouverture de l'`AlertDialogShell` place le focus sur le bouton Annuler (le moins destructeur des trois).
- [ ] L'ouverture du `RestoreWizard` place le focus sur le bouton Restaurer (step 0).
- [ ] L'ouverture d'un `DialogShell` sans element `[data-autofocus]` place le focus sur le titre du dialogue (pas sur la croix de fermeture).
- [ ] Le titre focuse programmatiquement n'affiche pas de focus ring visible (il est cible de focus non interactif).
- [ ] Le `WorkspaceDeleteConfirmDialog` place le focus sur l'input de saisie du nom (pas sur Annuler, car Confirmer est desactive jusqu'a la saisie correcte).

### Implementation

#### Utilitaire partage

`src/components/UI/DialogShell/autoFocusHandler.ts` exporte `focusAutoFocusTarget(event: Event)`.
Passer cette fonction en `onOpenAutoFocus` sur `AlertDialog.Content`.

#### Convention `data-autofocus`

Ajouter `data-autofocus="true"` sur le premier element cible (champ ou bouton Annuler selon le type).
`DialogShell.defaultOnOpenAutoFocus` cherche cet attribut en priorite, puis bascule sur le titre.

#### Fallback titre dans `DialogShell`

`Dialog.Title` recoit `tabIndex={-1}` et `data-dialog-title` pour etre focusable programmatiquement.
`defaultOnOpenAutoFocus` cible `[data-dialog-title]` si aucun `[data-autofocus]` n'est present.

### Tests associes

- Stories Storybook : `DialogShell.stories.tsx`, `ConfirmDialog.stories.tsx`, `AlertDialogShell.stories.tsx`
  (play functions verifiant `document.activeElement`).
- Test E2E : `tests/e2e/dialog-initial-focus.spec.ts` (`[US-A11Y001]`).

### Dialogues couverts

| Composant | Chemin | Focus cible |
|---|---|---|
| RuleWizardModal | `Core/DomainRule/RuleWizardModal.tsx` | Input label (custom `onOpenAutoFocus` existant) |
| SessionEditDialog | `Core/Session/SessionEditDialog.tsx` | Input nom session (custom `onOpenAutoFocus` existant) |
| SnapshotWizard | `UI/SessionWizards/SnapshotWizard.tsx` | Input nom session (custom `onOpenAutoFocus` existant) |
| RestoreWizard | `UI/SessionWizards/RestoreWizard.tsx` | Bouton Restaurer (`data-autofocus` steps 0 et 1) |
| WorkspaceFormDialog | `UI/Workspace/WorkspaceFormDialog.tsx` | Input nom workspace (`data-autofocus`, migre vers DialogShell) |
| ConfirmDialog | `UI/ConfirmDialog/ConfirmDialog.tsx` | Bouton Annuler (`data-autofocus` + `focusAutoFocusTarget`) |
| AlertDialogShell | `Core/TabTree/AlertDialogShell.tsx` | Bouton Annuler (`data-autofocus` + `focusAutoFocusTarget`) |
| WorkspaceDeleteConfirmDialog | `UI/Workspace/WorkspaceDeleteConfirmDialog.tsx` | Input saisie nom (`data-autofocus` + `focusAutoFocusTarget`) |
| SessionEditDialog sub-AlertDialog | `Core/Session/SessionEditDialog.tsx` | Bouton Annuler (`data-autofocus` + `focusAutoFocusTarget`) |
| ConfigEditModal | `Core/DomainRule/ConfigEditModal.tsx` | Titre (fallback DialogShell) |
| ExportWorkspaceDialog | `UI/Workspace/ExportWorkspaceDialog.tsx` | Titre (fallback DialogShell) |
| ImportWorkspaceDialog | `UI/Workspace/ImportWorkspaceDialog.tsx` | Titre (fallback DialogShell) |
| ImportSessionsWizard / ExportSessionsWizard | `UI/ImportExportWizards/` | Titre (fallback DialogShell) |
| ShortcutsDrawer | `UI/ShortcutsPanel/ShortcutsDrawer.tsx` | Premier trigger (custom, harmonise avec `e.currentTarget`) |
