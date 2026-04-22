# Onboarding Prompt — Design System

À utiliser pendant l'onboarding Claude Design, quand Claude ingère le
contenu de ce repo / dossier pour construire sa représentation interne
du design system.

Pour un brief projet (page à générer), voir `DASHBOARD_BRIEF.md` ou
les briefs spécifiques à venir.

---

## Contexte

Tu reçois le design system d'une extension navigateur (Chrome MV3 +
Firefox MV2, framework WXT). La stack UI repose sur :

- React 18 + `@radix-ui/themes` 3.2 (accent unifié `indigo`,
  radius / scaling par défaut),
- `next-themes` pour light / dark / system,
- Storybook 9 (CSF3, `tags: ['autodocs']`, toolbar locale + theme),
- `lucide-react` pour les icônes, `cmdk` pour le searchable select,
  `react-hook-form` pour les forms, `@dnd-kit/react` pour le
  drag-and-drop.

Aucun Tailwind, aucun `tokens.json` propriétaire. Tout repose sur les
CSS variables Radix : `var(--accent-a3)`, `var(--accent-9)`,
`var(--accent-11)`, `var(--gray-a2)`, `var(--gray-11)`,
`var(--space-1..9)`, `var(--radius-2..4)`.

i18n via `browser.i18n.getMessage` (pattern Chrome MV3, catalogues
JSON dans `_locales/{en,fr,es}/messages.json`). Le pack fournit la
locale EN.

## Ce que le pack contient

| Dossier / fichier | Rôle |
|---|---|
| `theme/themeConstants.ts` | Constantes par feature (toutes `indigo` aujourd'hui) |
| `theme/radix-themes.css` | Import Radix + resets a11y + focus rings |
| `theme/Form.themes.tsx` | 7 wrappers de thème (compat historique, tous `indigo`) |
| `storybook/main.ts` + `preview.tsx` | Config + mock `wxt/browser` + toolbar locale / theme |
| `i18n/i18n.ts` + `messages.en.json` | Utilitaire `getMessage` + plural |
| `samples/atomic/StatusBadge` | Pattern atomique : mapping enum → Badge + i18n |
| `samples/form/{FormField,FieldLabel,FieldError}` | Pattern form compound |
| `samples/layout/PageLayout` | Layout de page : header gradient + description + content |
| `samples/composed/EmptyState` | Primitive état vide |
| `samples/composition/SessionCard` | **Domain-locked**, inclus pour les patterns HoverCard metadata + inline rename + sortable |
| `samples/composition/DomainRuleCard` | **Domain-locked**, inclus pour le pattern `useSortable` + DropdownMenu + Card |
| `conventions.md` | Règles de code (theming, i18n, a11y, style) |
| `package.excerpt.json` | Dépendances UI pertinentes (référence, pas install) |
| `tsconfig.json` | Paths alias `@/*`, `moduleResolution: "bundler"` |

## Objectif de l'onboarding

Construis une représentation interne du design system qui te permette,
dans les projets suivants, de :

1. **Produire du code React + Radix Themes idiomatique** : utiliser
   `<Card>`, `<Flex>`, `<Box>`, `<Grid>`, `<Heading>`, `<Text>`,
   `<Button>`, `<IconButton>`, `<Badge>`, `<Switch>`, `<Separator>`,
   `<Tooltip>`, `<DropdownMenu>`, `<HoverCard>`, `<Dialog>`,
   `<Collapsible>`, `<RadioGroup>` plutôt que du markup custom.
2. **Respecter le token system** : jamais de couleur hardcodée, toujours
   `var(--accent-*)`, `var(--gray-*)`, `var(--space-*)`, `var(--radius-*)`.
3. **Intégrer l'i18n dès la génération** : toutes les chaînes passent
   par `getMessage('clé')`, y compris `aria-label` et `title`. Pour
   Claude Design, si tu génères un prototype visuel avec du texte
   statique, marque chaque chaîne d'un commentaire `// i18n: clé` pour
   faciliter l'extraction ultérieure.
4. **Respecter l'accessibilité** : icônes Lucide avec
   `aria-hidden="true"`, boutons icon-only avec `aria-label` + `title`,
   préférer les primitives Radix à l'ARIA manuel, focus rings visibles
   sur le markup custom (voir `radix-themes.css`).
5. **Traiter les composants de `samples/composition/`** comme des
   **patterns à abstraire**, pas à copier tels quels. Leurs noms
   (`SessionCard`, `DomainRuleCard`) sont domain-locked. Quand tu
   réutilises ces patterns dans un projet, renomme et découple du
   domaine.

## Contraintes non-négociables

- Pas de tiret cadratin (`—`, U+2014) ni demi-cadratin (`–`, U+2013)
  dans le code, les commentaires, les textes UI, les stories, les
  commits. Reformuler avec parenthèses, virgules, deux-points.
- Pas de `console.log` dans le code livré. Utiliser un logger no-op
  en prod.
- Pas de `any` TypeScript. Types précis ou `unknown` avec narrowing.
- Pas d'emoji dans les livrables code et UI (tolérés dans les docs /
  README seulement si l'utilisateur le demande).
- Accent accent unique au niveau du `<Theme>` root Radix, pas de
  variation par feature.

## Exports attendus pour les projets

Quand tu génères une page ou un composant à partir de ce DS :

- Fichier `.tsx` prêt à coller dans `src/pages/` ou
  `src/components/**/`.
- Fichier `.stories.tsx` CSF3 associé avec `tags: ['autodocs']` et
  des exports préfixés par le nom du composant.
- Liste des clés i18n nouvelles à ajouter dans
  `public/_locales/{en,fr,es}/messages.json`.
- Snippet de diff pour les fichiers de routing / sidebar impactés
  (ex : `src/pages/options.tsx`).
- Si un export HTML standalone est produit (Claude Design Canvas),
  conserver les contraintes ci-dessus.
