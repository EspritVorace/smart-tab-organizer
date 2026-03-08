[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a cross-browser extension designed to help you efficiently manage your browser tabs by automatically grouping related tabs and preventing duplicates.

## Features

### Automatic Grouping
* Middle-click a link or right-click and choose "Open link in new tab" to open the tab in the proper group if its domain matches your rules.
* Tabs join an existing group or a new one is created.
* The group name can come from the opener tab's title, from its URL or you can be prompted manually.
* Built-in RegEx presets for popular ticket systems (Jira, GitLab, GitHub, Trello, etc.).

### Deduplication
* Opening the same URL twice is prevented.
* The existing tab is re-focused and reloaded.
* Supports several matching modes: exact URL, hostname + path, hostname or simple "includes".

### Sessions & Profiles
* **Session Snapshots** — Save your current open tabs (including tab groups) as a named snapshot with a guided wizard. System tabs are automatically excluded.
* **Profiles** — Pin any snapshot as a persistent profile. Profiles appear at the top of the list and in the popup for quick access. Assign a custom icon from 10 available options.
* **Session cards** — Each session card shows tab count, group count, color badges and last update date. Double-click the name to rename it inline (Enter to confirm, Escape to cancel).
* **Restore** — Split button with one-click quick restore (current window or new window) or a full **Restore Wizard** to select which tabs to restore, pick a target window, and resolve conflicts (duplicate tabs, group name collisions) before applying.
* **Session Editor** — Open any saved session in an interactive editor: rename the session, edit or delete individual tabs, edit tab URLs, rename groups, delete groups (with their tabs or by ungrouping), and move tabs between groups. A confirmation guard prevents accidental data loss when closing with unsaved changes.
* **Auto-sync** *(profiles only)* — Enable auto-sync on a profile to automatically capture your open tabs periodically and persist them when you close the window. A background alarm manages the sync lifecycle; a guard prevents overwriting a profile while its editor is open.
* **Profile ↔ Window exclusivity** — Each profile tracks which browser window it is open in. The restore wizard warns you if a profile is already open in another window, and the popup reflects each profile's live status (open here / open elsewhere / closed).

### Options & Customization
* Add, edit, delete and enable/disable domain rules.
* Manage custom and predefined RegEx presets with an intuitive card-based interface.
* **Import/Export Wizard** for domain rules:
  * Export: select individual rules, save as JSON file or copy to clipboard.
  * Import: load from file (drag & drop) or paste JSON, with Zod validation.
  * Automatic classification of imported rules (new, conflicting, identical).
  * Conflict resolution: overwrite, duplicate or ignore, with side-by-side diff view.
* Configure deduplication modes per rule.
* View statistics (groups created and tabs deduplicated) and reset them.
* Select Light, Dark or System theme.

### Quick Access Popup
* Toggle grouping and deduplication globally.
* View key statistics at a glance (collapsible section with persisted state).
* **Save** button to instantly open the snapshot wizard.
* **Restore** button to navigate to the Sessions section.
* **Profiles list** — Pinned profiles are listed in the popup with their live status and quick restore actions.
* Shortcut to the options page.

### Accessibility
* Full keyboard navigation across all UI components.
* Screen reader support with proper ARIA labels and landmarks.
* Built on Radix UI primitives for native accessibility.

### Internationalization
* Available in English, French and Spanish.

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
    # For Chrome development
    npm run dev

    # For Firefox development
    npm run dev:firefox
    ```

#### Production Build
3.  **Build the extension:**
    ```bash
    npm run build
    ```

#### Packaging for Distribution
3.  **Create distribution packages:**
    ```bash
    # Create Chrome package
    npm run zip

    # Create Firefox package
    npm run zip:firefox
    ```

#### Loading in Browser
4.  **Load in your browser:**
    * Chrome/Chromium: open `chrome://extensions/` and use "Load unpacked" with the `.output/chrome-mv3` folder.
    * Firefox: open `about:debugging#/runtime/this-firefox` and choose "Load Temporary Add-on" pointing to `.output/firefox-mv2/manifest.json`.
5.  The extension is ready!

## Usage

1.  **Click the Icon:** To access the popup.
2.  **Configure:** Open "Options" to set your rules.
    * **Domain Rules:** Define for which sites to activate features.
    * **RegEx Presets:** Create or use RegEx to extract group names (e.g., `([A-Z]+-\d+)` for Jira).
3.  **Browse:** Use middle-click or right-click > "Open link in new tab" on configured sites and see the magic happen!
4.  **Sessions:** Use "Take Snapshot" to save your current tabs, or "New Profile" to create a persistent, auto-syncing profile.

## Testing

```bash
# Unit tests
npm test

# Unit tests (WXT-aware environment)
npm run test:wxt

# E2E tests (requires a prior build)
npm run test:e2e

# E2E tests with Playwright UI
npm run test:e2e:ui

# Build then run E2E tests
npm run test:e2e:build

# Storybook (component documentation)
npm run storybook
```

## Technologies Used

### Core
* TypeScript & React
* WXT framework for cross-browser extension development
* Chrome/Firefox Extension APIs (Manifest V3 / V2)

### UI
* **@radix-ui/themes** - Design system and UI components
* **react-accessible-treeview** - Accessible tree view for tab lists in wizards and the session editor
* **@radix-ui/react-toast** - Toast notifications
* **next-themes** - Theme management (dark/light mode)
* **lucide-react** - SVG icons
* **react-hook-form** - Form management

### Validation
* **Zod** - Schema validation

### Testing
* **Vitest** - Unit testing with Happy DOM
* **Playwright** - End-to-end testing
* **Storybook** - Component documentation and visual testing

## License

This project is licensed under the **GNU General Public License v3.0**.

---
