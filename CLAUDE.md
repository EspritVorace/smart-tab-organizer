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
- `npm test` - Run tests using Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:legacy` - Run legacy tests (node tests/runTests.js)

### Distribution
- `npm run zip` - Create Chrome distribution package
- `npm run zip:firefox` - Create Firefox distribution package

### Storybook
- `npm run storybook` - Start Storybook development server on port 6006
- `npm run build-storybook` - Build Storybook for production

## Architecture Overview

### Web Extension Framework
This is a browser extension built using the WXT framework, which provides a modern development experience for creating cross-browser extensions. The extension targets both Chrome (Manifest V3) and Firefox (Manifest V2).

### Entry Points
- `src/entrypoints/background.ts` - Background script handling extension logic
- `src/entrypoints/content.content.ts` - Content script for web page interaction
- `src/entrypoints/popup.html` - Extension popup interface
- `src/entrypoints/options.html` - Extension options/settings page

### Core Features
The extension provides tab organization through:
1. **Automatic Grouping** - Groups tabs based on domain rules and regex patterns
2. **Deduplication** - Prevents duplicate tabs using various matching modes
3. **Rule Management** - User-defined domain rules and regex presets
4. **Statistics Tracking** - Monitors grouping and deduplication actions

### Technology Stack
- **Framework**: WXT for extension development
- **Frontend**: Preact with TypeScript (optimized React alternative)
- **UI Components**: Radix UI themes with Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Theming**: next-themes for dark/light mode
- **Testing**: Vitest with Happy DOM environment
- **Documentation**: Storybook for component documentation
- **Optimization**: PostCSS with PurgeCSS for CSS optimization

### Schema Architecture
The application uses a schema-driven approach with Zod validation:
- `src/schemas/` - Contains all data validation schemas
- `src/types/` - TypeScript type definitions
- Schemas cover domain rules, logical groups, regex presets, and settings

### Key Directories
- `src/components/` - Preact components with Storybook stories
- `src/hooks/` - Custom Preact hooks for settings and statistics
- `src/utils/` - Utility functions for storage, i18n, and theme management
- `src/pages/` - Main page components (popup and options)
- `tests/` - Test files using Vitest framework

### Build Configuration
- Uses Vite as the build tool with Preact plugin
- TypeScript configuration in `tsconfig.json`
- WXT configuration in `wxt.config.ts` handles manifest generation and Preact aliases
- PostCSS configuration in `postcss.config.cjs` with PurgeCSS optimization
- Test configuration in `vitest.config.ts` with WxtVitest plugin

### Internationalization
Supports multiple languages (English, French, Spanish) with messages stored in `public/_locales/` following Chrome extension i18n standards.

## Code Conventions

### Storybook Exports
To avoid export name conflicts in Storybook, prefix all story exports with the component name:
- Use `ComponentNameDefault` instead of `Default`
- Use `ComponentNameDisabled` instead of `Disabled`
- Example: `DomainRuleCardDefault`, `DomainRuleCardDisabled`