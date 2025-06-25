// options/options.js
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';

import { getSettings, saveSettings, getStatistics, resetStatistics } from '../utils/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from '../utils/utils.js';
import { getMessage } from '../utils/i18n.js';
import { applyTheme } from '../utils/theme.js';
const version = browser.runtime.getManifest().version;

import { Header } from '../components/Header.jsx';
import { Tabs } from '../components/Tabs.jsx';
import { RulesTab } from '../components/RulesTab.jsx';
import { PresetsTab } from '../components/PresetsTab.jsx';
import { ImportExportTab } from '../components/ImportExportTab.jsx';
import { StatsTab } from '../components/StatsTab.jsx';
import { LogicalGroupsTab } from '../components/LogicalGroupsTab.jsx';

(() => {

// --- Fonctions Utilitaires ---
function Tooltip({ textKey, children }) {
    return (
        <div className="tooltip-container">
            {children}
            <span className="tooltip-text" data-i18n={textKey}>{getMessage(textKey)}</span>
        </div>
    );
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
        browser.storage.onChanged.addListener(listener);
        return () => browser.storage.onChanged.removeListener(listener);
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
        return <p>Chargement...</p>;
    }

    return (
        <div id="options-inner">
            <Header settings={settings} onThemeChange={(val) => updateSetting('darkModePreference', val)} />
            <Tabs currentTab={currentTab} onTabChange={handleTabChange} />
            <main>
                {currentTab === 'rules' && <RulesTab settings={settings} updateRules={updateRules} editingId={editingRuleId} setEditingId={setEditingRuleId} />}
                {currentTab === 'presets' && <PresetsTab settings={settings} updatePresets={updatePresets} updateRules={updateRules} editingId={editingPresetId} setEditingId={setEditingPresetId} />}
                {currentTab === 'logicalGroups' && <LogicalGroupsTab settings={settings} setSettings={setSettings} editingId={editingLogicalGroupId} setEditingId={setEditingLogicalGroupId} />}
                {currentTab === 'importexport' && <ImportExportTab settings={settings} setSettings={setSettings} />}
                {currentTab === 'stats' && <StatsTab stats={stats} onReset={handleResetStats} />}
            </main>
            <footer>SmartTab Organizer v{version} - Licensed under GPL-3.0-only.</footer>
        </div>
    );

}

// --- Montage ---
  const root = createRoot(document.getElementById('options-app'));
  root.render(<OptionsApp />);
})();
