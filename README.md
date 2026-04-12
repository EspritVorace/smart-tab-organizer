[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-es.md)

# SmartTab Organizer

![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a cross-browser extension that automatically groups related tabs, prevents duplicates, and saves your workspaces as named sessions.

<p align="center">
  <img src="assets/store.png" alt="SmartTab Organizer">
</p>

## 🛒 Chrome Web Store ##


[![](https://img.shields.io/chrome-web-store/v/ijnpdkkcbmfikocmboibffjgbohhlmah?style=for-the-badge&label=version)](https://chromewebstore.google.com/detail/smarttab-organizer/ijnpdkkcbmfikocmboibffjgbohhlmah)

## Features

### ⚙️ Rule Management

Domain rules are created through a guided 4-step wizard: identity → group naming mode → options → summary.

Three group naming modes:
- **Preset** — pick a built-in or custom regex pattern (Jira ticket IDs, GitHub repo names…)
- **Ask** — prompt for a name when the tab opens
- **Manual** — fixed group name

<p align="center">
  <img src="doc/readme/en-dark-rules-create-summary.png" alt="Rule creation wizard — summary step">
</p>

### 🗂️ Automatic Grouping

Middle-click or right-click → "Open in new tab" on a configured site and the tab lands in the right group instantly.

- Group names extracted from the page title, URL, or a regex preset
- Built-in presets for Jira, GitLab, GitHub, Trello and more

<p align="center">
  <img src="assets/readme/gifs/regroup.gif" alt="Automatic Regroupment video">
</p>

### 🔁 Deduplication

Opening a page that's already open refocuses and reloads the existing tab instead.
Matching sensitivity is configurable per rule: exact URL, hostname + path, hostname, or "includes".

<p align="center">
  <img src="assets/readme/gifs/dedup.gif" alt="Deduplication video">
</p>


### 📷 Sessions

Save a named snapshot of your open tabs and groups, restore them whenever you need.

- **Pinned sessions** — promote any snapshot to your popup for one-click access, with a custom icon
- **Restore wizard** — pick which tabs to bring back, choose the target window, resolve group conflicts before applying
- **Deep search** — find tabs and groups by name across all your saved sessions
- **Session editor** — reorganize, rename and delete tabs and groups without restoring first
- **Session notes** — annotate any session with free-form text
- **Drag-and-drop** — reorder your sessions list by dragging

<p align="center">
  <img src="doc/readme/en-dark-sessions-list.png" alt="Sessions list">
</p>

<p align="center">
  <img src="doc/readme/en-dark-sessions-search-deep.png" alt="Deep search in sessions">
</p>


An **Import/Export wizard for Rules and Sessions** classifies incoming as new, conflicting or identical, and resolves conflicts step by step.

<p align="center">
  <img src="doc/readme/en-dark-rules-import-text-conflicts.png" alt="Import wizard with conflict resolution">
</p>

### ⚡ Quick Access Popup

- Toggle grouping and deduplication globally
- Take a snapshot or jump to Sessions in one click
- Pinned sessions listed with quick-restore actions

<p align="center">

<img src="doc/readme/en-dark-popup-content.png" alt="Popup content">
</p>

### ♿ Accessibility & i18n

Full keyboard navigation and screen-reader support via Radix UI primitives. Available in English, French and Spanish.

## 💻 Installation

```bash
git clone https://github.com/EspritVorace/smart-tab-organizer.git
cd smart-tab-organizer
npm install -g pnpm  # if needed
pnpm install
pnpm build
```

- **Chrome:** `chrome://extensions/` → Load unpacked → `.output/chrome-mv3`

For development with auto-reload: `pnpm dev` (Chrome) or `pnpm dev:firefox`.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension framework | [WXT](https://wxt.dev/) |
| UI | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Component library | [Radix UI Themes](https://www.radix-ui.com/themes) + [Lucide](https://lucide.dev/) icons |
| Forms & validation | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Drag-and-drop | [@dnd-kit](https://dndkit.com/) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Unit tests | [Vitest](https://vitest.dev/) |
| E2E tests | [Playwright](https://playwright.dev/) |
| Component explorer | [Storybook](https://storybook.js.org/) |
| Package manager | [pnpm](https://pnpm.io/) |

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

**Prerequisites:** Node.js, [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

```bash
git clone https://github.com/EspritVorace/smart-tab-organizer.git
cd smart-tab-organizer
pnpm install
pnpm dev          # Chrome with auto-reload
pnpm dev:firefox  # Firefox with auto-reload
```

**Tests**

```bash
pnpm test         # Unit tests (Vitest)
pnpm test:e2e     # End-to-end tests (Playwright)
pnpm storybook    # Component explorer (port 6006)
```

**Code conventions**

- Use `logger.debug()` from `src/utils/logger.ts` — never `console.log()`
- No `any` types — use precise types or narrow `unknown`
- All UI text via `getMessage()` from `src/utils/i18n.ts` — no hardcoded strings
- Accessibility via Radix UI primitives; Lucide icons need `aria-hidden="true"`

Please open an issue before submitting a large pull request.

## 📜 License

GNU General Public License v3.0
