# Brief : Design System Starter à partir de cette extension

## Contexte

Extension navigateur (Chrome MV3 + Firefox MV2, framework WXT).
Stack UI actuelle : React 18 + @radix-ui/themes 3.2 + next-themes +
Storybook 9.

Le design system actuel de l'extension se résume à :

- un accent `indigo` unifié (les wrappers par feature existent mais
  pointent tous sur `indigo`, vestige à nettoyer),
- des composants fins par-dessus Radix Themes,
- un i18n branché sur `browser.i18n.getMessage` (pattern Chrome MV3,
  3 locales EN / FR / ES, ~165 clés),
- aucun Tailwind, aucun fichier `tokens.json`, tout repose sur les
  CSS variables Radix (`var(--accent-*)`, `var(--space-*)`,
  `var(--radius-*)`, `var(--gray-*)`).

Ce que je te fournis dans ce pack :

- `theme/` : tokens actuels, styles globaux, theme wrappers,
- `storybook/` : config + mock `wxt/browser`,
- `i18n/` : utilitaire + catalogue EN,
- `samples/{atomic,form,layout,composed}/` : 4 composants
  représentatifs (atomique, form, layout, état vide) avec leurs
  stories,
- `samples/composition/` : 2 composants **domain-locked** (`SessionCard`,
  `DomainRuleCard`) fournis pour leurs **patterns de composition**, pas
  pour être copiés. Voir section dédiée plus bas.
- `conventions.md` : règles de code,
- `package.excerpt.json` : dépendances UI pertinentes.

## Objectif

Produis un **design system réutilisable, domain-agnostic**, nommé
`StoUI` (nom configurable). Il doit :

1. **Tokens**. Extraire et généraliser couleurs / radius / spacing /
   typography en **CSS variables** (`--sto-color-*`, `--sto-space-*`,
   `--sto-radius-*`, `--sto-font-*`) qui mappent sur Radix mais
   restent échangeables. Livrer un fichier `theme/tokens.css` et un
   `theme/scales.ts` TypeScript avec les scales typées.

2. **ThemeProvider**. Wrapper autonome, **n'impose pas** `next-themes`.
   Accepte `appearance: "light" | "dark" | "system"` et
   `accent?: RadixColor`. Gère la persistance en interne via une
   option `storageKey`. Expose un hook `useTheme()`.

3. **Composants prioritaires** (API TS typée, variants + sizes
   strictement typés, compound components quand pertinent) :
   - `Button`, `IconButton`, `SplitButton`
   - `Badge` et `StatusBadge` (générique, pas enum-locked : l'actuel
     est couplé à un enum métier, à découpler)
   - `EmptyState`
   - `PageLayout` (header avec gradient + description + zone content)
   - `FormField` + `FieldLabel` + `FieldError` (compatible
     `react-hook-form` sans le forcer)
   - `Dialog` / `ConfirmDialog` shell
   - `Toaster` (au-dessus de `@radix-ui/react-toast`)

4. **Storybook**. Chaque composant a `.stories.tsx` CSF3 avec
   `tags: ['autodocs']`, variants exhaustives. Toolbar globale pour
   thème (light/dark) et locale comme dans le `preview.tsx` fourni.
   Fournir un utilitaire `@sto-ui/i18n-mock` pour mocker
   `browser.i18n` en Storybook.

5. **i18n**. Le design system **n'impose pas** de moteur i18n. Il
   accepte soit une prop `t?: (key: string) => string` sur les
   composants qui en ont besoin, soit un `I18nProvider` optionnel.
   Fallback : afficher la clé brute. Livrer un adaptateur exemple
   `browserI18nAdapter.ts` pour les consommateurs sous WXT.

6. **Accessibilité**. Focus rings cohérents (CSS var commune,
   `--sto-focus-ring`). `aria-label` + `title` obligatoires sur les
   boutons icon-only. Icônes Lucide toujours `aria-hidden="true"`.
   Support clavier complet via les primitives Radix.

## Contraintes non-négociables

- **Pas** de tiret cadratin (`—`, U+2014) ni demi-cadratin (`–`,
  U+2013) dans les docs, commentaires, JSDoc, exemples, commit
  messages. Reformuler : parenthèses, virgules, deux-points.
- **Pas** de `console.log`. Fournir un `logger` no-op en prod
  (`import.meta.env.MODE === "production"`).
- **Pas** de `any` en TypeScript. Utiliser `unknown` + narrowing si
  nécessaire.
- **Pas** d'accent différencié par feature. Accent unique au niveau
  du `ThemeProvider`, exposable en prop, pas 7 wrappers comme
  actuellement.
- **Ne pas** copier la logique métier de l'extension (tabs, sessions,
  domain rules, dedup, regex presets). Le design system reste
  domain-agnostic.
- Emojis interdits dans les fichiers livrés (docs, code, stories),
  sauf demande explicite.

## Livrables attendus

```
sto-ui/
  package.json                 # peerDeps: react, react-dom,
                               # @radix-ui/themes
  tsconfig.json
  .storybook/
    main.ts
    preview.tsx
  src/
    theme/
      tokens.css
      scales.ts
      ThemeProvider.tsx
      useTheme.ts
      index.ts
    components/
      Button/Button.tsx + Button.stories.tsx + index.ts
      IconButton/...
      SplitButton/...
      Badge/...
      StatusBadge/...
      EmptyState/...
      PageLayout/...
      FormField/(FormField + FieldLabel + FieldError).tsx + stories
      Dialog/...
      ConfirmDialog/...
      Toaster/...
    i18n/
      I18nProvider.tsx
      useTranslate.ts
      browserI18nAdapter.ts
    index.ts                   # barrel export
  README.md                    # Getting started + migration depuis
                               # un usage direct de @radix-ui/themes
```

## Livrables secondaires

- **Guide de migration** : pour chaque composant livré, un snippet
  avant/après montrant comment remplacer l'usage direct de
  `@radix-ui/themes` par `@sto-ui/*` dans l'extension source. Minimum
  pour `StatusBadge` et `PageLayout`.
- **Checklist d'intégration WXT** : imports CSS (ordre), Storybook
  static dir, alias path `@/*`, mock `wxt/browser`.

## Traitement spécial de `samples/composition/`

Les deux fichiers `SessionCard.tsx` et `DomainRuleCard.tsx` sont
**domain-locked** : ils manipulent des concepts métier (session
d'onglets, règle de regroupement par domaine) que le design system
**ne doit pas** connaître.

Ils sont inclus pour leurs **patterns de composition**, pas pour être
portés. Ton travail sur ces deux fichiers :

1. **Extraire les primitives réutilisables** qu'ils utilisent :
   - Card sortable via `@dnd-kit/react/sortable` (handle drag,
     `isDragging`, opacity/z-index). À produire : `SortableCard`
     ou `SortableListItem`.
   - `HoverCard` metadata (trigger = contenu principal, content =
     info enrichie avec Badge + Text). À produire : `HoverCardMeta`
     ou un compound component autour de Radix `HoverCard`.
   - Inline rename (double-clic pour passer en édition, Enter pour
     valider, Escape pour annuler, autofocus + select-all). À
     produire : `InlineEditableText`.
   - Action menu via `DropdownMenu` de Radix Themes sur icon-only
     trigger. À produire : éventuellement un `CardActionMenu`
     helper.

2. **Ne pas** reproduire le vocabulaire métier. Aucun composant du DS
   livré ne doit s'appeler `SessionCard`, `DomainRuleCard`,
   `TabCard`, `RuleBadge`, etc. Les noms doivent être
   domain-agnostic.

3. **Ne pas** copier la logique métier (états `isPinned`,
   `profileId`, conflict resolution, regex matching, group color,
   etc.). Ces props sont des artefacts de l'extension.

4. **Documenter l'extraction** : pour chaque primitive extraite,
   fournir un exemple « avant / après » dans le guide de migration
   montrant comment réimplémenter `SessionCard` en consommant les
   primitives du DS plus de la glue métier côté extension.

## Ce que tu ignores volontairement

- Animations avancées : laisser à Radix.
- Composants complexes non fournis en sample (SearchableSelect
  basé sur cmdk, TreeView, Wizards multi-étapes). Proposer
  éventuellement une API preview dans le README, sans les
  implémenter.
- Intégration tests (Vitest, Playwright, Testing Library) : hors
  scope de cette itération.
- Internationalisation FR / ES : le fichier EN suffit pour démontrer
  le pattern.

## Format de réponse attendu

1. Arborescence complète du repo livré.
2. Code de chaque fichier, prêt à coller.
3. README avec exemples d'utilisation runnables.
4. Guide de migration synthétique à la fin.
