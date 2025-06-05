[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a Chrome extension designed to help you efficiently manage your browser tabs by automatically grouping related tabs and preventing duplicates.

## Features ✨

* **🖱️ Automatic Grouping (Middle Click):**
    * When you middle-click on a link, if the source page's domain matches a configured rule, the new tab opens in a group.
    * If the source tab is already in a group, the new tab joins it.
    * Otherwise, a new group is created.
* **🏷️ Group Naming via RegEx:**
    * Define regular expressions for specific domains.
    * The extension extracts text from the new tab's title using your RegEx to automatically name the tab group.
    * Includes presets for popular ticketing tools (Jira, GitLab, GitHub, Trello, etc.).
* **🚫 Duplicate Prevention:**
    * Prevents opening the same URL multiple times.
    * If you try to open an already present URL, the existing tab is brought to the foreground and reloaded, and the new one is closed.
    * Supports exact URL matching or "includes" matching by domain.
* **⚙️ Comprehensive Options Page:**
    * Manage (Add, Edit, Delete, Enable/Disable) domain rules.
    * Domain rules can be grouped by logical groups.
    * Title name for groups is now computed based on the source tab's title, not the new tab's title.
    * Manage custom and predefined regular expressions.
    * Configure deduplication modes.
    * Import and export your settings (rules and presets) via JSON.
    * View statistics and reset them.
* **🕶️ Dark Mode Support:**
    * Choose between Light Mode, Dark Mode, or follow your system's theme.
* **🌍 Internationalization:**
    * Available in French (Default), English, and Spanish.
* **📊 Quick Access Popup:**
    * Globally enable/disable grouping and deduplication.
    * View key statistics at a glance.
    * Quick link to the options page.

## Installation 🚀

### Manual (Development / Testing)

1.  **Download:** Clone or download this project.
    ```bash
    git clone [https://github.com/EspritVorace/smart-tab-organizer.git](https://github.com/EspritVorace/smart-tab-organizer.git) 
    ```
2.  **Open Chrome Extensions:** Navigate to `chrome://extensions/`.
3.  **Enable Developer Mode:** Check the "Developer mode" box.
4.  **Load Extension:** Click "Load unpacked" and select the `SmartTab_Organizer` folder (the one containing `manifest.json`).
5.  The extension is ready!

## Usage 📖

1.  **Click the Icon:** To access the popup.
2.  **Configure:** Open "Options" to set your rules.
    * **Domain Rules:** Define for which sites to activate features.
    * **RegEx Presets:** Create or use RegEx to extract group names (e.g., `([A-Z]+-\d+)` for Jira).
3.  **Browse:** Use middle-click on configured sites and see the magic happen!

## Technologies Used 🛠️

* JavaScript (ES Modules)
* Chrome Extension APIs (Manifest V3)
* preact (for a lightweight reactive UI)
* CSS3

## License 📄

This project is licensed under the **GNU General Public License v3.0**.

---