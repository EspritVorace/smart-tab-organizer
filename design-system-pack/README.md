# Design System Starter Pack

Pack de contexte destiné à Claude Design (onboarding du design system).
Extrait de l'extension navigateur **Smart Tab Organizer** (Chrome MV3 /
Firefox MV2, framework WXT).

## Usage prévu

1. **Onboarder Claude Design** avec ce dossier (via connexion codebase
   ou upload). Il construit sa représentation du DS.
2. **Générer des pages internes à l'extension** (ex : Dashboard) qui
   respectent le DS. Voir `DASHBOARD_BRIEF.md` pour le premier brief
   projet.

Ce n'est **pas** un pack pour produire un site marketing ou une
homepage web : les pages générées s'ajoutent au même niveau que
`DomainRulesPage`, `SessionsPage`, `StatisticsPage`,
`ImportExportPage`, `SettingsPage` dans `src/pages/`.

## À quoi sert ce pack

Il contient uniquement l'ADN visuel et technique actuel :

- tokens et theming,
- configuration Storybook,
- utilitaire i18n et catalogue EN,
- 4 composants représentatifs (atomique, form, layout, état vide) avec
  leurs stories,
- conventions de code.

Tout le reste (métier : background worker, schemas Zod, pages sessions,
domain rules, tab tree, popup, import/export, docs Astro, tests unitaires,
tests E2E Playwright) a été délibérément exclu.

## Stack

| Élément | Version |
|---|---|
| React | 18.3 |
| @radix-ui/themes | 3.2.1 (accent unique `indigo`) |
| next-themes | 0.4 (light / dark / system) |
| Storybook | 9.1 (CSF3, autodocs) |
| lucide-react | 0.522 |
| cmdk | 1.1 |
| react-hook-form | 7.58 |
| WXT | 0.20 (build extension, hors scope DS) |

Aucun Tailwind, aucun `tokens.json`. Tout passe par les CSS variables
Radix Themes (`var(--accent-*)`, `var(--space-*)`, `var(--radius-*)`,
`var(--gray-*)`).

## Structure

```
design-system-pack/
├── README.md                  # ce fichier
├── PROMPT.md                  # brief à coller dans Claude Design
├── conventions.md             # règles de code extraites du CLAUDE.md
├── package.excerpt.json       # deps UI (référence, pas pour install)
├── tsconfig.json              # paths alias @/*, moduleResolution bundler
│
├── storybook/
│   ├── main.ts                # mock wxt/browser + stories glob
│   └── preview.tsx            # toolbar locale (EN/FR/ES) + theme (light/dark)
│
├── theme/
│   ├── radix-themes.css       # import Radix + resets + focus rings a11y
│   ├── themeConstants.ts      # FEATURE_THEMES (toutes indigo)
│   └── Form.themes.tsx        # 7 Theme wrappers (actuellement tous indigo)
│
├── i18n/
│   ├── i18n.ts                # getMessage + getPluralMessage
│   └── messages.en.json       # ~165 clés, pattern Chrome MV3
│                              # (FR/ES existent, même structure, non inclus
│                              # pour alléger le pack)
│
└── samples/
    ├── atomic/                # StatusBadge + stories
    ├── form/                  # FormField + FieldLabel + FieldError + stories
    ├── layout/                # PageLayout + stories (header gradient)
    ├── composed/              # EmptyState + stories
    └── composition/           # Patterns de composition avancés (domain-locked)
                               # SessionCard : HoverCard metadata + inline rename
                               #               + @dnd-kit sortable
                               # DomainRuleCard : @dnd-kit sortable + HoverCard
                               #                  + DropdownMenu + Badge
                               # À ABSTRAIRE, pas à copier tel quel
```

## Points clés à retenir pour qui génère le design system

1. **L'accent est unifié `indigo`** dans toute l'extension. Les wrappers
   par feature (`DomainRulesTheme`, `SessionsTheme`, etc.) existent par
   héritage historique mais pointent tous sur `indigo`. Le design system
   cible doit exposer un seul accent configurable au niveau
   `ThemeProvider`, pas 7 wrappers.

2. **i18n est obligatoire partout** : UI text, `aria-label`, `title`.
   Dans l'extension, `getMessage` wrappe `browser.i18n.getMessage` de WXT.
   Le design system cible doit rester agnostique : accepter un prop
   `t?: (key: string) => string` ou un `I18nProvider` optionnel, fallback
   afficher la clé.

3. **Accessibilité** : préférer les primitives Radix (`Dialog`,
   `Collapsible`, `Toolbar`, `RadioGroup`) plutôt que ré-implémenter
   l'ARIA. Icônes Lucide toujours `aria-hidden="true"`. Boutons icon-only
   exigent `aria-label` + `title`.

4. **Conventions de style** : pas de tiret cadratin (`—`) ni demi-cadratin
   (`–`) dans quoi que ce soit. Pas de `console.log`, passer par un
   `logger` no-op en prod. Pas de `any`. Voir `conventions.md`.

5. **Storybook** : CSF3 strict, `tags: ['autodocs']`, titres qui miment
   l'arborescence (`Components/UI/StatusBadge/StatusBadge`), et chaque
   export préfixé par le nom du composant (`StatusBadgeNew`,
   `StatusBadgeWarning`) pour éviter les collisions d'ID.

## Comment utiliser le pack

1. Pousser ce dossier comme **repo Git standalone** (le pack est
   préparé pour ça, voir `../design-system-pack-repo/` généré par le
   script d'extraction).
2. Dans Claude Design, onboarder le design system en pointant ce repo
   (workflow « codebase » documenté).
3. Coller `PROMPT.md` comme instruction d'onboarding si l'UI le
   permet, sinon laisser Claude Design inférer depuis les fichiers.
4. Pour générer la page Dashboard : ouvrir un nouveau projet dans
   Claude Design, coller le contenu de `DASHBOARD_BRIEF.md` comme
   brief projet.

Alternative sans repo Git : uploader les fichiers individuellement
(images, DOCX, PPTX supportés ; ZIP non documenté). Moins fluide.

## Ce qui N'EST PAS dans le pack (volontairement)

- `docs/` site Astro Starlight (13 MB, sans valeur pour un DS).
- `tests/` unitaires et `tests/e2e/` Playwright.
- `src/background/`, `src/entrypoints/background.ts`,
  `src/entrypoints/content.content.ts`.
- `src/schemas/` Zod métier.
- `src/components/Core/{Statistics,TabTree}` et le reste de `Session/`
  et `DomainRule/` : domain-locked. Seuls `SessionCard` et
  `DomainRuleCard` sont inclus dans `samples/composition/` comme
  patterns à abstraire.
- `src/components/UI/{PopupHeader,PopupToolbar,PopupProfilesList,
  ImportExportWizards,SessionWizards,Sidebar,SettingsPage,
  SettingsToggles,OptionsLayout}` : trop spécifiques à l'extension.
- `public/data/*.json` (presets regex, default settings).
- `pnpm-lock.yaml`, `node_modules/`, `.output/`, `.wxt/`.
- Les locales FR et ES de `messages.json` (même structure que EN, non
  requis pour comprendre le pattern).
