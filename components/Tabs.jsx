import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';

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
        <nav class="tabs">
            {tabs.map(tab => (
                <button
                    class={currentTab === tab.key ? 'active' : ''}
                    onClick={() => onTabChange(tab.key)}
                    data-i18n={tab.labelKey}
                >
                    {getMessage(tab.labelKey)}
                </button>
            ))}
        </nav>
    );
}

export { Tabs };
