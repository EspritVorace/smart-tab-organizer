# US-S-NOTE — Notes de session

## Contexte

Les sessions permettent de sauvegarder un état d'onglets pour une restauration ultérieure.
Cependant, l'utilisateur ne dispose d'aucun moyen d'annoter une session pour expliquer son
contexte : pourquoi elle a été créée, ce sur quoi elle porte, ce qu'il reste à faire, etc.

Ajouter un champ **note libre** (texte multiligne) à chaque session permet de contextualiser
les sessions et de les retrouver plus facilement par leur contenu textuel.

---

## User Stories

### US-S-NOTE-01 — Ajouter une note lors de la création d'un snapshot

**En tant qu'** utilisateur qui prend un snapshot de ses onglets,
**je veux** pouvoir rédiger une note optionnelle avant de sauvegarder la session,
**afin de** documenter immédiatement le contexte de cette capture.

**Critères d'acceptance :**
- Le wizard de snapshot expose un champ `TextArea` (Radix, redimensionnable verticalement)
  labellisé **« Note »**, sous la sélection des onglets.
- Le champ est optionnel : laisser le champ vide ne bloque pas la sauvegarde.
- La note saisie est persistée dans la session créée.
- À l'ouverture du wizard, le champ est vide.

---

### US-S-NOTE-02 — Modifier la note via le dialog d'édition

**En tant qu'** utilisateur qui édite une session existante,
**je veux** pouvoir lire, modifier ou supprimer la note associée,
**afin de** maintenir une annotation à jour au fil du temps.

**Critères d'acceptance :**
- Le dialog d'édition de session expose un `TextArea` (Radix, redimensionnable verticalement)
  labellisé **« Note »**, sous l'éditeur d'onglets.
- La valeur initiale du champ est la note existante (vide si aucune note).
- Toute modification de la note rend le dialog **dirty** (le dialog de confirmation
  « modifications non enregistrées » apparaît si l'utilisateur tente de fermer sans sauvegarder).
- La note modifiée est persistée après clic sur **Enregistrer**.
- Vider complètement le champ efface la note de la session.

---

### US-S-NOTE-03 — Affichage de la note dans la carte de session dépliée

**En tant qu'** utilisateur consultant la liste des sessions,
**je veux** voir la note d'une session lorsque je déplie sa carte,
**afin de** comprendre rapidement le contexte de la session sans l'ouvrir.

**Critères d'acceptance :**
- La note s'affiche **sous le prévisuel des onglets** dans la section dépliable de la carte.
- Elle n'est visible que lorsque la carte est dépliée.
- Si la session n'a pas de note, aucune zone de note n'est affichée.
- Les retours à la ligne de la note sont respectés à l'affichage (`white-space: pre-wrap`).

---

### US-S-NOTE-04 — La recherche trouve du texte dans la note

**En tant qu'** utilisateur effectuant une recherche dans les sessions,
**je veux** que la barre de recherche trouve aussi les sessions dont la note contient
le terme recherché,
**afin de** retrouver une session grâce à une annotation que j'y avais laissée.

**Critères d'acceptance :**
- Saisir un terme contenu dans la note d'une session fait apparaître cette session
  dans la liste filtrée.
- La section dépliable (preview) de la session est **automatiquement ouverte**
  (même comportement que lorsqu'un onglet correspond).
- La recherche est insensible à la casse et aux accents.
- Si seule la note correspond (ni nom ni onglets), la carte s'ouvre quand même.

---

### US-S-NOTE-05 — Surlignage du texte correspondant dans la note

**En tant qu'** utilisateur effectuant une recherche,
**je veux** que la partie de la note correspondant au terme de recherche soit
visuellement mise en évidence,
**afin de** repérer instantanément pourquoi la session apparaît dans les résultats.

**Critères d'acceptance :**
- Le terme recherché est **surligné** (fond jaune, texte en gras) dans le texte de la note
  affiché dans la carte dépliée.
- Le surlignage utilise le composant `AccessibleHighlight` (marqueurs `sr-only` inclus).
- En l'absence de terme de recherche, aucun surlignage n'est affiché.
- Le surlignage est insensible à la casse et aux accents (cohérent avec le filtrage).

---

## Règles de gestion

| Condition | Preview de la session | Note |
|---|---|---|
| Correspondance sur la note uniquement | **Ouverte automatiquement** | Note visible avec surlignage |
| Correspondance sur nom + note | **Ouverte automatiquement** | Note visible avec surlignage |
| Correspondance sur onglets + note | **Ouverte automatiquement** | Note visible avec surlignage |
| Correspondance sur nom uniquement | Fermée | N/A |
| Aucune correspondance | Session masquée | N/A |

---

## Champ de recherche (étendu)

La recherche porte désormais sur les champs suivants :

1. `session.name` — Nom de la session
2. `group.title` — Titre de chaque groupe
3. `tab.title` — Titre de chaque onglet
4. `tab.url` — URL de chaque onglet
5. `session.note` — **Note de session** *(nouveau)*

---

## Hors périmètre

- Formatage riche (markdown, HTML) dans la note.
- Historique des modifications de la note.
- Note sur les groupes ou les onglets individuels.
