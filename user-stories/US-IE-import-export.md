# User Stories — Domaine IE : Import / Export de règles de domaine

> Comportements identifiés dans `src/components/UI/ImportExportPage/`,
> `src/utils/importClassification.ts` et `src/components/UI/WizardStepper/`
> non couverts par les US existantes.

---

## US-IE001 — Sélection de la source JSON (fichier ou texte)

**En tant qu'** utilisateur,
**je veux** pouvoir fournir le JSON à importer soit en glissant-déposant un fichier `.json`, soit en le collant directement dans un champ texte,
**afin de** choisir librement la méthode la plus commode selon mon environnement.

### Critères d'acceptation

- [ ] Le wizard d'import propose deux modes de saisie sélectionnables : **Fichier** et **Texte**.
- [ ] En mode **Fichier** : une zone de dépôt accepte le glisser-déposer ; un bouton « Browse » ouvre le sélecteur de fichier natif (filtre `.json`).
- [ ] La zone de dépôt change visuellement d'état (bordure en surbrillance) pendant qu'un fichier est survolé.
- [ ] En mode **Texte** : un champ multi-lignes (police monospace) permet de coller ou saisir du JSON brut.
- [ ] Passer d'un mode à l'autre conserve les données déjà saisies dans chaque mode.
- [ ] Le bouton « Suivant » reste désactivé tant qu'aucun JSON valide n'a été chargé.

---

## US-IE002 — Validation du JSON importé

**En tant qu'** utilisateur,
**je veux** être informé immédiatement si le JSON fourni est invalide ou ne correspond pas au format attendu,
**afin de** corriger le fichier ou le texte avant de continuer.

### Critères d'acceptation

- [ ] Si le JSON est syntaxiquement invalide (ex. virgule manquante), un message d'erreur rouge est affiché avec le libellé « JSON invalide ».
- [ ] Si le JSON est syntaxiquement correct mais ne respecte pas le schéma attendu, les erreurs de validation sont listées par champ (ex. « label : requis »).
- [ ] Si le JSON est valide, un indicateur de succès vert confirme le chargement et indique le nombre de règles détectées.
- [ ] Un champ texte vide n'affiche ni erreur ni succès : il remet l'état à zéro.
- [ ] La validation s'effectue en temps réel à chaque modification du champ texte.

---

## US-IE003 — Classification des règles importées

**En tant qu'** utilisateur,
**je veux** voir les règles du fichier importé classées en trois catégories avant de confirmer l'import,
**afin de** savoir exactement ce qui sera ajouté, modifié ou ignoré.

### Critères d'acceptation

- [ ] Les règles sont classées en trois groupes :
  - **Nouvelles** : aucune règle existante ne porte le même libellé (insensible à la casse).
  - **Conflictuelles** : une règle existante porte le même libellé mais avec des propriétés différentes.
  - **Identiques** : une règle existante porte le même libellé avec exactement les mêmes propriétés.
- [ ] Chaque groupe est accompagné d'un compteur (ex. « 3 nouvelles règles »).
- [ ] Les règles identiques sont affichées en grisé avec le badge « Already Exists » et ne sont **pas** sélectionnables.
- [ ] L'étape de sélection est présentée dans une zone défilante (hauteur maximale fixe).

---

## US-IE004 — Sélection individuelle des nouvelles règles

**En tant qu'** utilisateur,
**je veux** pouvoir choisir quelles nouvelles règles importer parmi celles proposées,
**afin de** n'ajouter que les règles qui m'intéressent.

### Critères d'acceptation

- [ ] Chaque nouvelle règle est accompagnée d'une case à cocher, cochée par défaut.
- [ ] Décocher une règle l'exclut de l'import sans la supprimer de l'affichage.
- [ ] Le compteur « Règles à importer » est mis à jour en temps réel selon les cases cochées.
- [ ] Le bouton « Suivant » est désactivé si le compteur atteint zéro (aucune règle sélectionnée).

---

## US-IE005 — Résolution globale des conflits

**En tant qu'** utilisateur,
**je veux** choisir comment les règles conflictuelles sont traitées (écraser, dupliquer ou ignorer),
**afin d'** appliquer une stratégie cohérente à l'ensemble des conflits en un seul choix.

### Critères d'acceptation

- [ ] Trois modes de résolution sont proposés (contrôle segmenté) :
  - **Overwrite** : la règle importée remplace la règle existante en conservant son identifiant.
  - **Duplicate** : la règle importée est créée comme nouvelle entrée avec un nouvel identifiant.
  - **Ignore** : les règles conflictuelles ne sont pas importées.
- [ ] Le mode sélectionné s'applique à **toutes** les règles conflictuelles.
- [ ] Le compteur « Règles à importer » tient compte du mode choisi (les règles ignorées ne sont pas comptées).
- [ ] En mode **Overwrite**, une alerte de mise en garde est affichée à l'étape de confirmation.

---

## US-IE006 — Visualisation des différences pour une règle conflictuelle

**En tant qu'** utilisateur,
**je veux** pouvoir inspecter les différences entre la règle existante et la règle importée pour chaque conflit,
**afin de** prendre une décision éclairée sur la stratégie de résolution.

### Critères d'acceptation

- [ ] Chaque règle conflictuelle affiche une icône d'avertissement (triangle orange).
- [ ] Un bouton « Voir les différences » (icône œil) est disponible sur chaque règle conflictuelle.
- [ ] Cliquer sur ce bouton ouvre un panneau contextuel (popover) listant les propriétés différentes.
- [ ] Pour chaque propriété différente, la valeur actuelle et la valeur importée sont affichées avec une mise en évidence distincte (ex. badge rouge « Valeur actuelle » / badge vert « Valeur importée »).

---

## US-IE007 — Confirmation et résultat de l'import

**En tant qu'** utilisateur,
**je veux** voir un récapitulatif avant de valider l'import, puis un retour chiffré une fois l'import effectué,
**afin de** confirmer l'opération en connaissance de cause et vérifier qu'elle s'est déroulée comme prévu.

### Critères d'acceptation

- [ ] L'étape de confirmation affiche un résumé : nombre de règles ajoutées, écrasées, dupliquées ou ignorées selon les choix de l'étape précédente.
- [ ] Si le mode **Overwrite** est sélectionné et qu'il y a des conflits, une alerte orange rappelle que des règles existantes seront remplacées.
- [ ] Après validation, le dialogue se ferme automatiquement.
- [ ] Une notification système apparaît avec le titre « Rules imported » et un message indiquant les compteurs (ex. « 3 rule(s) added, 1 rule(s) overwritten »).
- [ ] L'état du wizard est réinitialisé à chaque réouverture du dialogue.

---

## US-IE008 — Sélection des règles à exporter

**En tant qu'** utilisateur,
**je veux** choisir quelles règles inclure dans le fichier d'export,
**afin de** partager uniquement les règles pertinentes.

### Critères d'acceptation

- [ ] Toutes les règles sont présélectionnées par défaut à l'ouverture du wizard d'export.
- [ ] Chaque règle est accompagnée d'une case à cocher.
- [ ] Les boutons « Tout sélectionner » et « Tout désélectionner » sont disponibles.
- [ ] Les règles désactivées sont signalées par un badge « Disabled » mais restent sélectionnables.
- [ ] Le bouton « Suivant » est désactivé si aucune règle n'est sélectionnée.

---

## US-IE009 — Export vers fichier ou presse-papiers

**En tant qu'** utilisateur,
**je veux** exporter les règles sélectionnées soit dans un fichier `.json`, soit dans le presse-papiers,
**afin de** les transférer vers une autre installation ou de les partager facilement.

### Critères d'acceptation

- [ ] Le pied de page de l'étape d'export contient un bouton principal « Export » et un bouton chevron (▾) ouvrant un menu déroulant.
- [ ] Le menu déroulant propose deux options : « Export to File » (défaut) et « Copy to Clipboard ».
- [ ] L'export vers fichier propose un nom par défaut `smarttab_organizer_rules.json`.
- [ ] Sur les navigateurs qui supportent l'API FileSystem (ex. Chrome), la boîte de dialogue native de sauvegarde est utilisée ; sur les autres, un téléchargement automatique est déclenché.
- [ ] Annuler la boîte de dialogue native ne produit pas d'erreur visible.
- [ ] Après un export réussi (fichier ou presse-papiers), le dialogue se ferme automatiquement.
- [ ] Une notification système apparaît avec le titre « Rules exported ».
- [ ] Le JSON exporté est formaté avec une indentation de 2 espaces.
