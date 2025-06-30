// options/options.js
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getSettings, saveSettings, getStatistics, resetStatistics } from '../utils/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from '../utils/utils.js';
import { getMessage } from '../utils/i18n.js';
const version = browser.runtime.getManifest().version;

import { Header } from '../components/Header/Header.jsx';
import { Sidebar } from '../components/Sidebar/Sidebar.tsx';
import { RulesTab } from '../components/RulesTab.jsx';
import { PresetsTab } from '../components/PresetsTab.jsx';
import { ImportExportTab } from '../components/ImportExportTab.jsx';
import { StatsTab } from '../components/StatsTab.jsx';
import { LogicalGroupsTab } from '../components/LogicalGroupsTab.jsx';
import { Shield, Regex, Group, FileText, BarChart3 } from 'lucide-react';

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
function OptionsContent() {
    const [settings, setSettings] = useState(null);
    const [stats, setStats] = useState({});
    const [currentTab, setCurrentTab] = useState('rules');
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [editingPresetId, setEditingPresetId] = useState(null);
    const [editingLogicalGroupId, setEditingLogicalGroupId] = useState(null); // For the new tab
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // --- Chargement initial & Écouteur Storage ---
    useEffect(() => {
        async function loadData() {
            const [loadedSettings, loadedStats] = await Promise.all([getSettings(), getStatistics()]);
            setSettings(loadedSettings);
            setStats(loadedStats);
        }
        loadData();
        const listener = (changes, area) => {
            if (area === 'sync' && changes.settings) {
                console.log("Settings updated from storage.");
                setSettings(changes.settings.newValue);
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

    // Sidebar items configuration
    const sidebarItems = [
        {
            id: 'rules',
            label: getMessage('domainRulesTab'),
            icon: Shield,
        },
        {
            id: 'presets',
            label: getMessage('regexPresetsTab'),
            icon: Regex,
        },
        {
            id: 'logicalGroups',
            label: getMessage('logicalGroupsTab'),
            icon: Group,
        },
        {
            id: 'importexport',
            label: getMessage('importExportTab'),
            icon: FileText,
        },
        {
            id: 'stats',
            label: getMessage('statisticsTab'),
            icon: BarChart3,
        },
    ];


    // --- Rendu ---
    if (!settings) {
        return <p>Chargement...</p>;
    }

    return (
        <div id="options-inner" style={{ display: 'flex', height: '100vh' }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={currentTab}
                onItemClick={handleTabChange}
                items={sidebarItems}
                showFooter={true}
                footerContent={<div style={{ padding: '16px', fontSize: '12px', color: 'var(--gray-11)' }}>SmartTab Organizer v{version}<br/>Licensed under GPL-3.0-only.</div>}
                footerCollapsedContent={<div style={{ padding: '8px', fontSize: '10px', color: 'var(--gray-11)', textAlign: 'center' }}>v{version}</div>}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header settings={settings} />
                <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {currentTab === 'rules' && <RulesTab settings={settings} updateRules={updateRules} editingId={editingRuleId} setEditingId={setEditingRuleId} />}
                    {currentTab === 'presets' && <PresetsTab settings={settings} updatePresets={updatePresets} updateRules={updateRules} editingId={editingPresetId} setEditingId={setEditingPresetId} />}
                    {currentTab === 'logicalGroups' && <LogicalGroupsTab settings={settings} setSettings={setSettings} editingId={editingLogicalGroupId} setEditingId={setEditingLogicalGroupId} />}
                    {currentTab === 'importexport' && <ImportExportTab settings={settings} setSettings={setSettings} />}
                    {currentTab === 'stats' && <StatsTab stats={stats} onReset={handleResetStats} />}
                </main>
            </div>
        </div>
    );

}

function OptionsApp() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Theme>
                <OptionsContent />
            </Theme>
        </ThemeProvider>
    );
}

// --- Montage ---
  const root = createRoot(document.getElementById('options-app'));
  root.render(<OptionsApp />);
})();
