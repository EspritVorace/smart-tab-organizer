import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';
import Select from '@atlaskit/select';

// --- Header & Tabs ---
function Header({ settings, onThemeChange }) {
    return (
        <header>
            <h1 data-i18n="optionsTitle">{getMessage('optionsTitle')}</h1>
            <div class="theme-selector">
                <label data-i18n="darkMode">{getMessage('darkMode')}</label>
                <Select
                    options={[
                        { label: getMessage('systemTheme'), value: 'system' },
                        { label: getMessage('lightMode'), value: 'disabled' },
                        { label: getMessage('darkModeOption'), value: 'enabled' },
                    ]}
                    value={{ label: getMessage(settings.darkModePreference === 'enabled' ? 'darkModeOption' : settings.darkModePreference === 'disabled' ? 'lightMode' : 'systemTheme'), value: settings.darkModePreference }}
                    onChange={(opt) => onThemeChange(opt.value)}
                    aria-label={getMessage('darkMode')}
                />
            </div>
        </header>
    );
}

export { Header };
