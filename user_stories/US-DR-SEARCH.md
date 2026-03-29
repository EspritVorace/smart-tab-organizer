# US-DR-SEARCH — Recherche et surlignage dans les règles de domaine

## Contexte

La barre de recherche de la section Règles de domaine filtre les règles selon le
**label** et le **filtre de domaine**. L'utilisateur ne sait pas toujours pourquoi
une règle apparaît dans les résultats lorsqu'il tape un terme.

---

## User Stories

### US-DR-SEARCH-01 — Filtrage par label

**En tant qu'** utilisateur gérant de nombreuses règles de domaine,
**je veux** que la barre de recherche filtre les règles dont le **label** contient
le terme recherché,
**afin de** retrouver rapidement une règle par son nom.

**Critères d'acceptance :**
- Saisir un terme correspondant au label d'une règle fait apparaître cette règle
  dans la liste filtrée.
- Les règles dont le label ne correspond pas sont masquées.
- La recherche est insensible à la casse et aux accents.
- La partie du label correspondant au terme est **surlignée** (composant
  `AccessibleHighlight`) dans le badge affiché sur la carte.
- Le label est également surligné dans l'en-tête du HoverCard de détail.

---

### US-DR-SEARCH-02 — Filtrage par filtre de domaine

**En tant qu'** utilisateur,
**je veux** que la barre de recherche trouve des règles dont le **filtre de domaine**
contient le terme recherché,
**afin de** retrouver une règle à partir d'un domaine ou pattern connu.

**Critères d'acceptance :**
- Saisir un terme correspondant au filtre de domaine d'une règle fait apparaître
  cette règle dans la liste filtrée.
- Les règles dont le filtre de domaine ne correspond pas sont masquées.
- La recherche est insensible à la casse et aux accents.
- La partie du filtre de domaine correspondant au terme est **surlignée** dans le
  texte du filtre affiché sur la carte.
- Le filtre de domaine est également surligné dans le HoverCard de détail (champ
  « Domain filter »).

---

### US-DR-SEARCH-03 — Surlignage des correspondances

**En tant qu'** utilisateur effectuant une recherche dans les règles de domaine,
**je veux** que les parties du texte correspondant au terme recherché soient
visuellement mises en évidence,
**afin de** comprendre immédiatement pourquoi un résultat apparaît.

**Critères d'acceptance :**
- Le terme recherché est **surligné** (fond jaune, texte en gras) dans les champs
  suivants lorsqu'ils correspondent :
  - Label de la règle (badge sur la carte et en-tête du HoverCard)
  - Filtre de domaine (texte sur la carte et champ du HoverCard)
- Le surlignage utilise le composant `AccessibleHighlight` (inclut des marqueurs
  accessibles `sr-only` pour les lecteurs d'écran).
- En l'absence de terme de recherche, aucun surlignage n'est affiché.
- Le surlignage est insensible à la casse et aux accents (cohérent avec le filtrage).

---

## Règles de gestion

| Champ de recherche | Filtrage | Surlignage sur la carte | Surlignage dans le HoverCard |
|---|---|---|---|
| `rule.label` | Oui | Badge (label) | En-tête (label) |
| `rule.domainFilter` | Oui | Texte du filtre | Champ « Domain filter » |

---

## Champ de recherche

La recherche porte sur les champs suivants pour chaque règle :

1. `rule.label` — Nom/label de la règle
2. `rule.domainFilter` — Filtre de domaine (ex. `*.github.com`)

La comparaison est toujours insensible à la casse et aux accents (via `foldAccents()`).

---

## Hors périmètre

- Recherche dans les autres champs (regex de titre, regex d'URL, preset ID…).
- Surlignage dans les champs hors recherche du HoverCard (regex, déduplication…).
