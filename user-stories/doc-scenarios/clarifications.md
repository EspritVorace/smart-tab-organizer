# Clarifications — pipeline `e2e-doc-scenarios/` (issue #257)

Décisions prises avant l'implémentation Phase 1.

## Scope Phase 1

Cette PR couvre :

- US-DS001 / US-DS002 : scénario principal `00-main-journey` en `en × dark` uniquement (le scaffold matrice est prêt mais la PR ne lance pas encore les 6 variantes).
- US-DS004 : sites locaux mimétiques (GitHub, YouTube, Google, Le Monde).
- US-DS005 : helpers `ui-actions.ts`.
- US-DS006 : `captureStep()` avec compteur séquentiel.
- US-DS007 : co-existence + factorisation dans `e2e-shared/`.
- US-DS008 : README auto-généré par scénario.
- US-DS009 : migration complète du routage `e2e-screenshots/` vers manifests.

Reportés en phases ultérieures :

- US-DS003 : 4 scénarios satellites (`10-import-conflicts`, `11-restore-conflicts`, `12-deduplication-modes`, `13-grouping-modes`).
- Matrice complète 3 locales × 2 thèmes pour le scénario principal.
- US-DS010 : commande `pnpm doc:scenarios:audit`.
- US-DS011 : commande `pnpm doc:scenarios:sync`.

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

### Notification undo (US-DS002 §023)

Capture de la notification système `chrome.notifications` non retenue (OS-level, fragile dans Playwright).

Phase 1 ne capture pas ce point. Le sera traité en suivi (`023-toast-grouping-with-undo.png`) une fois le toast in-app stabilisé visuellement.

### Modes de configuration disponibles

Le code expose 3 modes (`preset`, `ask`, `manual`). Le mode `label` mentionné dans l'issue n'existe pas dans la base actuelle : la capture `017-rules-wizard-step2-mode-label.png` est donc retirée du Phase 1. À ré-évaluer si un mode `label` est ajouté ultérieurement.

### Étapes du wizard de snapshot

Le `SnapshotWizard` est mono-étape dans le code actuel : pas de découpage `step1-naming` / `step2-tab-selection` / `summary`. Capture unique du wizard rempli (`030-sessions-snapshot-wizard-filled.png`).

### Factorisation (US-DS007)

Helpers communs déplacés dans le nouveau dossier `e2e-shared/` à la racine :

- `chromium-finder.ts` : résolution du binaire Chromium (CI vs local).
- `extension-loader.ts` : `launchExtension()` partagé (userDataDir, args, deterministic flags, host-resolver).
- `extension-id.ts` : `waitForServiceWorker()` + `getExtensionId()`.
- `locale-injector.ts` : override `chrome.i18n.getMessage` via `addInitScript`.
- `theme.ts` : `applyTheme(page, 'light' | 'dark')`.
- `sharp-save.ts` : `savePng()` avec routage manifest-driven.
- `routing/types.ts`, `routing/destinations.ts` : types et roots des destinations.

Les pipelines `tests/e2e/` et `e2e-screenshots/` ont été refactorés pour consommer ces helpers, sans changement d'API publique.
