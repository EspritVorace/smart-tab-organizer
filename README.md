[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a cross-browser extension that automatically groups related tabs, prevents duplicates, and saves your workspaces as named sessions.

<p align="center">
  <img src="doc/assets/store.png" alt="SmartTab Organizer">
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
  <img src="doc/assets/en-dark-rules-create-summary.png" alt="Rule creation wizard — summary step">
</p>

### 🗂️ Automatic Grouping

Middle-click or right-click → "Open in new tab" on a configured site and the tab lands in the right group instantly.

- Group names extracted from the page title, URL, or a regex preset
- Built-in presets for Jira, GitLab, GitHub, Trello and more

<p align="center">
  <img src="doc/assets/regroup.gif" alt="Automatic Regroupment video">
</p>

### 🔁 Deduplication

Opening a page that's already open refocuses and reloads the existing tab instead.
Matching sensitivity is configurable per rule: exact URL, hostname + path, hostname, or "includes".

<p align="center">
  <img src="doc/assets/dedup.gif" alt="Deduplication video">
</p>


### 📷 Sessions

Save a named snapshot of your open tabs and groups, restore them whenever you need.

- **Pinned sessions** — promote any snapshot to your popup for one-click access, with a custom icon
- **Restore wizard** — pick which tabs to bring back, choose the target window, resolve group conflicts before applying
- **Deep search** — find tabs and groups by name across all your saved sessions
- **Session editor** — reorganize, rename and delete tabs and groups without restoring first

<p align="center">
  <img src="doc/assets/en-dark-sessions-list.png" alt="Sessions list">
</p>

<p align="center">
  <img src="doc/assets/en-dark-sessions-search-deep.png" alt="Deep search in sessions">
</p>


An **Import/Export wizard for Rules and Sessions** classifies incoming as new, conflicting or identical, and resolves conflicts step by step.

<p align="center">
  <img src="doc/assets/en-dark-rules-import-text-conflicts.png" alt="Import wizard with conflict resolution">
</p>

### ⚡ Quick Access Popup

- Toggle grouping and deduplication globally
- Take a snapshot or jump to Sessions in one click
- Pinned sessions listed with quick-restore actions

<p align="center">

<img src="doc/assets/en-dark-popup-content.png" alt="Popup content">
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

WXT · React + TypeScript · Radix UI Themes · Zod · Vitest · Playwright

## 📜 License

GNU General Public License v3.0
