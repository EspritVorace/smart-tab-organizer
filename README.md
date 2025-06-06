[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** is a Chrome extension designed to help you efficiently manage your browser tabs by automatically grouping related tabs and preventing duplicates.

## Features ✨

### 🖱️ Automatic Grouping
* Middle-click a link to open the tab in the proper group if its domain matches your rules.
* Tabs join an existing group or a new one is created.
* The group name can come from the opener tab's title, from its URL or you can be prompted manually.
* Built-in RegEx presets for popular ticket systems (Jira, GitLab, GitHub, Trello, etc.).

### 🚫 Deduplication
* Opening the same URL twice is prevented.
* The existing tab is re-focused and reloaded.
* Supports several matching modes: exact URL, hostname + path, hostname or simple "includes".

### ⚙️ Options & Customization
* Add, edit, delete and enable/disable domain rules.
* Manage custom and predefined RegEx presets.
* Organize rules in logical groups and choose a color for each group.
* Import/export your settings as JSON.
* Configure deduplication modes.
* View statistics (groups created and tabs deduplicated) and reset them.
* Select Light, Dark or System theme.

### 📊 Quick Access Popup
* Toggle grouping and deduplication globally.
* View key statistics at a glance.
* Shortcut to the options page.
* Right-click the extension icon for a "Disable All" action.

### 🌍 Internationalization
* Available in French (default), English and Spanish.

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