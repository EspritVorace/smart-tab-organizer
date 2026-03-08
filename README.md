[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a cross-browser extension to automatically group related tabs and prevent duplicates.

## Features

### Automatic Grouping
Middle-click or right-click > "Open link in new tab" to instantly place a tab in the right group based on your domain rules. Group names can be extracted from the page title, the URL, or a regex preset — with built-in presets for popular tools like Jira, GitLab, GitHub and Trello.

### Deduplication
Prevent the same page from being opened twice. The existing tab is re-focused and reloaded instead. Matching sensitivity is configurable per rule (exact URL, hostname + path, hostname, or includes).

### Sessions & Profiles
Save named snapshots of your open tabs and groups, then restore them at any time through a guided wizard that lets you pick which tabs to bring back and resolve conflicts before applying. Pin snapshots as persistent **profiles** — complete with a custom icon, auto-sync, and quick-access from the popup. A full session editor lets you reorganize, rename and delete tabs and groups without having to restore first.

### Options & Customization
Manage domain rules and regex presets with a card-based interface. Import and export rules as JSON through a multi-step wizard that automatically classifies incoming rules (new, conflicting, identical) and offers conflict resolution options. Configure deduplication mode per rule, track grouping statistics, and switch between Light, Dark and System themes.

### Quick Access Popup
Toggle grouping and deduplication globally, take a snapshot or jump to the Sessions page in one click. Pinned profiles are listed directly in the popup with their live status and quick-restore actions.

### Accessibility & i18n
Full keyboard navigation and screen-reader support throughout (built on Radix UI primitives). Available in English, French and Spanish.

## Installation

### Manual (Development / Testing)

1.  **Download:** Clone or download this project.
    ```bash
    git clone https://github.com/EspritVorace/smart-tab-organizer.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

#### Development Mode (with auto-reload)
3.  **Start development server:**
    ```bash
    npm run dev          # Chrome
    npm run dev:firefox  # Firefox
    ```

#### Production Build
3.  **Build the extension:**
    ```bash
    npm run build
    ```

#### Packaging for Distribution
3.  **Create distribution packages:**
    ```bash
    npm run zip          # Chrome
    npm run zip:firefox  # Firefox
    ```

#### Loading in Browser
4.  **Load in your browser:**
    * Chrome/Chromium: open `chrome://extensions/` → "Load unpacked" → `.output/chrome-mv3`
    * Firefox: open `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → `.output/firefox-mv2/manifest.json`

## Usage

1.  **Click the Icon:** To access the popup.
2.  **Configure:** Open "Options" to set your rules.
    * **Domain Rules:** Define for which sites to activate features.
    * **RegEx Presets:** Extract group names with regex (e.g. `([A-Z]+-\d+)` for Jira).
3.  **Browse:** Middle-click or right-click > "Open link in new tab" on configured sites.
4.  **Sessions:** Save a snapshot or create a persistent profile from the popup or options page.

## Testing

```bash
npm test                  # Unit tests
npm run test:wxt          # Unit tests (WXT-aware environment)
npm run test:e2e          # E2E tests (requires prior build)
npm run test:e2e:build    # Build then run E2E tests
npm run test:e2e:ui       # E2E tests with Playwright UI
npm run storybook         # Component documentation (port 6006)
```

## Tech Stack

* **WXT** — cross-browser extension framework (Chrome MV3 / Firefox MV2)
* **React + TypeScript**, **Radix UI Themes**, **React Hook Form**, **Zod**
* **Vitest** (unit) · **Playwright** (E2E) · **Storybook** (components)

## License

This project is licensed under the **GNU General Public License v3.0**.

---
