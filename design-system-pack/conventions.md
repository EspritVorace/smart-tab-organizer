# Conventions

Extrait ciblé du `CLAUDE.md` du projet source. Les règles ci-dessous
sont celles que le design system cible doit respecter et refléter.

## Theming

Accent unique `indigo` (défaut Radix Themes). Le fichier
`theme/themeConstants.ts` conserve les constantes par feature pour
compat historique, mais **toutes pointent désormais sur `indigo`**.

Préférer systématiquement les tokens Radix aux couleurs hardcodées :

- `var(--accent-a3)`, `var(--accent-a6)`, `var(--accent-9)`,
  `var(--accent-11)`, etc.
- `var(--gray-a2)`, `var(--gray-11)`, etc.
- `var(--space-1)` à `var(--space-9)`
- `var(--radius-2)` à `var(--radius-4)`

Les wrappers dans `theme/Form.themes.tsx` restent en place (compat)
mais n'appliquent plus d'accent différencié.

## Internationalisation

Toujours utiliser `getMessage()` de `i18n/i18n.ts` :

- pour le texte UI,
- pour `aria-label`,
- pour `title`.

**Ne jamais hardcoder une chaîne utilisateur.** Les clés vivent dans
`public/_locales/{en,fr,es}/messages.json` (format Chrome MV3). Le
pack n'inclut que `en` mais le pattern est identique.

Pour le pluriel : `getPluralMessage(count, "keySingular", "keyPlural")`.

## Accessibilité

- Préférer les primitives Radix (`Dialog`, `Collapsible`, `Toolbar`,
  `RadioGroup`, `Tabs`) à une ré-implémentation ARIA manuelle.
- Les composants `@radix-ui/themes` (Switch, IconButton...) gèrent
  focus / clavier / ARIA nativement, ne pas les surcharger.
- Icônes Lucide : toujours `aria-hidden="true"`.
- Boutons icon-only : `aria-label` et `title` obligatoires.
- Règles CSS de focus custom uniquement pour du markup non-Radix
  (voir `theme/radix-themes.css`).

## Logging

- **Jamais** `console.log()` directement. Utiliser `logger.debug()`
  importé depuis un utilitaire dédié.
- Le logger est un no-op en production (`import.meta.env.MODE ===
  "production"`) pour garder la console propre.
- `console.warn()` et `console.error()` restent acceptables pour de
  vraies alertes / erreurs.

## Type Safety

Pas de `any`. Utiliser des types précis ou `unknown` avec narrowing.

## Organisation des composants

- **Core/** : logique métier liée à un concept domain (exclu de ce
  pack).
- **UI/** : layout et composants d'interface transverses.
- **Form/** : champs de formulaire réutilisables, callouts thématisés,
  theme providers.

## Storybook

- Titres qui miment l'arborescence :
  `Components/UI/StatusBadge/StatusBadge`.
- Chaque export préfixé par le nom du composant pour éviter les
  collisions : `StatusBadgeNew`, `StatusBadgeWarning`,
  `StatusBadgeDeleted`.
- CSF3 : `export const StoryName: Story = { args: { ... } }`.
- `tags: ['autodocs']` pour générer la doc auto.

## Style d'écriture

**Ne jamais utiliser de tiret cadratin (`—`, U+2014) ni de tiret
demi-cadratin (`–`, U+2013)** dans les contenus textuels (docs, UI,
commentaires, commit messages, PR descriptions, frontmatter).

Préférer une reformulation : parenthèses `(...)`, virgules, deux-points
`:`, ou phrases séparées.

Règle applicable au français, à l'anglais et à l'espagnol.
