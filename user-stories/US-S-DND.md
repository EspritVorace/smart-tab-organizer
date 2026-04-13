# US-S-DND : Reordering des sessions par drag-and-drop

## Contexte

La liste des sessions est affichee dans un ordre fixe.
L'utilisateur ne peut pas reorganiser ses sessions pour mettre les plus
utilisees en tete, ce qui oblige a faire defiler la liste.

Ajouter un champ `position` aux sessions et un systeme de drag-and-drop
permet de personnaliser l'ordre d'affichage.

> **Note (v1.x) :** Depuis US-S020, les sessions sont separees en deux
> sections (epinglees / normales). Le drag-and-drop et les actions
> "Move to first"/"Move to last" operent a l'interieur du groupe de la
> session (epingle ou normal), pas sur la liste globale.

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
- Le drag-and-drop fonctionne uniquement a l'interieur de la section de
  la session (epinglees ou normales). Chaque section dispose de son propre
  `DragDropProvider` independant (cf. US-S020).
- L'ordre resultant est persiste dans `browser.storage.local` via le
  champ `position` de chaque session.
- La persistance utilise une operation batch unique pour eviter les
  race conditions.

---

### US-S-DND-02 : Deplacer une session en premiere position dans son groupe

**En tant qu'** utilisateur,
**je veux** pouvoir envoyer une session en premiere position de son groupe
(epingle ou normal) via le menu d'actions,
**afin de** la placer rapidement en tete de sa section sans drag long.

**Criteres d'acceptance :**
- Le menu d'actions (icone `...`) de chaque carte propose l'option
  "Move to first".
- Au clic, la session se deplace en premiere position de son groupe
  (sessions epinglees ou sessions normales, cf. US-S020).
- L'option est desactivee si la session est deja en premiere position
  de son groupe.
- L'option est desactivee pendant un drag en cours.

---

### US-S-DND-03 : Deplacer une session en derniere position dans son groupe

**En tant qu'** utilisateur,
**je veux** pouvoir envoyer une session en derniere position de son groupe
(epingle ou normal) via le menu d'actions,
**afin de** la releguer en fin de sa section rapidement.

**Criteres d'acceptance :**
- Le menu d'actions de chaque carte propose l'option "Move to last".
- Au clic, la session se deplace en derniere position de son groupe
  (sessions epinglees ou sessions normales, cf. US-S020).
- L'option est desactivee si la session est deja en derniere position
  de son groupe.
- L'option est desactivee pendant un drag en cours.

---

## Implementation technique

| Aspect | Detail |
|---|---|
| Librairie DnD | `@dnd-kit/react` (API v2 : `useSortable`) |
| Champ de tri | `session.position` (`z.number().optional()`) |
| Utilitaire de reordering | `src/utils/sessionOrderUtils.ts` : `moveSessionToFirst`, `moveSessionToLast`, `moveSessionToFirstInGroup`, `moveSessionToLastInGroup` |
| Persistance | `src/utils/sessionStorage.ts` : operation batch pour reassigner les positions |
| Reordering optimiste | La liste React est mise a jour avant la fin de la persistance |

---

## Hors perimetre

- Reordering entre sections epinglees/normales par drag-and-drop (le changement de statut se fait via le bouton pin/unpin).
- Reordering des onglets dans une session (couvert par l'editeur de session).
- Reordering via raccourci clavier (clavier non couvert par `@dnd-kit` dans cette version).
