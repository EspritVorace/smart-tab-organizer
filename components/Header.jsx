import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';
import Select from '@atlaskit/select';
import { Box, Inline } from '@atlaskit/primitives';

// --- Header & Tabs ---
function Header({ settings, onThemeChange }) {
    return (
        <Box
            as="header"
            style={{ borderBottom: '2px solid var(--ds-border, #ccc)' }}
            paddingBlockEnd="space.300"
            marginBlockEnd="space.500"
        >
            <Inline alignItems="center" justifyContent="space-between" space="space.200">
                <h1 data-i18n="optionsTitle">{getMessage('optionsTitle')}</h1>
                <Inline alignItems="center" space="space.100">
                    <label data-i18n="darkMode">{getMessage('darkMode')}</label>
                    <Select
                        className="theme-select"
                        options={[
                            { label: getMessage('systemTheme'), value: 'system' },
                            { label: getMessage('lightMode'), value: 'disabled' },
                            { label: getMessage('darkModeOption'), value: 'enabled' },
                        ]}
                        value={{ label: getMessage(settings.darkModePreference === 'enabled' ? 'darkModeOption' : settings.darkModePreference === 'disabled' ? 'lightMode' : 'systemTheme'), value: settings.darkModePreference }}
                        onChange={(opt) => onThemeChange(opt.value)}
                        aria-label={getMessage('darkMode')}
                    />
                </Inline>
            </Inline>
        </Box>
    );
}

export { Header };
