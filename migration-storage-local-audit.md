# Audit : migration `storage.sync` vers `storage.local`

## 1.1 Inventaire des acces a `storage.sync`

### Acces directs a `browser.storage.sync`

| Fichier | Ligne | Type d'acces | Donnee | Frequence |
|---|---|---|---|---|
| `src/utils/migration.ts` | 50 | Lecture | Cle `domainRules` (detection fresh install) | Init (onInstalled) |
| `src/utils/migration.ts` | 88 | Lecture | Cle `statistics` dans `storage.local` (controle) | Init (onInstalled) |

### Acces via WXT storage items (prefixe `sync:`)

Ces acces n'appelent pas `browser.storage.sync` directement mais utilisent `storage.defineItem('sync:...')` de WXT, qui route vers `storage.sync` en interne.

| Fichier | Role | Frequence |
|---|---|---|
| `src/utils/storageItems.ts` | Definition des 7 items `sync:*` et de la map `syncSettingsItemMap` | Declaration statique |
| `src/utils/settingsUtils.ts` | `getSyncSettings`, `setSyncSettings`, `updateSyncSettings`, `watchSyncSettings`, `watchSyncSettingsField` | Init + user action + background |
| `src/hooks/useSyncedSettings.ts` | `loadSyncSettingsFromStorage`, `watchSyncSettings`, `saveSettingsToStorage` | Runtime (React) |

### Hooks qui encapsulent l'acces

| Hook | Fichier | Role |
|---|---|---|
| `useSyncedSettings` | `src/hooks/useSyncedSettings.ts` | Charge, surveille et ecrit les settings (sync) |
| `useSyncedState<T>` | `src/hooks/useSyncedState.ts` | Generique : load/watch/save, utilise par `useSyncedSettings` et `useStatistics` |

`useStatistics` (via `useSyncedState`) lit et ecrit `local:statistics` uniquement : pas impacte.

### Listeners `storage.onChanged`

| Fichier | Filtre | Usage |
|---|---|---|
| `src/hooks/useSessions.ts` (l. 40-46) | `areaName === 'local'` uniquement | Reactualise les sessions quand `local.sessions` change. Pas impacte. |
| `src/hooks/useSyncedSettings.ts` (l. 81-86) | Via `item.watch()` de WXT (interne) | Surveille les changements de chaque item `sync:*`. A migrer vers `local:*`. |

---

## 1.2 Cles stockees dans `storage.sync`

| Cle WXT | Cle brute | Schema Zod | Type TypeScript | Valeur par defaut | Lecture | Ecriture |
|---|---|---|---|---|---|---|
| `sync:globalGroupingEnabled` | `globalGroupingEnabled` | `z.boolean()` | `boolean` | `true` | `getSyncSettings`, `useSyncedSettings` | `setSyncSettings`, `updateSyncSettings`, `useSyncedSettings` |
| `sync:globalDeduplicationEnabled` | `globalDeduplicationEnabled` | `z.boolean()` | `boolean` | `true` | id. | id. |
| `sync:deduplicateUnmatchedDomains` | `deduplicateUnmatchedDomains` | `z.boolean()` | `boolean` | `false` | id. | id. |
| `sync:deduplicationKeepStrategy` | `deduplicationKeepStrategy` | `z.enum([...])` | `DeduplicationKeepStrategyValue` | `'keep-grouped-or-new'` | id. | id. |
| `sync:domainRules` | `domainRules` | `z.array(domainRuleSchema)` | `DomainRuleSettings` | `[]` | id. | id. |
| `sync:notifyOnGrouping` | `notifyOnGrouping` | `z.boolean()` | `boolean` | `true` | id. | id. |
| `sync:notifyOnDeduplication` | `notifyOnDeduplication` | `z.boolean()` | `boolean` | `true` | id. | id. |

Toutes ces cles sont agregees dans l'interface `SyncSettings` (`src/types/syncSettings.ts`) et dans `syncSettingsItemMap` (`src/utils/storageItems.ts`).

---

## 1.3 Impact sur les user stories existantes

Aucune user story du dossier `user-stories/` ne reference `storage.sync`, `chrome.storage.sync`, `browser.storage.sync` ou la notion de synchronisation inter-devices. Les seules references a la persistance dans les US sont :

- `US-S-DND.md` (l. 39) : mentionne `browser.storage.local` pour les sessions. Pas impacte.
- `US-S-sessions.md` (l. 151) : parle de "stockage" de maniere generique. Pas impacte.

**Conclusion : aucune user story ne necessite de modification.**

---

## 1.4 Impact sur les tests

### Tests Vitest mockant `storage.sync`

| Fichier | Nombre d'usages | Nature |
|---|---|---|
| `tests/migration.test.ts` | 11 | `fakeBrowser.storage.sync.set(...)` pour seeder l'etat initial, `fakeBrowser.storage.sync.get(...)` pour assertion |
| `tests/hooks/useSyncedSettings.test.ts` | 2 | `fakeBrowser.storage.sync.set(...)` pour pre-remplir le storage |
| `tests/utils/settingsUtils.test.ts` | 4 | `fakeBrowser.storage.sync.set/get(...)`, `vi.spyOn(fakeBrowser.storage.sync, 'get')` |

**Total : 17 usages a migrer vers `fakeBrowser.storage.local`.**

### Tests Playwright E2E utilisant `chrome.storage.sync`

| Fichier | Nombre d'usages | Nature |
|---|---|---|
| `tests/e2e/fixtures.ts` | 4 | Fonctions `syncSet`, `addDomainRule`, `clearDomainRules`, `getSettings` |
| `tests/e2e/import-export.spec.ts` | 2 | Setup de regles avant test |
| `tests/e2e/options-toasts.spec.ts` | 1 | `chrome.storage.sync.set({ domainRules: [] })` |
| `tests/e2e/notifications.spec.ts` | 1 | `chrome.storage.sync.set(...)` |
| `tests/e2e/popup-organize.spec.ts` | 4 | `chrome.storage.sync.set(...)` pour notifyOn* |

**Total : 12 usages E2E a migrer vers `chrome.storage.local`.**

La fonction helper `syncSet` dans `tests/e2e/fixtures.ts` (l. 92-113) gere le retry sur `MAX_WRITE_OPERATIONS_PER_MINUTE` : ce probleme disparait avec `storage.local` (quota illimite en ecriture). La logique de retry peut etre supprimee ou simplifiee.

### Tests marques flaky

Aucun test ne porte de marqueur `.only`, `test.skip`, commentaire `// flaky` ou `// TODO flaky` dans les fichiers analyses. La flakiness mentionnee dans la motivation est comportementale (lenteur async de `storage.sync` en E2E), pas annotee dans le code.

---

## 1.5 Strategie de migration runtime

### Principe

Lors du premier demarrage avec la nouvelle version, le background lit les donnees dans `storage.sync` et les copie dans `storage.local`, puis pose un flag `settingsMigratedToLocal: true` dans `storage.local`. Les versions suivantes detectent ce flag et sautent la migration.

Les donnees dans `storage.sync` **ne sont pas supprimees** afin de permettre un rollback vers l'ancienne version.

### Ou placer le code

Creer `src/background/migration.ts` (distinct de `src/utils/migration.ts` qui gere l'initialisation des defaults). Appeler ce module dans `event-handlers.ts > setupInstallationHandler()`, juste avant `initializeDefaults()`.

Sequence d'appel dans `setupInstallationHandler` :
```
1. migrateSettingsFromSyncToLocal()   // nouveau
2. initializeDefaults()               // existant
```

### Detection de la migration

```ts
const { settingsMigratedToLocal } = await browser.storage.local.get('settingsMigratedToLocal');
if (settingsMigratedToLocal) return; // deja fait
```

### Logique de migration (idempotente)

```
1. Lire toutes les cles sync (* ou cles nommees) depuis browser.storage.sync
2. Pour chaque cle connue (domainRules, globalGroupingEnabled, ...),
   si la valeur existe dans sync ET n'existe pas encore dans local :
     ecrire dans local
3. Poser le flag: browser.storage.local.set({ settingsMigratedToLocal: true })
```

La condition "n'existe pas encore dans local" assure l'idempotence : si la migration a ete partiellement executee puis interrompue, la re-executer ne corrompt pas les donnees deja migrees.

### Cas : fresh install (pas de donnees dans sync)

`browser.storage.sync.get(keys)` retourne un objet vide ou avec des valeurs `undefined` pour les cles absentes. La migration saute simplement toutes les cles, pose le flag, et `initializeDefaults()` ecrit les valeurs par defaut dans `local`. Comportement inchange.

### Cas : rollback utilisateur

Les donnees restent dans `storage.sync`. L'ancienne version les lira comme avant. Pas de degradation.

### Gestion des erreurs

- Encapsuler la migration dans un `try/catch`.
- En cas d'erreur, logger avec `logger.error` et ne pas poser le flag : la migration sera retentee au prochain demarrage.
- Pas de retry immediat pour ne pas bloquer le service worker.

---

## 1.6 Renommage des hooks

### Probleme

Apres la migration, `useSyncedSettings` et `useSyncedState` ont des noms trompeurs : "synced" evoque la synchronisation inter-devices, qui n'existe plus.

### Propositions

| Nom actuel | Nom propose | Justification |
|---|---|---|
| `useSyncedSettings` | `useSettings` | Court, precis. Le hook gere les settings de l'extension, point. |
| `useSyncedState<T>` | `useStorageState<T>` | Indique que l'etat est persiste en storage, sans prejudger du backend. |
| `getSyncSettings` | `getSettings` | Alignement avec le nouveau nom du hook. |
| `setSyncSettings` | `setSettings` | id. |
| `updateSyncSettings` | `updateSettings` | id. |
| `watchSyncSettings` | `watchSettings` | id. |
| `watchSyncSettingsField` | `watchSettingsField` | id. |
| `SyncSettings` (type) | `AppSettings` | Evite la confusion avec la notion de sync, reste distinct de types generiques. |
| `defaultSyncSettings` | `defaultAppSettings` | Alignement. |
| `syncSettingsItemMap` | `settingsItemMap` | id. |

### Fichiers a mettre a jour pour le renommage

**Hook et utilitaires (renommage fichier + contenu) :**
- `src/hooks/useSyncedSettings.ts` -> `src/hooks/useSettings.ts`
- `src/hooks/useSyncedState.ts` -> `src/hooks/useStorageState.ts`
- `src/utils/settingsUtils.ts` (renommage des fonctions exportees)
- `src/utils/storageItems.ts` (renommage `syncSettingsItemMap`)
- `src/types/syncSettings.ts` (renommage type + constante)

**Consommateurs (imports + usages) :**
- `src/background/settings.ts`
- `src/background/deduplication.ts`
- `src/background/grouping.ts`
- `src/background/organize.ts`
- `src/hooks/useStatistics.ts`
- `src/pages/options.tsx`
- `src/pages/popup.tsx`
- `src/pages/DomainRulesPage.tsx`
- `src/pages/ImportExportPage.tsx`
- `src/pages/StatisticsPage.tsx`
- `src/pages/SessionsPage.tsx`
- `src/components/Core/DomainRule/RuleWizardModal.tsx`
- `src/components/Core/DomainRule/RuleDetailPopover.tsx`
- `src/components/Core/DomainRule/DomainRuleCard.tsx`
- `src/components/UI/ImportExportWizards/ImportWizard.tsx`
- `src/components/UI/ImportExportWizards/ExportWizard.tsx`
- `src/components/UI/ImportExportWizards/RuleImportRows.tsx`
- `src/components/UI/PageLayout/PageLayout.tsx`
- `src/components/UI/SettingsPage/SettingsPage.tsx`
- `src/utils/importClassification.ts`
- `src/utils/migration.ts` (existant) et `src/background/migration.ts` (nouveau)
- `src/utils/ruleOrderUtils.ts`
- Stories : `src/components/*/**.stories.tsx` (partout ou `SyncSettings` est importe)
- Tests : `tests/hooks/useSyncedSettings.test.ts` -> `tests/hooks/useSettings.test.ts`
- Tests : `tests/utils/settingsUtils.test.ts`

---

## 1.7 Plan de decoupage (phase 2)

### Lot 1 : storageItems + settingsUtils + types (utilitaires)

Changements :
- `src/utils/storageItems.ts` : changer les 7 prefixes `sync:` en `local:`, renommer `syncSettingsItemMap` en `settingsItemMap`.
- `src/types/syncSettings.ts` : renommer `SyncSettings` en `AppSettings`, `defaultSyncSettings` en `defaultAppSettings`.
- `src/utils/settingsUtils.ts` : renommer toutes les fonctions exportees (`getSyncSettings` -> `getSettings`, etc.).
- `src/background/settings.ts` : mettre a jour les imports.

Invariant : `pnpm compile` doit passer. Les autres fichiers ne compilent pas encore car les imports sont casses.

**Note : ce lot est le plus delicat car il casse tous les imports. Il doit etre fait en une seule passe avec mise a jour simultanee de tous les consommateurs (voir lot 2).**

### Lot 2 : hooks + consommateurs React

Changements :
- Renommer `useSyncedSettings.ts` -> `useSettings.ts`, adapter le contenu.
- Renommer `useSyncedState.ts` -> `useStorageState.ts`, adapter le contenu.
- `src/hooks/useStatistics.ts` : mettre a jour l'import.
- Tous les fichiers pages/ et components/ listés en 1.6 : mettre a jour les imports.

Invariant : `pnpm compile` passe, `pnpm test` passe.

### Lot 3 : migration runtime

Changements :
- Creer `src/background/migration.ts` avec `migrateSettingsFromSyncToLocal()`.
- Adapter `src/utils/migration.ts` (`initializeDefaults`) : remplacer `browser.storage.sync.get('domainRules')` par une lecture `local:domainRules`.
- Adapter `src/entrypoints/background.ts` ou `event-handlers.ts` pour appeler la migration.

Invariant : `pnpm compile` passe, `pnpm test` passe.

### Lot 4 : tests Vitest

Changements :
- `tests/migration.test.ts` : migrer 11 usages de `fakeBrowser.storage.sync` vers `fakeBrowser.storage.local`. Adapter les assertions.
- `tests/hooks/useSyncedSettings.test.ts` -> renommer en `useSettings.test.ts`, migrer 2 usages.
- `tests/utils/settingsUtils.test.ts` : migrer 4 usages, adapter le spy.

Invariant : `pnpm test` passe entierement.

### Lot 5 : tests E2E (helpers uniquement, sans execution)

Changements :
- `tests/e2e/fixtures.ts` : remplacer `syncSet` (et son retry sur quota) par un appel direct `chrome.storage.local.set`. Mettre a jour `addDomainRule`, `clearDomainRules`, `getSettings`.
- `tests/e2e/import-export.spec.ts`, `options-toasts.spec.ts`, `notifications.spec.ts`, `popup-organize.spec.ts` : remplacer `chrome.storage.sync.set` par `chrome.storage.local.set`.

Invariant : fichiers modifient mais tests non executes (a la charge de l'utilisateur).

### Lot 6 : documentation

Changements :
- `CLAUDE.md` : modifications detaillees en section 1.9.
- `wxt.config.ts` : mettre a jour le commentaire ligne 22 (supprime "sync").
- `README.md`, `README-fr.md`, `README-es.md` : aucune mention de sync detectee, pas d'action (verifie au scan).
- `DESIGN.md` : a verifier au moment du lot (pas d'occurrence de `storage.sync` au scan, mais relecture prudente).
- `CHANGELOG.md` : ajouter une entree pour la migration.
- Creer `user-stories/migration-storage/clarifications.md`.

---

## 1.8 Risques identifies

| Risque | Probabilite | Mitigation |
|---|---|---|
| **Race condition pendant la migration** : deux fenetres s'ouvrent en meme temps, `onInstalled` se declenche dans deux SW, les deux migrent en parallele et ecrasent des donnees. | Faible (onInstalled ne se declenche qu'une fois par installation/update, pas par fenetre). Le SW est unique. | Confirmer que onInstalled ne se declenche pas deux fois en lecture des docs WXT/MV3. Sinon, utiliser un lock via `storage.session`. |
| **Ancien code lit `sync` apres migration** : si une ancienne instance du SW reste active (en cache), elle lit encore `sync`. | Tres faible (MV3 termine le SW apres inactivite). | Les donnees `sync` sont preservees donc l'ancienne version fonctionnerait en lecture. |
| **Donnees trop volumineuses pour `storage.local`** : theoriquement pas de limite par item (contrairement a `sync` : 8KB/item), mais le quota global est de 5MB par defaut. | Negligeable (les regles de domaine depassent rarement quelques KB). | Aucune. |
| **Tests E2E cassent sur les `storage.local` quotas** : `storage.local` n'a pas de limite d'operations/minute. | Positif : le risque disparait apres la migration. La logique de retry dans `syncSet` peut etre supprimee. | Supprimer le retry. |
| **Regression dans `initializeDefaults`** : la detection du fresh install utilise actuellement `browser.storage.sync.get('domainRules')`. Apres migration, elle doit lire `local:domainRules`. | Reel si on oublie d'adapter ce code. | Lot 3 couvre explicitement ce point. Couvert par les tests du lot 4. |
| **Stories Storybook cassent** : les stories qui importent `SyncSettings` ou `useSyncedSettings` cesseront de compiler si le lot 1 n'est pas atomique avec le lot 2. | Reel en cas de commit partiel. | Faire les lots 1 et 2 dans la meme session de travail, `pnpm compile` avant chaque commit. |
| **Utilisateur installe la nouvelle version, rollback, reinstalle** : a la reinstallation, `settingsMigratedToLocal` est present dans `local`, donc la migration est sautee. Mais les donnees sont dans `local` depuis le premier passage. | Bening. | La migration est idempotente, `initializeDefaults` remplit les valeurs manquantes. |

---

## 1.9 Modifications de `CLAUDE.md`

`CLAUDE.md` contient plusieurs references a `storage.sync` et aux hooks a renommer. Voici les emplacements exacts et les reformulations proposees :

### Ligne 43-45 (tableau Storage)

**Avant :**
```
| Backend | Contents |
|---|---|
| `browser.storage.sync` | Domain rules, grouping/dedup toggles, notification prefs |
| `browser.storage.local` | Sessions, UI prefs (e.g. `popupStatsCollapsed`), help prefs |
| `browser.storage.session` | Profile-window map, sync drafts, editing guard |
```

**Apres :**
```
| Backend | Contents |
|---|---|
| `browser.storage.local` | Domain rules, grouping/dedup toggles, notification prefs, sessions, UI prefs, help prefs, statistics |
| `browser.storage.session` | Profile-window map, sync drafts, editing guard |
```

Note : "sync drafts" ligne 45 designe les drafts de synchronisation automatique des profils (feature auto-sync des sessions epinglees), pas `storage.sync`. Terme conserve. Pour lever l'ambiguite, reformuler en "profile auto-sync drafts".

**Reformulation ligne 45 :**
```
| `browser.storage.session` | Profile-window map, profile auto-sync drafts, editing guard |
```

Aussi, `popupStatsCollapsed` mentionne ligne 44 n'existe pas dans le code (la cle reelle est `popupPinnedEmptyCollapsed`). A corriger au passage.

### Ligne 47 (description des hooks)

**Avant :**
```
`useSyncedSettings` hook uses refs to prevent race conditions. `useSyncedState` unifies synchronized storage access for settings and statistics.
```

**Apres :**
```
`useSettings` hook uses refs to prevent race conditions. `useStorageState` unifies local storage access for settings and statistics.
```

### Ligne 71 (arborescence des hooks)

**Avant :**
```
  hooks/           # useSyncedState · useSyncedSettings · useStatistics · useSessions
```

**Apres :**
```
  hooks/           # useStorageState · useSettings · useStatistics · useSessions
```

### Ligne 157 (regle de clarification)

**Avant :**
```
- La US interagit avec `chrome.storage.sync` ou `browser.storage.local`.
```

**Apres :**
```
- La US interagit avec `browser.storage.local` ou `browser.storage.session`.
```

### Ligne 93 (feature Sessions & Profiles)

Le terme "auto-sync" designe la synchronisation automatique profil -> fenetre (feature produit), pas `storage.sync`. **Aucun changement.**

### Ligne 172 (skill jscpd)

Le terme "synchronise" designe la synchronisation du lockfile skills, pas `storage.sync`. **Aucun changement.**

### Synthese des occurrences a modifier dans `CLAUDE.md`

| Ligne | Action |
|---|---|
| 43 | Supprimer la ligne `browser.storage.sync` et fusionner son contenu dans `browser.storage.local` |
| 44 | Enrichir le contenu et corriger `popupStatsCollapsed` -> `popupPinnedEmptyCollapsed` |
| 45 | Reformuler "sync drafts" en "profile auto-sync drafts" (clarte) |
| 47 | Renommer `useSyncedSettings` -> `useSettings`, `useSyncedState` -> `useStorageState` |
| 71 | id. dans la liste des hooks |
| 157 | Retirer la mention `chrome.storage.sync` |
