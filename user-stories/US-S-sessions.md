# User Stories — Domaine S : Sessions (compléments)

> Comportements testés dans `tests/e2e/sessions.spec.ts` non couverts par les US-S001→S008 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-S009.

---

## US-S009 — Visibilité différenciée du toggle auto-sync selon le type de carte

**En tant qu'** utilisateur,
**je veux** que le toggle auto-sync soit visible uniquement sur les cartes de profil (épinglées),
**afin de** distinguer clairement les fonctionnalités disponibles selon le type de session.

### Critères d'acceptation

- [ ] Une carte de **profil** (session épinglée) affiche un toggle switch labellisé « Auto-sync ».
- [ ] Une carte de **snapshot** (session non épinglée) n'affiche **pas** de toggle auto-sync.

---

## US-S010 — Barre d'outils et champ de recherche

**En tant qu'** utilisateur sur la page Sessions,
**je veux** disposer d'un champ de recherche et des boutons d'action dans une barre d'outils en haut de la liste,
**afin de** filtrer rapidement mes sessions et de lancer une action sans chercher les contrôles.

### Critères d'acceptation

- [ ] Un champ de recherche (icône loupe) est affiché en haut de la page Sessions, à gauche de la barre d'outils.
- [ ] Saisir du texte dans ce champ filtre la liste des sessions en temps réel par correspondance sur le nom (insensible à la casse).
- [ ] Les boutons « New Profile » et « Take Snapshot » sont affichés à droite du champ de recherche dans la même barre d'outils.
- [ ] En l'absence de toute session, la zone d'état vide affiche le message « No saved sessions. ».
- [ ] Les boutons « Take Snapshot » et « New Profile » sont également visibles dans la zone d'état vide.

---

## US-S011 — Options du bouton de restauration (split button)

**En tant qu'** utilisateur,
**je veux** pouvoir restaurer une session selon différentes modalités depuis la carte de session,
**afin de** choisir rapidement où les onglets sont ouverts sans passer par le wizard complet.

### Critères d'acceptation

- [ ] Chaque carte de session affiche un bouton principal « Restore » visible.
- [ ] Un chevron de liste déroulante (« Restore options ») est accessible sur chaque carte.
- [ ] La liste déroulante propose au minimum les options : « In current window », « In new window », « Customize… ».
- [ ] L'option « In current window » restaure les onglets et affiche un message de confirmation de succès (ex. « X tab(s) opened »).
- [ ] L'option « Customize… » ouvre le wizard de restauration (dialogue de type `role="dialog"` contenant un texte « Restore »).

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
