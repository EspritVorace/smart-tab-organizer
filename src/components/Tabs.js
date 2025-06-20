import { h } from 'preact';
import htm from '../utils/htm.mjs';
import { getMessage } from '../modules/i18n.js';

const html = htm.bind(h);

// --- Tabs ---
function Tabs({ currentTab, onTabChange }) {
    const tabs = [
        { key: 'rules', labelKey: 'domainRulesTab' },
        { key: 'presets', labelKey: 'regexPresetsTab' },
        { key: 'logicalGroups', labelKey: 'logicalGroupsTab' },
        { key: 'importexport', labelKey: 'importExportTab' },
        { key: 'stats', labelKey: 'statisticsTab' },
    ];
    return html`
        <nav class="tabs">
            ${tabs.map(tab => html`
                <button
                    class=${currentTab === tab.key ? 'active' : ''}
                    onClick=${() => onTabChange(tab.key)}
                    data-i18n=${tab.labelKey}
                >
                    ${getMessage(tab.labelKey)}
                </button>
            `)}
        </nav>
    `;
}

export { Tabs };
