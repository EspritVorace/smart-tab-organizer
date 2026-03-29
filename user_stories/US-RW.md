# User Stories — Domaine RW : Wizard de création et d'édition de règle

> Remplacement du formulaire modal plat `DomainRuleFormModal` par un wizard en 4 étapes pour la création, et par une vue de résumé éditable pour la modification.
> Composants existants réutilisés : `WizardStepper`, `SegmentedControl` (Radix), `CategoryPicker`.
> Comportements testés dans `tests/e2e/rule-wizard.spec.ts`.

---

## Modèle de navigation

### Création (wizard 4 étapes)

```
Étape 1 : Identité       → Catégorie, étiquette, filtre de domaine
Étape 2 : Configuration  → Mode (SegmentedControl) + champs conditionnels selon le mode
Étape 3 : Options        → Déduplication
Étape 4 : Résumé         → Lecture seule + bouton "Créer"
```

### Édition (vue résumé)

```
Zone 1 : Identité          → Catégorie, étiquette, filtre de domaine (champs directement éditables)
Zone 2 : Configuration     → Résumé textuel du mode + crayon ouvrant une modale dédiée
Zone 3 : Options diverses  → Section repliée par défaut, dépliable pour éditer
```

---

## Décisions de conception

- **Déduplication** : 2 modes seulement (`exact`, `includes`) — pas d'extension du schéma Zod actuel.
- **Sélecteur de mode** : `SegmentedControl` de Radix (déjà utilisé dans le formulaire actuel), extrait en `WizardStep2Config`.
- **Mode Manuel** : toutes les 7 valeurs de `groupNameSource` disponibles (comme le formulaire actuel).
- **Tests** : nouveau fichier `tests/e2e/rule-wizard.spec.ts` + mise à jour de `domain-rules.spec.ts`.

---

## US-RW001 — Étape 1 : saisie de l'identité de la règle

**En tant qu'** utilisateur créant une règle,
**je veux** saisir la catégorie logique, l'étiquette et le filtre de domaine dans une première étape dédiée,
**afin de** poser l'identité de la règle avant de configurer son comportement.

### Critères d'acceptation

- [ ] L'étape 1 affiche trois champs : sélecteur de catégorie (`categoryId`), champ texte étiquette (`label`), champ texte filtre de domaine (`domainFilter`).
- [ ] Le sélecteur de catégorie utilise le composant `CategoryPicker` existant. La valeur "Aucune catégorie" est toujours disponible et correspond à `categoryId = null`.
- [ ] Le champ étiquette est obligatoire. Si vide au clic "Suivant", un message d'erreur s'affiche sous le champ et la navigation vers l'étape 2 est bloquée.
- [ ] L'étiquette doit être unique parmi les règles existantes (insensible à la casse), validée via `createDomainRuleSchemaWithUniqueness`. Si en doublon, un message d'erreur s'affiche et la navigation est bloquée.
- [ ] Le champ filtre de domaine est obligatoire et doit passer la validation `createDomainFilterValidator`. Si invalide, un message d'erreur s'affiche et la navigation est bloquée.
- [ ] Le bouton "Suivant" est toujours visible mais déclenche la validation au clic.
- [ ] Il n'y a pas de bouton "Précédent" à l'étape 1.
- [ ] Le `WizardStepper` affiche 4 étapes numérotées. L'étape 1 est active.

### Note d'implémentation

Composant : `WizardStep1Identity`. Le champ `categoryId` utilise le composant `CategoryPicker` déjà présent dans le formulaire actuel.

---

## US-RW002 — Étape 2 : configuration du mode de nommage

**En tant qu'** utilisateur créant une règle,
**je veux** choisir le mode de configuration via un `SegmentedControl` et saisir les informations correspondantes dans la même étape,
**afin de** configurer la logique de nommage de groupe sans navigation supplémentaire.

### Critères d'acceptation

- [ ] L'étape 2 affiche un `SegmentedControl` à trois segments : "Preset", "Ask", "Manuel". Le mode sélectionné est mis en valeur visuellement. La valeur par défaut est "Preset".
- [ ] Le mode actif pilote les champs `presetId` et `groupNameSource` selon la correspondance suivante : Preset → `presetId != null` / Ask → `presetId = null` + `groupNameSource = 'ask'` / Manuel → `presetId = null` + `groupNameSource` selon sélection.
- [ ] En mode **Preset** : le `SearchableSelect` (CMDK) existant dans le formulaire actuel est réutilisé pour choisir parmi les presets disponibles. `presetId` est mis à jour à la sélection. Le champ est obligatoire pour passer à l'étape 3.
- [ ] En mode **Ask** : aucun champ supplémentaire n'est affiché. Un texte explicatif court indique que le nom du groupe sera demandé à chaque ouverture d'onglet correspondant.
- [ ] En mode **Manuel** : un `Select` permet de choisir la source (toutes les 7 valeurs de `groupNameSource` disponibles sauf `manual` et `smart_preset`), ce qui fixe `groupNameSource`. Le(s) champ(s) regex correspondants s'affichent et sont validés par `createRegexValidator`.
- [ ] Changer de mode conserve les valeurs déjà saisies dans les champs des autres modes.
- [ ] Le bouton "Précédent" ramène à l'étape 1 sans perte des valeurs de l'étape 1.
- [ ] Le bouton "Suivant" déclenche la validation des champs du mode actif avant de progresser.

### Note d'implémentation

Composant : `WizardStep2Config`. Logique de bascule de mode copiée depuis l'ancien `DomainRuleFormModal`.

---

## US-RW003 — Étape 3 : options de déduplication

**En tant qu'** utilisateur créant une règle,
**je veux** configurer la déduplication dans une étape dédiée,
**afin de** ajuster le comportement avancé de la règle sans surcharger les étapes précédentes.

### Critères d'acceptation

- [ ] L'étape 3 affiche un `Switch` "Activer la déduplication" (`deduplicationEnabled`). Activé par défaut conformément au schéma Zod (`default(true)`).
- [ ] Quand la déduplication est activée, un `RadioGroup` affiche les deux modes disponibles : "URL exacte" (`exact`), "URL incluse" (`includes`).
- [ ] Quand la déduplication est désactivée, le `RadioGroup` est masqué (non simplement grisé).
- [ ] Le bouton "Précédent" ramène à l'étape 2 sans perte des valeurs de l'étape 2.
- [ ] Le bouton "Suivant" est toujours actif à cette étape (aucun champ obligatoire).
- [ ] Aucune validation bloquante n'est appliquée à cette étape.

### Note d'implémentation

Composant : `WizardStep3Options`. Également utilisé dans la section Options repliable du mode édition.

---

## US-RW004 — Étape 4 : résumé et confirmation

**En tant qu'** utilisateur créant une règle,
**je veux** voir un résumé lisible de ma configuration avant de valider,
**afin de** détecter une erreur avant la création effective.

### Critères d'acceptation

- [ ] L'étape 4 affiche en lecture seule l'ensemble des valeurs saisies aux étapes 1 à 3, regroupées en sections correspondant aux étapes.
- [ ] Chaque section du résumé comporte un bouton discret "Modifier" qui, au clic, ramène directement à l'étape correspondante sans perdre les données des autres étapes.
- [ ] Le bouton "Créer" est affiché à la place de "Suivant". Il déclenche la création effective de la règle.
- [ ] Le bouton "Précédent" ramène à l'étape 3.
- [ ] Après une création réussie, la modale se ferme et la nouvelle règle apparaît dans la liste.
- [ ] Si la création échoue (erreur inattendue), un message d'erreur est affiché dans l'étape 4 sans fermer la modale.

### Note d'implémentation

Composant : `WizardStep4Summary`.

---

## US-RW005 — Navigation clavier dans le wizard

**En tant qu'** utilisateur clavier,
**je veux** naviguer dans le wizard sans utiliser la souris,
**afin de** créer une règle de façon accessible.

### Critères d'acceptation

- [ ] La touche `Tab` parcourt tous les champs interactifs de l'étape active dans l'ordre visuel.
- [ ] La touche `Enter` sur le bouton "Suivant" ou "Créer" déclenche l'action correspondante.
- [ ] La touche `Escape` ferme la modale (comportement natif de `Dialog.Root` Radix).
- [ ] Le focus est placé sur le premier champ interactif (`input[name="label"]`) à l'ouverture de la modale.
- [ ] Le `WizardStepper` est navigation visuelle uniquement : les étapes futures sont `aria-disabled="true"`. La navigation arrière se fait uniquement via "Précédent".

---

## US-RW006 — Mode édition : identité directement éditable

**En tant qu'** utilisateur modifiant une règle existante,
**je veux** voir et modifier la catégorie, l'étiquette et le filtre de domaine directement dans la vue de résumé,
**afin de** corriger rapidement l'identité d'une règle sans traverser un wizard.

### Critères d'acceptation

- [ ] En mode édition, la modale s'ouvre directement sur la vue résumé (pas sur l'étape 1 du wizard). Aucun `WizardStepper` n'est affiché.
- [ ] La zone "Identité" affiche les champs `categoryId`, `label` et `domainFilter` sous forme de champs éditables (pas en lecture seule).
- [ ] Le champ `categoryId` utilise le composant `CategoryPicker` existant.
- [ ] Les mêmes règles de validation qu'à l'étape 1 du wizard s'appliquent. Les erreurs s'affichent inline sous chaque champ.
- [ ] La modification de l'étiquette ou du domaine ne déclenche pas de sauvegarde immédiate : la sauvegarde globale se fait via le bouton "Enregistrer".

### Note d'implémentation

Composant : `EditSummaryView` → Zone 1 Identité (mêmes champs que `WizardStep1Identity`).

---

## US-RW007 — Mode édition : configuration du mode via modale dédiée

**En tant qu'** utilisateur modifiant une règle existante,
**je veux** voir un résumé lisible du mode de configuration actuel et pouvoir le modifier via une modale secondaire,
**afin de** comprendre la configuration en place et la changer sans quitter la vue résumé.

### Critères d'acceptation

- [ ] La zone "Configuration" affiche un texte de résumé décrivant le mode actif. Exemples : "Préréglage : Jira", "Demander (nom saisi à chaque ouverture d'onglet)", "Manuel : Titre".
- [ ] Un bouton icône crayon est affiché à droite du résumé. Il est accessible au clavier et possède un `aria-label`.
- [ ] Au clic sur le crayon, une modale secondaire (`ConfigEditModal`) s'ouvre. Elle contient le même `SegmentedControl` que l'étape 2 du wizard avec les champs conditionnels.
- [ ] La modale secondaire possède ses propres boutons "Annuler" et "Appliquer". "Appliquer" valide les champs du mode actif et met à jour l'état local de la règle sans sauvegarder en base. "Annuler" ferme la modale sans changement.
- [ ] Après "Appliquer", le texte de résumé dans la vue principale se met à jour pour refléter la nouvelle configuration.
- [ ] La sauvegarde effective ne se produit qu'au clic sur "Enregistrer" de la modale principale.

### Note d'implémentation

Composant : `ConfigEditModal`. Utilise un état local indépendant (snapshot des valeurs au moment de l'ouverture). Pas de `react-hook-form` dans la modale secondaire.

---

## US-RW008 — Mode édition : options diverses en section repliée

**En tant qu'** utilisateur modifiant une règle existante,
**je veux** accéder aux options de déduplication dans une section repliée par défaut,
**afin de** ne pas être distrait par des options rarement modifiées.

### Critères d'acceptation

- [ ] La zone "Options" est rendue avec un composant `Collapsible` Radix, repliée par défaut en mode édition.
- [ ] L'en-tête de la section affiche un résumé compact des options actives. Exemple : "Déduplication activée · URL exacte".
- [ ] Au dépliage, le même contenu qu'à l'étape 3 du wizard est affiché : `Switch` `deduplicationEnabled`, `RadioGroup` `deduplicationMatchMode`.
- [ ] Les modifications dans la section dépliée sont répercutées immédiatement dans le résumé de l'en-tête de section.
- [ ] La sauvegarde effective ne se produit qu'au clic sur "Enregistrer" de la modale principale.

### Note d'implémentation

`EditSummaryView` → Zone 3 Options. Réutilise `WizardStep3Options`.

---

## US-RW009 — Persistance de l'état du wizard entre les étapes

**En tant qu'** utilisateur naviguant entre les étapes du wizard,
**je veux** que mes saisies soient conservées si je reviens à une étape précédente,
**afin de** corriger une valeur sans tout ressaisir.

### Critères d'acceptation

- [ ] Revenir à l'étape 1 depuis l'étape 2 ou ultérieure conserve les valeurs saisies à l'étape 1.
- [ ] Revenir à l'étape 2 depuis l'étape 3 ou 4 conserve le mode sélectionné et les champs du mode.
- [ ] Changer de mode à l'étape 2 après y être revenu préserve les valeurs des autres modes via les refs `lastManualState` / `lastPresetState`.
- [ ] Fermer la modale (bouton "Annuler" ou touche `Escape`) vide l'état interne du wizard. Une réouverture repart d'une étape 1 vierge.

### Note d'implémentation

Logique de persistance dans `RuleWizardModal` : `lastManualState` et `lastPresetState` refs (copiées depuis l'ancien `DomainRuleFormModal`). État du wizard via `useState(step)`.

---

## US-RW010 — Accessibilité du wizard

**En tant qu'** utilisateur utilisant un lecteur d'écran ou la navigation clavier,
**je veux** que le wizard soit entièrement navigable sans souris,
**afin d'** accéder à la fonctionnalité de création de règle de façon autonome.

### Critères d'acceptation

- [ ] Le `WizardStepper` expose `aria-current="step"` sur l'étape active.
- [ ] Les étapes non encore atteintes sont `aria-disabled="true"` dans le stepper (prop `disableFutureNavigation`).
- [ ] Chaque changement d'étape annonce le titre de la nouvelle étape via une région `aria-live="polite"` visually-hidden dans `RuleWizardModal`.
- [ ] Le `SegmentedControl` à l'étape 2 est accessible nativement via le composant Radix (role radiogroup).
- [ ] Toutes les icônes décoratives portent `aria-hidden="true"`. Le bouton icône crayon en mode édition porte un `aria-label` explicite.

### Note d'implémentation

`WizardStepper` : attributs `role="list"`, `role="listitem"`, `aria-current`, `aria-disabled`, `aria-hidden` sur les icônes.
`RuleWizardModal` : `<div role="status" aria-live="polite">` avec annonce `getMessage('wizardStepAnnouncement')`.
