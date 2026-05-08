# Clarifications - pipeline `e2e-doc-scenarios/` (issues #257, #259)

Décisions prises avant et pendant l'implémentation des phases successives.

## Scope Phase 1 (#257)

Cette PR couvrait :

- US-DS001 / US-DS002 : scénario principal `00-main-journey` en `en x dark` uniquement (le scaffold matrice est prêt mais la PR ne lançait pas encore les 6 variantes).
- US-DS004 : sites locaux mimétiques (GitHub, YouTube, Google, Le Monde).
- US-DS005 : helpers `ui-actions.ts`.
- US-DS006 : `captureStep()` avec compteur séquentiel.
- US-DS007 : co-existence et factorisation dans `e2e-shared/`.
- US-DS008 : README auto-généré par scénario.
- US-DS009 : migration complète du routage `e2e-screenshots/` vers manifests.

Reportés en phases ultérieures :

- US-DS003 : 4 scénarios satellites (`10-import-conflicts`, `11-restore-conflicts`, `12-deduplication-modes`, `13-grouping-modes`).
- Matrice complète 3 locales x 2 thèmes pour le scénario principal.
- US-DS010 : commande `pnpm doc:scenarios:audit`.
- US-DS011 : commande `pnpm doc:scenarios:sync`.

## Scope Phase 2.1 (#259)

Cette phase étend la couverture :

- Matrice complète : `playwright.doc.config.ts` génère 6 projects `{locale}-{theme}` (en/fr/es x dark/light) ; chaque project porte ses paramètres via `metadata: { locale, theme }`, lus par la fixture (`doc-fixture.ts`) et par le scénario.
- Le scénario lit locale et theme via les nouvelles fixtures `locale` / `theme` (worker-scoped) au lieu d'inférer la locale depuis `project.name`.
- Captures complémentaires ajoutées au scénario `00-main-journey` :
  - `034-sessions-card-relative-time.png`
  - `035-sessions-card-hovercard.png`
  - `036-sessions-pin-onboarding.png` (popup pinned-empty hint)
  - `037-sessions-list-with-pinned.png`
  - `041-export-wizard-selection.png`
  - `043-import-wizard-paste.png`
  - `044-import-wizard-classification.png`
  - `050-rules-list-with-disabled.png`
  - `051-sessions-search-active.png`
  - `052-sessions-search-deep.png`
  - `060-rules-list-final.png` (renumérotation : laisse 050 disponible pour la version désactivée).
- Helpers de stabilisation ajoutés : `waitForToast`, `hoverSessionCardName`, `pinSession`, `getFirstSessionId`, `toggleRuleEnabled`, `fillSessionsSearch`, `openExportRulesWizard`, `openImportRulesWizard`, `pasteImportJson`, `importWizardNextToClassification`.
- Petit ajout source : `data-testid="session-card-{id}-btn-pin"` / `-btn-unpin` sur le bouton pin/unpin de `SessionCard`, pour fiabiliser la sélection sans recourir à un locator par aria-label i18n.

### Captures explicitement non livrées en Phase 2.1

- `014-rules-toast-created.png` : aucun toast in-app n'est émis lors de la création d'une règle dans la base actuelle. À ré-évaluer si un `showSuccessToast` est ajouté à `handleSubmitRule` (`src/pages/DomainRulesPage.tsx`).
- `023-toast-grouping-with-undo.png` : aucun toast in-app n'accompagne le groupage automatique. La notification système (`chrome.notifications`) avec bouton Annuler reste OS-level (cf. décision Phase 1) et ne peut pas être capturée par Playwright. À reprendre une fois un toast in-app ajouté.
- `031-sessions-snapshot-wizard-step2.png` : `SnapshotWizard` est mono-étape (cf. décision Phase 1). Capture unique conservée (`030-sessions-snapshot-wizard-filled.png`).
- `042-export-toast-success.png` : nécessite de piloter `showSaveFilePicker` (FileSystem Access API) ou `navigator.clipboard.writeText` ; les deux requièrent du tooling additionnel (interception de boîte de dialogue native ou octroi de permissions clipboard sur le persistent context). À reprendre conjointement avec un helper `captureToast()` dédié et un stub `showSaveFilePicker` ou un grant clipboard côté `extension-loader`.

## Décisions techniques

### Sites locaux mimétiques (US-DS004)

Approche retenue : **DNS local via Chromium `--host-resolver-rules`**.

Le serveur HTTP statique tourne sur `127.0.0.1:4173`. Chromium est lancé avec :

```
--host-resolver-rules=MAP github.com:80 127.0.0.1:4173, MAP youtube.com:80 127.0.0.1:4173, MAP google.com:80 127.0.0.1:4173, MAP lemonde.fr:80 127.0.0.1:4173, EXCLUDE localhost
```

Conséquences :

- En barre d'adresse, l'utilisateur voit `http://github.com/repo-readme.html` (réaliste).
- `chrome.tabs.url` retourne la même URL : les règles de domaine matchent naturellement `github.com`, sans adaptation.
- Tout reste offline et déterministe.

### Modes de configuration disponibles

Le code expose 3 modes (`preset`, `ask`, `manual`). Le mode `label` mentionné dans l'issue n'existe pas dans la base actuelle : la capture `017-rules-wizard-step2-mode-label.png` est donc retirée du Phase 1. À ré-évaluer si un mode `label` est ajouté ultérieurement.

### Étapes du wizard de snapshot

Le `SnapshotWizard` est mono-étape dans le code actuel : pas de découpage `step1-naming` / `step2-tab-selection` / `summary`. Capture unique du wizard rempli (`030-sessions-snapshot-wizard-filled.png`).

### Factorisation (US-DS007)

Helpers communs dans le dossier `e2e-shared/` à la racine :

- `chromium-finder.ts` : résolution du binaire Chromium (CI vs local).
- `extension-loader.ts` : `launchExtension()` partagé (userDataDir, args, deterministic flags, host-resolver).
- `extension-id.ts` : `waitForServiceWorker()` + `getExtensionId()`.
- `locale-injector.ts` : override `chrome.i18n.getMessage` via `addInitScript`.
- `theme.ts` : `applyTheme(page, 'light' | 'dark')`.
- `sharp-save.ts` : `savePng()` avec routage manifest-driven.
- `routing/types.ts`, `routing/destinations.ts` : types et roots des destinations.

Les pipelines `tests/e2e/` et `e2e-screenshots/` consomment ces helpers, sans changement d'API publique.
