# Smart Tab Organizer : Design System

> Version : 1.1.3. Synthese destinee a Claude Design (claude.ai/design) pour generer de nouveaux ecrans coherents avec l'extension. Toutes les regles proviennent du code source et de `CLAUDE.md`.

## 1. Visual Theme & Atmosphere

Extension navigateur multiplateforme (Chrome MV3, Firefox MV2) dediee a l'organisation d'onglets.

- **Ton** : productivite calme, pro, dense mais lisible.
- **Densite** : moyenne. Popup 420 px de large (compact), pages d'options plus aerees.
- **Ambiance** : technique et sobre, degrade subtil via les tokens d'alpha Radix (`--accent-a3`, `--gray-a2`).
- **Dark mode** : natif via `next-themes` (`ThemeProvider` a la racine), switcher utilisateur light / dark / system.
- **Framework UI** : [Radix Themes](https://www.radix-ui.com/themes) v3. Tous les composants visibles passent par les primitives Radix.
- **Framework applicatif** : React 18 + WXT (extension runtime), TypeScript strict.

## 2. Color Palette & Roles

Accent unique **`indigo`** sur toute l'app. Neutres Radix **`gray`**. Pas de palette custom.

### Tokens Radix utilises

| Token CSS | Usage |
|-----------|-------|
| `var(--accent-9)` | Couleur d'accent forte (focus ring, bouton primaire, switch on) |
| `var(--accent-a3)` | Fond teinte subtil pour etats actifs / selection |
| `var(--accent-11)` | Texte accent sur fond clair |
| `var(--gray-1)` a `var(--gray-12)` | Echelle neutre (fonds, bordures, textes) |
| `var(--gray-a2)`, `--gray-a3` | Surfaces cartes (hover, selection) |
| `var(--red-9)`, `--amber-9`, `--green-9` | Statuts (erreur, warning, succes) via `StatusBadge` |
| `var(--radius-3)` | Rayon standard cartes / inputs |

### Theme provider

```tsx
import { Theme } from '@radix-ui/themes';

<Theme appearance="inherit" accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
  {children}
</Theme>
```

`src/utils/themeConstants.ts` expose `FEATURE_THEMES` et `FEATURE_BASE_COLORS` : **tous pointent vers `indigo`**. Les wrappers par feature dans `src/components/Form/themes/index.tsx` (`DomainRulesTheme`, `SessionsTheme`, etc.) existent pour compat mais n'appliquent plus d'accent differencie.

### Regle

> Preferer les tokens Radix (`var(--accent-a3)`, `var(--gray-a2)`, etc.) aux couleurs hardcodees. Aucun hex direct dans les composants.

## 3. Typography Rules

Stack typographique Radix Themes par defaut (pas d'override de `font-family`). Font system de l'OS via la variable Radix.

### Echelle

Utiliser `<Text size="1">` a `<Text size="9">` et `<Heading size="1">` a `"9"` fournis par Radix.

| Usage | Composant |
|-------|-----------|
| Titre de page | `<Heading size="6">` |
| Titre de section | `<Heading size="4">` |
| Titre de carte | `<Text size="3" weight="medium">` |
| Corps | `<Text size="2">` |
| Meta / hint | `<Text size="1" color="gray">` |
| Label de form | `<Text size="2" weight="medium">` via `FieldLabel` |

### Regle

Ne pas utiliser `font-size` en CSS direct. Toujours passer par les props Radix.

## 4. Component Stylings

### 4.1 Form (`src/components/Form/`)

| Composant | Primitive Radix | Etats | Fichier |
|-----------|-----------------|-------|---------|
| `FormField` | `<Flex>` + `<Text>` | erreur, desactive | `Form/FormFields/FormField/` |
| `FieldLabel` | `<Text size="2" weight="medium">` | requis, desactive | `Form/FormFields/FieldLabel/` |
| `FieldError` | `<Text size="1" color="red">` | visible si erreur | `Form/FormFields/FieldError/` |
| `RadioGroupField` | `<RadioGroup>` Radix | default, checked, disabled | `Form/FormFields/RadioGroupField/` |
| `SearchableSelect` | `cmdk` + `<Popover>` Radix | closed, open, searching, empty | `Form/FormFields/SearchableSelect/` |
| `TagInputField` | `<TextField>` + tags Radix Badge | default, focus, tag hover | `Form/FormFields/TagInputField/` |
| `TextFieldWithCategory` | `<TextField>` + `<Select>` | default, focus, error | `Form/FormFields/TextFieldWithCategory/` |

Tous les champs acceptent `label`, `error`, `hint`, `required`, `disabled` et proxent les refs vers l'input natif.

### 4.2 UI primitives (`src/components/UI/`)

| Composant | Role | Primitive |
|-----------|------|-----------|
| `ConfirmDialog` | Confirmation destructive | `<AlertDialog>` Radix |
| `DialogShell` | Coque modale generique | `<Dialog>` Radix |
| `WizardModal` | Modal multi-etapes | `DialogShell` + `WizardStepper` |
| `WizardStepper` | Barre de progression | compose avec `<Flex>` |
| `SplitButton` | Bouton principal + dropdown | `<Button>` + `<DropdownMenu>` Radix |
| `StatusBadge` | Indicateur statut (ok, warn, error) | `<Badge>` Radix |
| `ThemeToggle` | Light / dark / system | `<IconButton>` + `<DropdownMenu>` + Lucide `Sun`, `Moon`, `Monitor` |
| `Toaster` | Notifications ephemeres | `@radix-ui/react-toast` |
| `AccessibleHighlight` | Surbrillance texte recherche | `<mark>` + styles Radix |
| `EmptyState` | Placeholder liste vide | `<Flex direction="column">` centre |

### 4.3 UI layout (`src/components/UI/`)

| Composant | Role |
|-----------|------|
| `PageLayout` | Conteneur principal (header + content + footer) |
| `Header` | En-tete de page avec titre + actions |
| `Sidebar` | Navigation laterale, collapsible |
| `OptionsLayout` | Wrapper specifique page Options |
| `PopupHeader`, `PopupToolbar`, `PopupProfilesList` | Surfaces popup 420 px |
| `ListToolbar` | Barre d'actions pour listes (ajout, filtres, tri) |
| `SettingsPage`, `SettingsToggles` | Conteneur reglages + groupes de toggles |
| `SessionWizards`, `ImportExportWizards` | Composes wizards multi-etapes |

### 4.4 Etats communs

Chaque composant doit gerer :

1. **Default**
2. **Hover** (pointer fine) : tokens `--accent-a4` / `--gray-a3`
3. **Focus visible** : outline `var(--accent-9)` 2 px offset negatif (deja traite nativement par Radix sauf pour `[role="row"][tabindex]` et `[data-session-card]`, voir `src/styles/radix-themes.css`)
4. **Active / pressed**
5. **Disabled** : opacity Radix + `cursor: not-allowed`
6. **Loading** (boutons d'action async) : spinner Lucide `Loader2` + bouton disabled

## 5. Layout Principles

- **Primitives** : `<Flex>`, `<Grid>`, `<Box>`, `<Container>`, `<Section>` de Radix Themes.
- **Gap** : via prop `gap` Radix (`"1"` a `"9"`), pas de marges custom.
- **Spacing scale** : Radix token `--space-1` (4 px) a `--space-9` (64 px).
- **Pages options** : `<Container size="3">` (1064 px max).
- **Popup** : largeur fixe 420 px, hauteur variable jusqu'a la limite du navigateur.
- **Cartes** : `<Card>` Radix, `padding="3"` standard, `padding="4"` sur pages d'options.

## 6. Depth & Elevation

Usage limite. Les tokens Radix disponibles : `--shadow-1` a `--shadow-6`.

| Niveau | Usage |
|--------|-------|
| `var(--shadow-2)` | `<Card>` Radix par defaut |
| `var(--shadow-4)` | Popover, dropdown |
| `var(--shadow-5)` | Dialog, AlertDialog |
| `var(--shadow-6)` | Toast |

**Ne pas** empiler les ombres ni ajouter de shadow CSS custom.

## 7. Do's and Don'ts

### Do

- **i18n partout** : toujours `getMessage()` depuis `src/utils/i18n.ts` pour labels, `aria-label`, `title`, placeholders. Les 3 locales (en, fr, es) doivent rester synchronisees.
- **Primitives Radix first** : Dialog, Collapsible, Toolbar, RadioGroup, DropdownMenu, Tooltip, Switch, IconButton. Laisser Radix gerer focus, clavier et ARIA.
- **Lucide icons** : toujours `aria-hidden="true"` sur les icones decoratives. Boutons icon-only : `<IconButton aria-label="..." title="...">`.
- **Tokens Radix** uniquement (`var(--accent-9)`, `var(--gray-a2)`, `var(--radius-3)`, `var(--space-3)`).
- **Typage strict** : pas de `any`. Preferer `unknown` + narrowing.
- **Storybook** : une story par composant, titres miroir dossier (`Components/UI/Header`), exports prefixes du nom (`HeaderDefault`, `HeaderLight`).

### Don't

- **Jamais de `console.log`** : utiliser `logger.debug()` (`src/utils/logger.ts`). `console.warn` / `console.error` autorises pour les vraies erreurs.
- **Jamais de string hardcodee** dans l'UI (ni labels, ni aria, ni title).
- **Jamais d'ARIA manuel** si une primitive Radix existe.
- **Jamais d'override de focus** sur les composants Radix (deja corrects). Custom CSS focus reserve aux elements non-Radix (voir `src/styles/radix-themes.css`).
- **Jamais de couleur hex** en dur. Toujours un token Radix.
- **Jamais de tiret cadratin** (U+2014) ni tiret demi-cadratin (U+2013) dans les textes. Preferer parentheses, virgules, ou deux-points.

## 8. Responsive Behavior

### Popup (420 px fixe)

- Pas de breakpoint horizontal, largeur figee.
- Scroll vertical uniquement, hauteur limitee par le navigateur (environ 600 px).
- Pas de sidebar. Navigation via tabs ou boutons compacts.
- Typographie reduite : `<Text size="2">` par defaut.

### Options page (adaptative)

- `<Container size="3">` pour centrer jusqu'a 1064 px.
- **Sidebar collapsible** (`Sidebar` UI) : visible >= 960 px, pliable au clic. En dessous : menu burger.
- Touch targets : 40 px minimum (Radix `size="2"` ou `"3"` pour les boutons sur les pages).
- Images / illustrations : aucune (seulement Lucide SVG inline).

### Storybook

Decorateur preview avec switchers locale (en / fr / es) et theme (light / dark / system) pour tester toutes les surfaces.

## 9. Agent Prompt Guide

Prompts types a passer a Claude Design apres onboarding :

### Generer une nouvelle page

> Cree une page `NotificationsPage` alignee sur le pattern de `SettingsPage` : container Radix, titre `<Heading size="6">`, liste de toggles groupes par categorie via `SettingsToggles`. Respecter l'accent `indigo`, i18n via `getMessage()`, tokens Radix uniquement.

### Varier un composant existant

> Genere une variante `compact` de `SessionCard` : hauteur 48 px, afficher uniquement le nom et la date, retirer le `HoverCard` metadata. Conserver le focus ring custom (`[data-session-card]:focus`).

### Ajouter un wizard

> Propose un wizard a 3 etapes pour l'export de profils : selection profils, options (format, inclure notes), confirmation. Base-toi sur `WizardModal` + `WizardStepper`. Chaque etape doit avoir un bouton Back et Next, le dernier etant un bouton primaire avec `<Loader2>` en loading.

### Refondre une surface popup

> Repense `PopupToolbar` pour tenir en 36 px de haut sur 420 px de large : icones Lucide `Plus`, `Search`, `Filter`, `Settings`. Chaque bouton : `<IconButton size="1" aria-label="..." title="...">`. Respecter les regles d'accessibilite Radix.

### Generer un ecran vide

> Genere un EmptyState pour la page Sessions : illustration Lucide `ArchiveRestore`, titre i18n `emptySessionsTitle`, texte `emptySessionsHint`, CTA primaire `emptySessionsCta`. Respecter le pattern de `EmptyState/`.

---

**Depot source** : voir dossiers `src/components/UI/`, `src/components/Form/`, `src/pages/` et `.storybook/` inclus dans le bundle pour les implementations de reference.
