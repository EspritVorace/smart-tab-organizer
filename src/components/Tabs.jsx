import { getMessage } from '../utils/i18n.js';

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
        <nav className="tabs">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={currentTab === tab.key ? 'active' : ''}
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
