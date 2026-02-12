# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server for Chrome
- `npm run dev:firefox` - Start development server for Firefox
- `npm run build` - Production build for Chrome
- `npm run build:firefox` - Production build for Firefox
- `npm run compile` - TypeScript type checking without emitting files

### Testing
- `npm test` - Run unit tests using Vitest (112 tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:headed` - Run E2E tests in headed mode
- `npm run test:legacy` - Run legacy tests (node tests/runTests.js)

### Distribution
- `npm run zip` - Create Chrome distribution package
- `npm run zip:firefox` - Create Firefox distribution package

### Storybook
- `npm run storybook` - Start Storybook development server on port 6006
- `npm run build-storybook` - Build Storybook for production

## Architecture Overview

### Web Extension Framework
This is a cross-browser extension built using the WXT framework. It targets Chrome (Manifest V3) and Firefox (Manifest V2).

### Entry Points
- `src/entrypoints/background.ts` - Background script entry point (delegates to modular code)
- `src/entrypoints/content.content.ts` - Content script for web page interaction
- `src/entrypoints/popup.html` - Extension popup interface
- `src/entrypoints/options.html` - Extension options/settings page

### Background Script Architecture
The background logic is modularized in `src/background/`:
- `index.ts` - Main exports and initialization
- `grouping.ts` - Tab grouping logic based on domain rules
- `deduplication.ts` - Duplicate tab prevention
- `event-handlers.ts` - Browser event listeners
- `messaging.ts` - Communication between extension parts
- `settings.ts` - Settings management utilities

### Core Features
The extension provides tab organization through:
1. **Automatic Grouping** - Groups tabs based on domain rules and regex patterns
2. **Deduplication** - Prevents duplicate tabs using various matching modes
3. **Rule Management** - User-defined domain rules and regex presets
4. **Import/Export Wizard** - Multi-step wizard for importing/exporting domain rules with rule classification (new, conflicting, identical), conflict resolution modes, and Zod-validated JSON parsing
5. **Statistics Tracking** - Monitors grouping and deduplication actions

### Technology Stack
- **Framework**: WXT for extension development
- **Frontend**: React with TypeScript
- **UI Components**: Radix UI Themes with Radix primitives and Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Theming**: next-themes for dark/light mode
- **Unit Testing**: Vitest with Happy DOM environment
- **E2E Testing**: Playwright
- **Documentation**: Storybook for component documentation

### Schema Architecture
The application uses a schema-driven approach with Zod validation:
- `src/schemas/` - Contains all data validation schemas (DomainRule, enums, importExport)
- `src/schemas/importExport.ts` - Relaxed Zod schema for import validation (no form-level refinements)
- `src/types/` - TypeScript type definitions that extend Zod-inferred types
- Pattern: Schema types (e.g., `DomainRule`) are extended with runtime fields (e.g., `DomainRuleSetting` adds `enabled` and `badge`)

### Storage Pattern
Two storage backends are used:
- **`browser.storage.sync`** - Synced settings (domain rules, grouping/deduplication toggles, notification prefs). Managed via `useSyncedSettings` hook in `src/hooks/`.
- **`browser.storage.local`** - Per-device UI preferences (e.g., `popupStatsCollapsed`). Not synced across browsers.

The `useSyncedSettings` hook uses refs to prevent race conditions between local updates and storage events.

### Static Data
- Regex presets are stored in `public/data/presets.json` (not user-editable, loaded at runtime)
- Default settings in `public/data/default_settings.json`

### Key Directories
- `src/components/` - React components with Storybook stories, organized by category:
  - `src/components/Core/` - Business logic components (DomainRule, RegexPreset, Statistics)
  - `src/components/UI/` - User interface components (Header, PopupHeader, Sidebar, SettingsToggles, ThemeToggle, PageLayout)
  - `src/components/Form/` - Form and utility components (FormFields, themed-callouts, themes)
- `src/hooks/` - Custom React hooks for settings and statistics
- `src/utils/` - Utility functions for storage, i18n, theme management, and import classification
- `src/pages/` - Main page components (popup and options)
- `src/styles/` - Global CSS (Radix Themes import, custom focus styles)
- `tests/` - Unit test files using Vitest
- `e2e/` - End-to-end tests using Playwright

### Build Configuration
- Uses Vite as the build tool with React plugin
- TypeScript configuration in `tsconfig.json`
- WXT configuration in `wxt.config.ts` handles manifest generation and build settings
- Unit test configuration in `vitest.simple.config.ts`
- E2E test configuration in `playwright.config.ts`

### Internationalization
Supports multiple languages (English, French, Spanish) with messages stored in `public/_locales/` following Chrome extension i18n standards. The `lang` attribute on `<html>` is set dynamically at runtime via `browser.i18n.getUILanguage()`.

### Feature Theming
Each feature has a consistent color theme defined in `src/utils/themeConstants.ts`:
- `DOMAIN_RULES` → purple
- `REGEX_PRESETS` → cyan
- `IMPORT` → jade
- `EXPORT` → teal
- `STATISTICS` → orange

Theme wrappers in `src/components/Form/themes/` apply accent colors contextually.

## Code Conventions

### Component Organization
Components are organized into three main categories that reflect their purpose and usage:

- **Core Components** (`src/components/Core/`): Business logic and domain-specific components
  - DomainRule/ - Domain rule management (DomainRuleCard, DomainRuleFormModal)
  - RegexPreset/ - Regex preset management (RegexPresetCard, RegexPresetDialog)
  - Statistics/ - Application statistics display (uses Radix Collapsible)

- **UI Components** (`src/components/UI/`): User interface and layout components
  - Header/ - Page headers
  - PopupHeader/ - Extension popup headers
  - PageLayout/ - Options page layout wrapper
  - ImportExportPage/ - Import/export cards and wizard dialogs (ExportWizard, ImportWizard)
  - WizardStepper/ - Reusable multi-step visual stepper component
  - Sidebar/ - Navigation sidebar with multiple sub-components
  - SettingsToggles/ - Settings control components
  - ThemeToggle/ - Theme switching functionality

- **Form Components** (`src/components/Form/`): Form fields, themes, and utility components
  - FormFields/ - Reusable form field components (FormField, FieldLabel, FieldError, RadioGroupField)
  - themed-callouts/ - Themed notification components
  - themes/ - Theme provider and styling components

### Storybook Organization
Storybook stories follow the folder structure with titles like:
- `Components/Core/DomainRule/DomainRuleCard`
- `Components/UI/Sidebar/Sidebar`
- `Components/Form/FormFields/FormField`

### Storybook Exports
To avoid export name conflicts in Storybook, prefix all story exports with the component name:
- Use `ComponentNameDefault` instead of `Default`
- Use `ComponentNameDisabled` instead of `Disabled`
- Example: `DomainRuleCardDefault`, `DomainRuleCardDisabled`

## Development Best Practices

### Type Safety
- Avoid `any()` for types to maintain strong type checking

### Accessibility
- **Use Radix primitives for interactive patterns** instead of hand-rolling ARIA attributes and keyboard handlers. Key primitives available (transitive deps of `@radix-ui/themes`):
  - `@radix-ui/react-collapsible` - For expand/collapse sections (used in Statistics)
  - `@radix-ui/react-toolbar` - For toolbar keyboard navigation patterns
  - `@radix-ui/react-dialog` - For modals
- **Radix Themes components** (Switch, IconButton, Checkbox, etc.) already handle focus rings, keyboard navigation, and ARIA natively. Don't override their focus styles with custom CSS.
- **Independent toggles** (e.g., two Switch components) use Tab navigation between them. Arrow keys are only for RadioGroup or Toolbar patterns.
- **Decorative icons** from lucide-react should have `aria-hidden="true"`. Icons inside `IconButton` with `aria-label` are also decorative.
- **`title` attribute** on icon-only buttons provides visible tooltip on hover. Always pair with `aria-label` for screen readers.
- **i18n for ARIA labels**: Use `getMessage()` for all `aria-label` and `title` attributes, never hardcode English strings.
- **Custom CSS for focus** is only needed for non-Radix markup (e.g., `[role="row"]` cards in DomainRulesPage). See `src/styles/radix-themes.css`.
