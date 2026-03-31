# US-S-SEARCH-01 — Recherche dans les titres et URLs des onglets d'une session

## Contexte

La barre de recherche de la section Sessions filtre actuellement uniquement sur le
**nom** de la session. L'utilisateur ne peut pas retrouver une session contenant
un onglet spécifique s'il ne se souvient pas du nom qu'il a donné à la session.

---

## User Stories

### US-S-SEARCH-01 — Recherche par titre d'onglet

**En tant qu'** utilisateur ayant de nombreuses sessions sauvegardées,
**je veux** que la barre de recherche trouve aussi des sessions dont un onglet a
un titre correspondant au terme recherché,
**afin de** retrouver rapidement une session grâce au titre de l'un de ses onglets.

**Critères d'acceptance :**
- Saisir un terme correspondant au titre d'un onglet (groupé ou non) fait apparaître
  la session dans la liste filtrée.
- La section dépliable (preview) de la session est **automatiquement ouverte**.
- Les groupes d'onglets contenant l'onglet correspondant sont **dépliés**.
- Les groupes sans correspondance restent **repliés**.
- La recherche est insensible à la casse et aux accents.
- Les parties du titre d'onglet correspondant au terme de recherche sont
  **surlignées** (composant `AccessibleHighlight`) dans la preview ouverte.

---

### US-S-SEARCH-02 — Recherche par URL d'onglet

**En tant qu'** utilisateur,
**je veux** que la barre de recherche trouve des sessions dont un onglet a une URL
contenant le terme recherché,
**afin de** retrouver une session contenant un domaine ou une URL particulière.

**Critères d'acceptance :**
- Saisir un terme correspondant à l'URL d'un onglet (groupé ou non) fait apparaître
  la session dans la liste filtrée.
- La section dépliable (preview) de la session est **automatiquement ouverte**.
- Les groupes d'onglets contenant l'onglet correspondant sont **dépliés**.
- La recherche est insensible à la casse et aux accents.
- La partie du domaine affiché (extrait de l'URL) correspondant au terme de recherche
  est **surlignée** dans la preview ouverte.

---

### US-S-SEARCH-03 — Recherche par titre de groupe d'onglets

**En tant qu'** utilisateur,
**je veux** que la barre de recherche trouve des sessions dont un groupe d'onglets
porte un titre correspondant au terme recherché,
**afin de** retrouver une session à partir du nom d'un de ses groupes.

**Critères d'acceptance :**
- Saisir un terme correspondant au titre d'un groupe fait apparaître la session
  dans la liste filtrée.
- La section dépliable (preview) de la session est **automatiquement ouverte**.
- Le(s) groupe(s) dont le titre correspond sont **dépliés**.
- La recherche est insensible à la casse et aux accents.
- La partie du titre de groupe correspondant au terme de recherche est
  **surlignée** dans la preview ouverte.

---

### US-S-SEARCH-06 — Surlignage du nom de session et des onglets correspondants

**En tant qu'** utilisateur effectuant une recherche dans les sessions,
**je veux** que les parties du texte correspondant au terme recherché soient
visuellement mises en évidence dans les cartes de session,
**afin de** comprendre immédiatement pourquoi un résultat apparaît.

**Critères d'acceptance :**
- Le terme recherché est **surligné** (fond jaune, texte en gras) dans les champs
  suivants lorsqu'ils correspondent :
  - Nom de la session (toujours visible sur la carte)
  - Titre du groupe (dans la preview ouverte)
  - Titre de l'onglet (dans la preview ouverte)
  - Domaine extrait de l'URL de l'onglet (dans la preview ouverte)
- Le surlignage utilise le composant `AccessibleHighlight` (inclut des marqueurs
  accessibles `sr-only` pour les lecteurs d'écran).
- En l'absence de terme de recherche, aucun surlignage n'est affiché.
- Le surlignage est insensible à la casse et aux accents (cohérent avec le filtrage).

---

### US-S-SEARCH-04 — Correspondance sur le nom de session uniquement

**En tant qu'** utilisateur,
**je veux** que lorsque la recherche correspond uniquement au **nom** de la session
(sans correspondance dans les onglets ni les groupes), la section dépliable reste
**refermée**,
**afin de** garder une vue compacte quand seul le nom suffit à identifier la session.

**Critères d'acceptance :**
- Si le terme correspond au nom de la session mais pas à un titre/URL d'onglet ou
  titre de groupe, la session est affichée avec sa section dépliable **fermée**.
- L'utilisateur peut toujours ouvrir manuellement la section dépliable.

---

### US-S-SEARCH-05 — Ouverture forcée non bloquante

**En tant qu'** utilisateur,
**je veux** pouvoir refermer manuellement la section dépliable d'une session dont
la preview a été ouverte automatiquement par la recherche,
**afin de** garder le contrôle de l'affichage même lors d'une recherche active.

**Critères d'acceptance :**
- Lorsque la preview est ouverte automatiquement (correspondance onglet/groupe),
  l'utilisateur peut cliquer sur le déclencheur pour la refermer.
- Effacer la recherche remet les cartes dans leur état initial (preview fermée,
  sauf si l'utilisateur l'a ouverte manuellement avant de rechercher).

---

## Règles de gestion

| Condition | Preview de la session | Groupes |
|---|---|---|
| Correspondance sur nom uniquement | Fermée (comportement existant) | N/A |
| Correspondance sur onglet non groupé | **Ouverte automatiquement** | N/A |
| Correspondance sur titre de groupe | **Ouverte automatiquement** | Groupes correspondants **dépliés** |
| Correspondance sur onglet dans un groupe | **Ouverte automatiquement** | Groupe parent **déplié** |
| Correspondance sur nom ET onglets/groupes | **Ouverte automatiquement** | Groupes correspondants **dépliés** |
| Aucune correspondance | Session masquée | N/A |

---

## Champ de recherche

La recherche porte sur les champs suivants, pour chaque session :

1. `session.name` — Nom de la session
2. `group.title` — Titre de chaque groupe
3. `tab.title` — Titre de chaque onglet (groupés et non groupés)
4. `tab.url` — URL de chaque onglet (groupés et non groupés)

La comparaison est toujours insensible à la casse et aux accents (via `foldAccents()`).

---

## Hors périmètre

- Recherche dans les descriptions ou métadonnées futures des sessions.
