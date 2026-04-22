# Design System Starter Pack

Pack de contexte destiné à Claude Design (ou tout outil de génération de
design system). Extrait de l'extension navigateur **Smart Tab Organizer**
(Chrome MV3 / Firefox MV2, framework WXT).

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

1. Ouvrir Claude Design.
2. Uploader le zip de ce dossier (ou pointer le dossier si l'outil
   l'accepte).
3. Coller le contenu de `PROMPT.md` comme instruction initiale.
4. Les fichiers du pack servent de contexte.

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
