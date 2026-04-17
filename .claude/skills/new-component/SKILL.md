---
name: new-component
description: Rappelle les conventions obligatoires pour créer un nouveau composant React dans ce projet (Storybook, i18n, logger, theming, accessibilité)
user-invocable: false
---

Checklist obligatoire pour tout nouveau composant dans smart-tab-organizer :

## Emplacement
- `src/components/Core/` — logique métier liée à un concept domaine
- `src/components/UI/` — layout et composants inter-features
- `src/components/Form/` — champs de formulaire réutilisables, callouts thématiques

## Storybook
- Fichier `.stories.tsx` obligatoire dans le même dossier
- Titre : `Components/Core/<Feature>/<ComponentName>` (miroir du chemin)
- Préfixer tous les exports avec le nom du composant : `ComponentNameDefault`, `ComponentNameDisabled`

## Internationalisation
- Tous les textes via `getMessage(key)` depuis `src/utils/i18n.ts`
- Jamais de strings hardcodées dans le JSX
- Ajouter les nouvelles clés dans les 3 locales : `public/_locales/{en,fr,es}/messages.json`
- Format placeholder i18n : `$1`, `$2` (pas `{placeholder}`)

## Logging
- `logger.debug('[MON_MODULE] message', value)` depuis `src/utils/logger.ts`
- Jamais `console.log()` — c'est une no-op en production mais une violation de convention

## Accessibilité
- Icônes Lucide : toujours `aria-hidden="true"`
- Boutons icône only : `aria-label` + `title` obligatoires
- Préférer les primitives Radix (Dialog, Collapsible, Toolbar, RadioGroup) aux ARIA manuels

## Theming
- Une seule couleur d'accent : `indigo` (défaut Radix Themes). Ne pas introduire d'accent custom par feature.
- `src/utils/themeConstants.ts` est conservé pour compat mais toutes les valeurs sont `indigo` : ne pas s'appuyer dessus pour différencier des features.
- Utiliser les tokens Radix (`var(--accent-a3)`, `var(--gray-a2)`, etc.) plutôt que des couleurs hardcodées.

## CSS Modules (si hover actions)
```css
.row:hover .actions,
.row:focus-within .actions { opacity: 1; }
@media (pointer: coarse) { .actions { opacity: 1 !important; } }
```

## Types
- Pas de `any` — utiliser des types précis ou `unknown` avec narrowing
- Zod schemas dans `src/schemas/` si nouvelles entités persistées
