# Système de raccourcis clavier

Documentation développeur du système de raccourcis. La page utilisateur
correspondante est générée dans `docs/src/content/docs/{,en/,es/}annexes/raccourcis-clavier.mdx`
via `pnpm shortcuts:doc`.

## Vue d'ensemble

Trois fichiers source vivent ici :

| Fichier | Rôle |
|---|---|
| `registry.ts` | Source de vérité unique : `SHORTCUTS_REGISTRY` mappe chaque ID à ses bindings, sa description i18n, son groupe d'affichage et son scope. |
| `types.ts` | Types `ShortcutScope`, `ShortcutGroupId`, `Binding`, `ShortcutEntry`. |
| `groups.ts` | Hiérarchie d'affichage (`GROUP_DESCRIPTORS`, `getDisplayTree(surface)`, `isGroupOpenByDefault`). |
| `getEffectiveBindings.ts` | Résolution des bindings (today: defaults; tomorrow: user overrides). |
| `overridesSchema.ts` | Schéma Zod réservé pour la future personnalisation. |

Côté hooks :

- `useShortcuts` (`src/hooks/useShortcuts.ts`) : façade publique. Tout code
  applicatif passe par lui. Dispatche combos simples et séquences, applique
  les filtres de scope (`widget:*`, `excludeIfInsideWidget`) et de contexte
  (`allowInTypingTarget`, `allowWhenDialogOpen`).
- `src/utils/keyboardShortcuts.ts` : utilitaires bas niveau (`parseCombo`,
  `serializeKeyEvent`, `matchesBinding`, `isSequencePrefix`,
  `isTypingTarget`, `isDialogOpen`, sélecteurs widget). Invocation directe
  réservée aux cas justifiés (ex. `ShortcutsDrawer` qui écoute en
  capture phase pour intercepter `?` malgré `allowWhenDialogOpen: false`).

## Ajouter un raccourci simple

```ts
// 1. Ajouter dans SHORTCUTS_REGISTRY (registry.ts)
'rules.duplicate': {
  id: 'rules.duplicate',
  defaultBindings: ['d'],
  descriptionKey: 'shortcutDescDuplicateRule',
  group: 'list-rules',
  scope: 'page:rules',
},
```

```jsonc
// 2. Ajouter shortcutDescDuplicateRule dans les 3 messages.json
{ "shortcutDescDuplicateRule": { "message": "Dupliquer la règle focus" } }
```

```tsx
// 3. Brancher l'action côté composant
useShortcuts(
  { 'rules.duplicate': () => duplicate(focusedRuleId) },
  { scope: 'page:rules' },
);
```

```bash
# 4. Régénérer la page Starlight
pnpm shortcuts:doc
```

## Ajouter une séquence

Une séquence est un tableau de combos. Elle doit comporter au moins 2 étapes
et la première touche ne doit jamais être utilisée comme combo simple
dans le même scope (sinon le timeout retarderait le simple).

```ts
'importexport.import.workspaces': {
  id: 'importexport.import.workspaces',
  defaultBindings: [['i', 'w']],
  descriptionKey: 'shortcutDescImportWorkspaces',
  group: 'importexport',
  scope: 'page:importexport',
},
```

`tests/shortcuts/registry.test.ts` vérifie que les préfixes `i` et `e` ne
sont pas réservés à des combos simples sur `page:importexport`.

## Ajouter un raccourci widget (carte focusée)

```ts
'sessionCard.archive': {
  id: 'sessionCard.archive',
  defaultBindings: ['a'],
  descriptionKey: 'shortcutDescSessionArchive',
  group: 'session-card',
  scope: 'widget:session-card',
},
```

Côté composant, le wrapper de carte doit porter
`data-shortcut-scope="widget:session-card"` et être focusable. `useShortcuts`
filtre déjà : seul l'événement dont `event.target` correspond au sélecteur
`[data-shortcut-scope="widget:session-card"]` déclenche le handler.

## Frontière registry vs handlers locaux

Va dans le registry tout ce qui est :

- documenté dans le panneau d'aide,
- utilisateur (apprenable, à mémoriser),
- destiné à figurer dans la doc Starlight.

Reste hors registry (handler local sur l'élément) :

- Enter/Escape sur un input de renommage en place,
- virgule pour valider un tag dans un combobox,
- navigation flèches dans une liste virtualisée
  (utiliser `useListNavigation`),
- drag and drop clavier piloté par `dnd-kit`.

## Personnalisation utilisateur (préparé, non livré)

`useShortcuts` lit ses bindings via `getEffectiveBindings(id)` au lieu de
`SHORTCUTS_REGISTRY[id].defaultBindings`. Aucun changement de comportement :
la fonction retourne les `defaultBindings` aujourd'hui. Une feature future
branchera la lecture sur `browser.storage.local['shortcutOverrides']`,
validée par `ShortcutOverridesSchema`. Aucun caller (composant, test) n'aura
besoin d'être modifié quand la personnalisation sera livrée.

## Régénérer la doc

```bash
pnpm shortcuts:doc
```

Génère trois fichiers MDX (`raccourcis-clavier.mdx` à la racine + `en/` + `es/`)
sous `docs/src/content/docs/annexes/`. Idempotent : 2 exécutions successives
produisent le même fichier. La CI (`.github/workflows/doc-scenarios.yml`)
exécute la commande puis vérifie via `git diff --exit-code` que le commit
contient la doc à jour.
