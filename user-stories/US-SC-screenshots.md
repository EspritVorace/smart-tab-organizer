# User Stories — Domaine SC : Génération automatique de captures d'écran

> Script Playwright dédié à la production de captures d'écran pour la
> documentation et les stores (Chrome Web Store, Firefox Add-ons).
> Basé sur l'infrastructure E2E existante (`tests/e2e/fixtures.ts`,
> `tests/e2e/helpers/seed.ts`).

---

## US-SC001 — Script de génération de captures d'écran multi-locale et multi-thème

**En tant que** développeur ou responsable de la publication de l'extension,
**je veux** lancer une commande unique qui génère des captures d'écran de toutes les fonctionnalités principales dans les 3 langues et en thème clair et sombre,
**afin de** disposer d'illustrations à jour pour la documentation, les stores et les release notes, sans avoir à les produire manuellement.

### Critères d'acceptation

- [ ] Une commande `npm run screenshots` lance le script de génération.
- [ ] Le script itère sur les 3 locales supportées : **en**, **fr**, **es**.
- [ ] Pour chaque locale, l'extension est lancée via `chromium.launchPersistentContext()` avec l'argument `--lang={locale}`.
- [ ] Pour chaque locale, les captures sont prises en **thème clair** puis en **thème sombre** (bascule via le bouton ThemeToggle de l'interface).
- [ ] Les captures sont enregistrées dans `screenshots/{locale}/{theme}/` avec un nom de fichier descriptif (ex. `popup.png`, `grouping-rules.png`).
- [ ] Le script réutilise les helpers de seeding existants (`seedSessions`, `addDomainRule`, etc.) pour peupler l'extension avec des données réalistes avant chaque capture.
- [ ] Le viewport est fixé à une résolution cohérente pour toutes les captures (ex. 1280 × 800 px).
- [ ] Le script ne plante pas si une capture échoue : l'erreur est logguée et la capture suivante est tentée.

---

## US-SC002 — Couverture des fonctionnalités principales

**En tant que** développeur,
**je veux** que le script capture les écrans les plus représentatifs de chaque fonctionnalité principale,
**afin que** chaque capture illustre clairement la valeur ajoutée de la fonctionnalité.

### Critères d'acceptation

Les captures suivantes sont produites pour chaque combinaison locale × thème :

#### Popup
- [ ] `popup.png` — Popup avec règles de domaine actives et statistiques affichées.

#### Groupage (options → Domain Rules)
- [ ] `grouping-rules-list.png` — Liste des règles de domaine avec plusieurs règles configurées (couleurs, filtres variés).
- [ ] `grouping-rule-form.png` — Modale d'ajout/édition d'une règle de domaine ouverte.

#### Déduplication (options → Domain Rules)
- [ ] `deduplication-toggle.png` — Section des règles avec le toggle de déduplication activé sur au moins une règle.

#### Sessions (options → Sessions)
- [ ] `sessions-list.png` — Liste de sessions avec au moins 2 sessions ordinaires et 1 profil épinglé.
- [ ] `restore-wizard-conflicts.png` — Wizard de restauration ouvert à l'étape de résolution des conflits (données simulées avec doublons et groupes en conflit).

#### Import / Export (options → Domain Rules)
- [ ] `import-wizard-step1.png` — Wizard d'import à l'étape de classification des règles (nouvelles + conflictuelles + identiques).
- [ ] `import-wizard-step2.png` — Wizard d'import à l'étape de confirmation avec résumé.
- [ ] `export-wizard.png` — Wizard d'export à l'étape de sélection des règles.

---

## US-SC003 — Organisation et nommage des fichiers de sortie

**En tant que** développeur,
**je veux** que les captures soient organisées dans une arborescence claire,
**afin de** les retrouver et les utiliser facilement.

### Critères d'acceptation

- [ ] Structure de sortie :
  ```
  screenshots/
  ├── en/
  │   ├── light/
  │   │   ├── popup.png
  │   │   ├── grouping-rules-list.png
  │   │   └── ...
  │   └── dark/
  │       ├── popup.png
  │       └── ...
  ├── fr/
  │   ├── light/
  │   └── dark/
  └── es/
      ├── light/
      └── dark/
  ```
- [ ] Le dossier `screenshots/` est créé automatiquement s'il n'existe pas.
- [ ] Les fichiers existants sont écrasés à chaque exécution (pas d'accumulation de captures obsolètes).
- [ ] Le dossier `screenshots/` est listé dans `.gitignore` (les captures ne sont pas versionnées).

---

## US-SC004 — Données de démonstration réalistes

**En tant que** développeur,
**je veux** que les captures soient alimentées par des données représentatives du cas d'usage réel,
**afin que** les illustrations soient convaincantes pour les utilisateurs potentiels.

### Critères d'acceptation

#### Règles de domaine (au moins 4 règles)
- [ ] Une règle « Google » (filtre : `google.com`, couleur : blue, groupage + déduplication activés).
- [ ] Une règle « GitHub » (filtre : `github.com`, couleur : purple, groupage activé).
- [ ] Une règle « YouTube » (filtre : `youtube.com`, couleur : red, groupage activé, déduplication activée).
- [ ] Une règle « Actualités » (filtre : `lemonde.fr|lefigaro.fr`, couleur : orange, groupage activé).

#### Sessions
- [ ] Un profil épinglé « Work » avec `autoSync: true`, une icône `briefcase`, contenant 2 groupes (« GitHub », « Docs ») et 3 onglets.
- [ ] Une session ordinaire « Research » avec 1 groupe et 4 onglets.
- [ ] Une session ordinaire « Side Project » avec 2 groupes et 5 onglets.

#### Conflits pour le wizard de restauration
- [ ] Au moins 2 onglets en doublon simulés (même URL déjà ouverte dans la fenêtre).
- [ ] Au moins 1 groupe en conflit (même titre + même couleur qu'un groupe existant).

#### Import
- [ ] JSON d'import préparé contenant : 2 nouvelles règles, 1 règle conflictuelle (même label, domainFilter différent), 1 règle identique.
