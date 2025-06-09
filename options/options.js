// options/options.js
import { h, render } from './../js/lib/preact.mjs';
import { useState, useEffect, useCallback } from './../js/lib/preact-hooks.mjs';
import htm from './../js/lib/htm.mjs';

import { getSettings, saveSettings, getStatistics, resetStatistics } from './../js/modules/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from './../js/modules/utils.js';
import { getMessage } from './../js/modules/i18n.js';
import { applyTheme } from './../js/modules/theme.js';

const html = htm.bind(h);
const version = chrome.runtime.getManifest().version;

import { Header } from '../components/Header.js';
import { Tabs } from '../components/Tabs.js';
import { RulesTab } from '../components/RulesTab.js';
import { PresetsTab } from '../components/PresetsTab.js';
import { ImportExportTab } from '../components/ImportExportTab.js';
import { StatsTab } from '../components/StatsTab.js';
import { LogicalGroupsTab } from '../components/LogicalGroupsTab.js';

// --- Fonctions Utilitaires ---
function Tooltip({ textKey, children }) {
    return html`
        <div class="tooltip-container">
            ${children}
            <span class="tooltip-text" data-i18n=${textKey}>${getMessage(textKey)}</span>
        </div>
    `;
}

// --- Composant Principal ---
function OptionsApp() {
    const [settings, setSettings] = useState(null);
    const [stats, setStats] = useState({});
    const [currentTab, setCurrentTab] = useState('rules');
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [editingPresetId, setEditingPresetId] = useState(null);
    const [editingLogicalGroupId, setEditingLogicalGroupId] = useState(null); // For the new tab

    // --- Chargement initial & Écouteur Storage ---
    useEffect(() => {
        async function loadData() {
            const [loadedSettings, loadedStats] = await Promise.all([getSettings(), getStatistics()]);
            setSettings(loadedSettings);
            setStats(loadedStats);
            applyTheme(loadedSettings.darkModePreference || 'system');
        }
        loadData();
        const listener = (changes, area) => {
            if (area === 'sync' && changes.settings) {
                console.log("Settings updated from storage.");
                setSettings(changes.settings.newValue);
                applyTheme(changes.settings.newValue.darkModePreference || 'system');
            }
            if (area === 'local' && changes.statistics) {
                console.log("Stats updated from storage.");
                setStats(changes.statistics.newValue);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    // --- Sauvegarde automatique ---
    useEffect(() => {
        if (settings) {
            saveSettings(settings);
            console.log("Paramètres sauvegardés.");
        }
    }, [settings]);

    // --- Gestionnaires ---
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateRules = useCallback((newRules) => {
        setEditingRuleId(null); // Quitte l'édition si on change la liste
        setSettings(prev => ({ ...prev, domainRules: newRules }));
    }, []);

    const updatePresets = useCallback((newPresets) => {
        setEditingPresetId(null); // Quitte l'édition
        setSettings(prev => ({ ...prev, regexPresets: newPresets }));
    }, []);

    // updateLogicalGroups is removed, setSettings will be used directly by LogicalGroupsTab

     const handleResetStats = useCallback(async () => {
         if (confirm(getMessage('confirmResetStats'))) {
            const newStats = await resetStatistics();
            setStats(newStats);
         }
    }, []);

    const handleTabChange = useCallback((tab) => {
        setEditingRuleId(null); // Reset editing when changing tabs
        setEditingPresetId(null);
        setEditingLogicalGroupId(null); // Reset for new tab
        setCurrentTab(tab);
    }, []);


    // --- Rendu ---
    if (!settings) {
        return html`<p>Chargement...</p>`;
    }

    return html`
        <div id="options-inner">
            <${Header} settings=${settings} onThemeChange=${(val) => updateSetting('darkModePreference', val)} />
            <${Tabs} currentTab=${currentTab} onTabChange=${handleTabChange} />
            <main>
                ${currentTab === 'rules' && html`<${RulesTab} settings=${settings} updateRules=${updateRules} editingId=${editingRuleId} setEditingId=${setEditingRuleId} />`}
                ${currentTab === 'presets' && html`<${PresetsTab} settings=${settings} updatePresets=${updatePresets} updateRules=${updateRules} editingId=${editingPresetId} setEditingId=${setEditingPresetId} />`}
                ${currentTab === 'logicalGroups' && html`<${LogicalGroupsTab} settings=${settings} setSettings=${setSettings} editingId=${editingLogicalGroupId} setEditingId=${setEditingLogicalGroupId} />`}
                ${currentTab === 'importexport' && html`<${ImportExportTab} settings=${settings} setSettings=${setSettings} />`}
                ${currentTab === 'stats' && html`<${StatsTab} stats=${stats} onReset=${handleResetStats} />`}
            </main>
            <footer>SmartTab Organizer v${version} - Licensed under GPL-3.0-only.</footer>
        </div>
    `;

}

// --- Montage ---
render(html`<${OptionsApp} />`, document.getElementById('options-app'));
