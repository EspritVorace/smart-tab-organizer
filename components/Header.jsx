import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';

// --- Header & Tabs ---
function Header({ settings, onThemeChange }) {
    return (
        <header>
            <h1 data-i18n="optionsTitle">{getMessage('optionsTitle')}</h1>
            <div class="theme-selector">
                <label data-i18n="darkMode">{getMessage('darkMode')}</label>
                <select value={settings.darkModePreference} onChange={(e) => onThemeChange(e.target.value)}>
                    <option value="system" data-i18n="systemTheme">{getMessage('systemTheme')}</option>
                    <option value="disabled" data-i18n="lightMode">{getMessage('lightMode')}</option>
                    <option value="enabled" data-i18n="darkModeOption">{getMessage('darkModeOption')}</option>
                </select>
            </div>
        </header>
    );
}

export { Header };
