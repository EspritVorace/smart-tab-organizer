# US-S-DND : Reordering des sessions par drag-and-drop

## Contexte

La liste des sessions est affichee dans un ordre fixe.
L'utilisateur ne peut pas reorganiser ses sessions pour mettre les plus
utilisees en tete, ce qui oblige a faire defiler la liste.

Ajouter un champ `position` aux sessions et un systeme de drag-and-drop
permet de personnaliser l'ordre d'affichage.

---

## User Stories

### US-S-DND-01 : Reordonner les sessions par glisser-deposer

**En tant qu'** utilisateur sur la page Sessions,
**je veux** pouvoir deplacer une session dans la liste par drag-and-drop,
**afin de** choisir l'ordre d'affichage selon mes preferences.

**Criteres d'acceptance :**
- Chaque carte de session affiche un handle de drag (icone `GripVertical`)
  sur le bord gauche.
- Le curseur passe en `grab` au survol du handle, puis `grabbing` pendant
  le drag.
- Pendant le drag, la carte deplacee est visuellement attenuee
  (opacite reduite).
- Au relachement, la carte prend sa nouvelle position et la liste se
  reorganise immediatement (reordering optimiste).
- L'ordre resultant est persiste dans `browser.storage.local` via le
  champ `position` de chaque session.
- La persistance utilise une operation batch unique pour eviter les
  race conditions.

---

### US-S-DND-02 : Deplacer une session en premiere position

**En tant qu'** utilisateur,
**je veux** pouvoir envoyer une session en premiere position via le menu
d'actions,
**afin de** la placer rapidement en tete de liste sans drag long.

**Criteres d'acceptance :**
- Le menu d'actions (icone `...`) de chaque carte propose l'option
  "Move to first".
- Au clic, la session se deplace en premiere position dans la liste.
- L'option est desactivee si la session est deja en premiere position.
- L'option est desactivee pendant un drag en cours.

---

### US-S-DND-03 : Deplacer une session en derniere position

**En tant qu'** utilisateur,
**je veux** pouvoir envoyer une session en derniere position via le menu
d'actions,
**afin de** la releguer en fin de liste rapidement.

**Criteres d'acceptance :**
- Le menu d'actions de chaque carte propose l'option "Move to last".
- Au clic, la session se deplace en derniere position dans la liste.
- L'option est desactivee si la session est deja en derniere position.
- L'option est desactivee pendant un drag en cours.

---

## Implementation technique

| Aspect | Detail |
|---|---|
| Librairie DnD | `@dnd-kit/react` (API v2 : `useSortable`) |
| Champ de tri | `session.position` (`z.number().optional()`) |
| Utilitaire de reordering | `src/utils/sessionOrderUtils.ts` : `moveSessionToFirst`, `moveSessionToLast` |
| Persistance | `src/utils/sessionStorage.ts` : operation batch pour reassigner les positions |
| Reordering optimiste | La liste React est mise a jour avant la fin de la persistance |

---

## Hors perimetre

- Reordering entre categories de sessions (pas de categories pour les sessions).
- Reordering des onglets dans une session (couvert par l'editeur de session).
- Reordering via raccourci clavier (clavier non couvert par `@dnd-kit` dans cette version).
