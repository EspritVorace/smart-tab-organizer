# User Stories — Domaine S : Sessions (compléments)

> Comportements testés dans `tests/e2e/sessions.spec.ts` non couverts par les US-S001→S008 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-S009.

---

## US-S010 — Barre d'outils et champ de recherche

**En tant qu'** utilisateur sur la page Sessions,
**je veux** disposer d'un champ de recherche et des boutons d'action dans une barre d'outils en haut de la liste,
**afin de** filtrer rapidement mes sessions et de lancer une action sans chercher les contrôles.

### Critères d'acceptation

- [ ] Un champ de recherche (icône loupe) est affiché en haut de la page Sessions, à gauche de la barre d'outils.
- [ ] Saisir du texte dans ce champ filtre la liste des sessions en temps réel par correspondance sur le nom (insensible à la casse).
- [ ] Le bouton « Take Snapshot » est affiché à droite du champ de recherche dans la même barre d'outils.
- [ ] En l'absence de toute session, la zone d'état vide affiche le message « No saved sessions. ».
- [ ] Le bouton « Take Snapshot » est également visible dans la zone d'état vide.

---

## US-S011 — Options de restauration dans le menu d'actions

**En tant qu'** utilisateur,
**je veux** pouvoir restaurer une session selon différentes modalités depuis la carte de session,
**afin de** choisir rapidement où les onglets sont ouverts sans passer par le wizard complet.

### Critères d'acceptation

- [ ] Chaque carte de session affiche un bouton « More actions » (icône ···) donnant accès à un menu déroulant.
- [ ] Ce menu propose au minimum les options de restauration : « Restore in current window », « Restore in new window », « Customized restoration… ».
- [ ] L'option « Restore in current window » restaure les onglets et affiche un message de confirmation de succès (ex. « X tab(s) opened »).
- [ ] L'option « Customized restoration… » ouvre le wizard de restauration (dialogue de type `role="dialog"` contenant un texte « Restore »).

> **Note de design (v1.1+) :** Le split button dédié a été remplacé par le menu « More actions » pour réduire l'encombrement visuel. Les métadonnées de session (dates, note) sont accessibles via un HoverCard sur le nom de la session.

---

## US-S012 — Analyse des conflits avant restauration dans la fenêtre courante

**En tant qu'** utilisateur,
**je veux** que l'extension détecte automatiquement les conflits entre la session à restaurer et les onglets/groupes déjà ouverts,
**afin de** me proposer des options de résolution avant d'ouvrir quoi que ce soit.

### Critères d'acceptation

- [ ] Lorsque la destination choisie est « Fenêtre courante », l'extension analyse les onglets et groupes actuellement ouverts avant d'afficher l'étape de résolution.
- [ ] Un **onglet en doublon** est détecté par correspondance exacte d'URL avec un onglet déjà ouvert dans la fenêtre.
- [ ] Un **groupe en conflit** est détecté lorsqu'un groupe existant dans la fenêtre a exactement le même titre (insensible à la casse) **et** la même couleur qu'un groupe à restaurer.
- [ ] Si aucun conflit n'est détecté, l'étape de résolution est sautée : le wizard passe directement à la confirmation (2 étapes au lieu de 3).
- [ ] Si au moins un conflit est détecté, une étape de résolution intermédiaire est insérée (3 étapes au total).
- [ ] Choisir « Nouvelle fenêtre » comme destination ignore l'analyse de conflits et passe directement à la confirmation.

---

## US-S013 — Résolution globale des onglets en double

**En tant qu'** utilisateur,
**je veux** choisir une action globale pour tous les onglets déjà ouverts détectés comme doublons,
**afin de** contrôler si ces onglets sont ré-ouverts ou ignorés lors de la restauration.

### Critères d'acceptation

- [ ] L'étape de résolution affiche la liste des onglets en doublon (titre + URL) avec une icône d'avertissement et un badge « Already Open ».
- [ ] Deux options globales sont proposées (boutons radio) :
  - **Ne pas restaurer les doublons** (par défaut) : les onglets déjà ouverts ne sont pas recréés.
  - **Ouvrir quand même** : les onglets en double sont ouverts en plus des onglets existants.
- [ ] La même option s'applique à **tous** les onglets en doublon.

---

## US-S014 — Résolution par groupe des conflits de groupes

**En tant qu'** utilisateur,
**je veux** choisir indépendamment pour chaque groupe en conflit comment le traiter,
**afin d'** appliquer la stratégie la plus adaptée groupe par groupe.

### Critères d'acceptation

- [ ] Chaque groupe en conflit est affiché avec sa couleur, son titre et le nombre d'onglets qu'il contient.
- [ ] Trois actions sont disponibles pour chaque groupe (menu déroulant) :
  - **Fusionner** (par défaut) : les onglets à restaurer sont ajoutés au groupe existant ; les onglets déjà présents dans ce groupe ne sont pas dupliqués.
  - **Créer un nouveau groupe** : un nouveau groupe distinct est créé, indépendamment du groupe existant.
  - **Ignorer** : le groupe et ses onglets ne sont pas restaurés.
- [ ] La décision prise pour un groupe n'affecte pas les autres groupes.

---

## US-S015 — Confirmation, exécution et métriques de restauration

**En tant qu'** utilisateur,
**je veux** voir un récapitulatif de ce qui va être restauré avant de valider, puis un bilan chiffré après l'opération,
**afin de** confirmer la restauration en connaissance de cause et vérifier le résultat.

### Critères d'acceptation

- [ ] L'étape de confirmation indique la destination (fenêtre courante ou nouvelle fenêtre) et le nombre d'onglets qui seront ouverts.
- [ ] Si des doublons sont ignorés, le nombre d'onglets ignorés est indiqué dans l'étape de confirmation.
- [ ] Après la restauration, le dialogue se ferme automatiquement.
- [ ] Une notification système apparaît avec le titre « Session restored » et un message indiquant le nombre d'onglets ouverts et de doublons ignorés (ex. « 5 tab(s) opened, 2 duplicate(s) skipped »).
- [ ] Si des erreurs surviennent lors de la restauration, une notification d'erreur est affichée à la place.

---

## US-S016 : Capture de l'etat replie/deplie des groupes d'onglets

**En tant qu'** utilisateur qui prend un snapshot de ses onglets,
**je veux** que l'etat replie ou deplie de chaque groupe d'onglets Chrome soit enregistre automatiquement,
**afin que** le snapshot reflète fidelement l'agencement de ma fenetre au moment de la sauvegarde.

### Criteres d'acceptation

- [ ] Lorsqu'un groupe Chrome est replie au moment du snapshot, la session enregistree contient `collapsed: true` pour ce groupe.
- [ ] Lorsqu'un groupe Chrome est deplie au moment du snapshot, la session enregistree contient `collapsed: false` pour ce groupe.
- [ ] Les sessions existantes sans champ `collapsed` continuent de fonctionner normalement (retro-compatibilite) : elles sont traitees comme si tous les groupes etaient deplies.

---

## US-S017 : Restauration de l'etat replie/deplie des groupes d'onglets

**En tant qu'** utilisateur qui restaure une session,
**je veux** que les groupes d'onglets soient recrees avec leur etat replie ou deplie d'origine,
**afin de** retrouver exactement l'agencement que j'avais sauvegarde.

### Criteres d'acceptation

- [ ] Lors de la restauration dans une nouvelle fenetre, un groupe marque `collapsed: true` est cree replie dans Chrome.
- [ ] Lors de la restauration dans la fenetre courante (creation d'un nouveau groupe), le groupe respecte l'etat `collapsed` sauvegarde.
- [ ] Lors d'une fusion (merge) dans un groupe existant, l'etat replie/deplie du groupe existant n'est pas modifie.
- [ ] Les sessions sans champ `collapsed` restaurent les groupes en etat deplie (comportement par defaut).

---

## US-S018 : Edition de l'etat replie/deplie dans l'editeur de session

**En tant qu'** utilisateur qui edite une session,
**je veux** que l'editeur affiche les groupes selon leur etat replie/deplie sauvegarde et que les modifications de cet etat soient persistees a la sauvegarde,
**afin de** pouvoir ajuster l'agencement des groupes avant une restauration.

### Criteres d'acceptation

- [ ] A l'ouverture de l'editeur, un groupe avec `collapsed: true` est affiche replie (ses onglets enfants ne sont pas visibles).
- [ ] A l'ouverture de l'editeur, un groupe sans champ `collapsed` ou avec `collapsed: false` est affiche deplie (ses onglets enfants sont visibles).
- [ ] Replier ou deplier un groupe dans l'editeur est considere comme une modification (le bouton « Save » devient activable).
- [ ] Apres sauvegarde, la valeur `collapsed` de chaque groupe est mise a jour dans le stockage.
