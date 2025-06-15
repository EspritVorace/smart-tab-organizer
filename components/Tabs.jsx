import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';
import Button from '@atlaskit/button';
import { Inline } from '@atlaskit/primitives';

// --- Tabs ---
function Tabs({ currentTab, onTabChange }) {
    const tabs = [
        { key: 'rules', labelKey: 'domainRulesTab' },
        { key: 'presets', labelKey: 'regexPresetsTab' },
        { key: 'logicalGroups', labelKey: 'logicalGroupsTab' },
        { key: 'importexport', labelKey: 'importExportTab' },
        { key: 'stats', labelKey: 'statisticsTab' },
    ];
    return (
        <Inline as="nav" className="tabs" space="space.100" spread="space-between">
            {tabs.map(tab => (
                <Button
                    className={currentTab === tab.key ? 'active' : ''}
                    onClick={() => onTabChange(tab.key)}
                    appearance="subtle"
                    data-i18n={tab.labelKey}
                >
                    {getMessage(tab.labelKey)}
                </Button>
            ))}
        </Inline>
    );
}

export { Tabs };
