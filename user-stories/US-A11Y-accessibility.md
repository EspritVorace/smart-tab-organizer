# User Stories — Domaine A11Y : Etat désactivé des contrôles focusables

---

## US-A11Y001 — Pattern `aria-disabled` sur les boutons focusables

**En tant qu'** utilisateur naviguant au clavier ou utilisant un lecteur d'ecran,
**je veux** que les boutons désactivés restent accessibles via la touche Tab,
**afin de** découvrir leur existence et comprendre pourquoi je ne peux pas les activer.

### Contexte

L'attribut HTML `disabled` retire l'élément de l'ordre de tabulation et empêche
tout événement de focus ou de hover. Un bouton `disabled` est invisible pour un
utilisateur de technologies d'assistance : il n'est pas annoncé, sa raison d'etre
désactivé n'est pas découvrable, et l'utilisateur ne sait pas comment le débloquer.

### Critères d'acceptance

- Les boutons utilisant `aria-disabled="true"` restent dans l'ordre de tabulation (Tab).
- Le lecteur d'ecran annonce l'état `disabled` via `aria-disabled`.
- Un clic ou un appui sur Entrée/Espace sur un bouton `aria-disabled` ne déclenche aucune action.
- La valeur CSS `cursor: not-allowed` et `opacity: 0.5` signale visuellement l'état désactivé.

### Composants concernés

- `src/components/UI/AriaButton/AriaButton.tsx` : wrapper Radix Button.
- `src/components/UI/PopupToolbar/PopupToolbar.tsx` : boutons Save, Restore, Organize.
- `src/components/UI/SplitButton/SplitButton.tsx` : bouton primaire et chevron.

---

## US-A11Y002 — Surfaçage de la raison d'un état désactivé

**En tant qu'** utilisateur naviguant au clavier ou utilisant un lecteur d'ecran,
**je veux** voir ou entendre pourquoi un bouton est désactivé lorsque j'y place le focus,
**afin de** savoir quelle action effectuer pour le débloquer.

### Critères d'acceptance

- Un Tooltip Radix s'affiche au survol souris ET au focus clavier sur un bouton `aria-disabled`.
- Le contenu du Tooltip est fourni via la prop `disabledReason` (composants Radix) ou
  via un wrapping conditionnel `<Tooltip>` (boutons natifs).
- Le Tooltip ne s'affiche pas quand le bouton est désactivé pour un état transitoire
  de chargement (ex. `isRestoring`, `isAnalyzing`).

### Exemples de messages

| Bouton | Message |
|---|---|
| Popup Save (pas de groupe actif) | `popupSaveDisabledHint` |
| Popup Restore (pas de sessions) | `popupRestoreDisabledHint` |
| Wizard Restore (aucun onglet sélectionné) | `wizardRestoreNoTabsHint` |

---

## US-A11Y003 — Compatibilité avec le mode contraste élevé

**En tant qu'** utilisateur en mode Windows High Contrast ou forced-colors,
**je veux** que les boutons `aria-disabled` restent visuellement distinguables,
**afin de** ne pas les confondre avec des boutons actifs.

### Critères d'acceptance

- La règle CSS `@media (forced-colors: active)` applique `border-color: GrayText`
  et `color: GrayText` sur `[aria-disabled="true"]`.
- Les contrôles désactivés sont visuellement distincts des contrôles actifs en mode
  contraste élevé Windows.
