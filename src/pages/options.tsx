// options/options.ts
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getSettings, saveSettings, getStatistics, resetStatistics } from '../utils/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from '../utils/utils.js';
import { getMessage } from '../utils/i18n.js';
const version = browser.runtime.getManifest().version;

import { Header } from '../components/UI/Header/Header.jsx';
import { Sidebar } from '../components/UI/Sidebar/Sidebar';
import type { SidebarItem } from '../components/UI/Sidebar/Sidebar';
import { ThemeToggle } from '../components/UI/ThemeToggle/ThemeToggle.jsx';
import { Flex, Text } from '@radix-ui/themes';
import { RulesTab } from '../components/RulesTab.jsx';
import { PresetsTab } from '../components/PresetsTab.jsx';
import { ImportExportTab } from '../components/ImportExportTab.jsx';
import { StatsTab } from '../components/StatsTab.jsx';
import { LogicalGroupsTab } from '../components/LogicalGroupsTab.jsx';
import { Shield, Regex, Group, FileText, BarChart3, Github } from 'lucide-react';
import { FEATURE_BASE_COLORS } from '../utils/themeConstants';
import type { SyncSettings } from '../types/syncSettings';
import type { Statistics } from '../types/statistics';
import type { DomainRuleSettings, RegexPresetSettings } from '../types/syncSettings';
import { 
  DomainRulesTheme, 
  RegexPresetsTheme, 
  LogicalGroupsTheme, 
  ImportTheme, 
  StatisticsTheme 
} from '../components/Form/themes/index';

(() => {

// --- Fonctions Utilitaires ---
interface TooltipProps {
    textKey: string;
    children: React.ReactNode;
}

function Tooltip({ textKey, children }: TooltipProps) {
    return (
        <div className="tooltip-container">
            {children}
            <span className="tooltip-text" data-i18n={textKey}>{getMessage(textKey)}</span>
        </div>
    );
}

// --- Composant Principal ---
function OptionsContent() {
    const [settings, setSettings] = useState<SyncSettings | null>(null);
    const [stats, setStats] = useState<Statistics>({} as Statistics);
    const [currentTab, setCurrentTab] = useState<string>('rules');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [editingLogicalGroupId, setEditingLogicalGroupId] = useState<string | null>(null); // For the new tab
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    // --- Chargement initial & Écouteur Storage ---
    useEffect(() => {
        async function loadData() {
            const [loadedSettings, loadedStats] = await Promise.all([getSettings(), getStatistics()]);
            setSettings(loadedSettings);
            setStats(loadedStats);
        }
        loadData();
        const listener = (changes: any, area: string) => {
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
    const updateSetting = useCallback((key: keyof SyncSettings, value: any) => {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);
    }, []);

    const updateRules = useCallback((newRules: DomainRuleSettings) => {
        setEditingRuleId(null); // Quitte l'édition si on change la liste
        setSettings(prev => prev ? { ...prev, domainRules: newRules } : null);
    }, []);

    const updatePresets = useCallback((newPresets: RegexPresetSettings) => {
        setEditingPresetId(null); // Quitte l'édition
        setSettings(prev => prev ? { ...prev, regexPresets: newPresets } : null);
    }, []);

    // updateLogicalGroups is removed, setSettings will be used directly by LogicalGroupsTab

     const handleResetStats = useCallback(async () => {
         if (confirm(getMessage('confirmResetStats'))) {
            const newStats = await resetStatistics();
            setStats(newStats);
         }
    }, []);

    const handleTabChange = useCallback((tab: string) => {
        setEditingRuleId(null); // Reset editing when changing tabs
        setEditingPresetId(null);
        setEditingLogicalGroupId(null); // Reset for new tab
        setCurrentTab(tab);
    }, []);

    // Sidebar items configuration with themed accent colors
    const sidebarItems: SidebarItem[] = [
        {
            id: 'rules',
            label: getMessage('domainRulesTab'),
            icon: Shield as any,
            accentColor: FEATURE_BASE_COLORS.DOMAIN_RULES,
        },
        {
            id: 'presets',
            label: getMessage('regexPresetsTab'),
            icon: Regex as any,
            accentColor: FEATURE_BASE_COLORS.REGEX_PRESETS,
        },
        {
            id: 'logicalGroups',
            label: getMessage('logicalGroupsTab'),
            icon: Group as any,
            accentColor: FEATURE_BASE_COLORS.LOGICAL_GROUPS,
        },
        {
            id: 'importexport',
            label: getMessage('importExportTab'),
            icon: FileText as any,
            accentColor: FEATURE_BASE_COLORS.IMPORT, // Utilise la couleur Import pour l'onglet combiné
        },
        {
            id: 'stats',
            label: getMessage('statisticsTab'),
            icon: BarChart3 as any,
            accentColor: FEATURE_BASE_COLORS.STATISTICS,
        },
    ];


    // --- Rendu ---
    if (!settings) {
        return <p>Chargement...</p>;
    }

    // Contenu du header pour la sidebar
    const headerContent = (
        <Flex align="center" gap="3" style={{ width: '100%', paddingRight: '64px', position: 'relative' }}>
            <img 
                src="/icons/icon48.png" 
                alt="SmartTab Organizer" 
                style={{ 
                    width: '32px', 
                    height: '32px',
                    flexShrink: 0
                }} 
            />
            <Flex direction="column" gap="0" style={{ lineHeight: '1.2', flex: 1 }}>
                <Flex align="center" gap="2">
                    <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>
                        SmartTab
                    </Text>
                    <Text size="1" style={{ color: 'var(--gray-11)' }}>
                        (v{version})
                    </Text>
                </Flex>
                <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>
                    Organizer
                </Text>
            </Flex>
            <Flex align="center" style={{ position: 'absolute', right: '8px' }}>
                <ThemeToggle />
            </Flex>
        </Flex>
    );

    const headerCollapsedContent = (
        <Flex align="center" justify="center" style={{ width: '100%' }}>
            <img 
                src="/icons/icon48.png" 
                alt="SmartTab Organizer" 
                style={{ 
                    width: '32px', 
                    height: '32px'
                }} 
            />
        </Flex>
    );

    // Custom SidebarFooter content
    const customFooterContent = (
        <Flex 
            align="center" 
            gap="3" 
            style={{ 
                padding: '12px 16px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease',
            }}
            onClick={() => browser.tabs.create({ url: 'https://github.com/EspritVorace/smart-tab-organizer' })}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    browser.tabs.create({ url: 'https://github.com/EspritVorace/smart-tab-organizer' });
                }
            }}
            tabIndex={0}
            role="button"
            aria-label="Visiter le profil GitHub d'EspritVorace"
            className="custom-footer-expanded"
        >
            <img 
                src="/icons/ev.png" 
                alt="EspritVorace" 
                style={{ 
                    width: '24px', 
                    height: '24px',
                    borderRadius: '50%',
                    flexShrink: 0
                }} 
            />
            <Flex align="center" gap="2">
                <Text 
                    size="2" 
                    weight="medium" 
                    style={{ 
                        color: 'var(--gray-11)',
                        textDecoration: 'none'
                    }}
                >
                    EspritVorace
                </Text>
                <Github 
                    size={16} 
                    style={{ 
                        color: 'var(--gray-11)',
                        flexShrink: 0
                    }} 
                />
            </Flex>
        </Flex>
    );

    const customFooterCollapsedContent = (
        <Flex 
            align="center" 
            justify="center" 
            style={{ 
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease',
            }}
            onClick={() => browser.tabs.create({ url: 'https://github.com/EspritVorace/smart-tab-organizer' })}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    browser.tabs.create({ url: 'https://github.com/EspritVorace/smart-tab-organizer' });
                }
            }}
            tabIndex={0}
            role="button"
            aria-label="Visiter le profil GitHub d'EspritVorace"
            className="custom-footer-collapsed"
        >
            <img 
                src="/icons/ev.png" 
                alt="EspritVorace" 
                style={{ 
                    width: '24px', 
                    height: '24px',
                    borderRadius: '50%'
                }} 
            />
        </Flex>
    );

    return (
        <div id="options-inner" style={{ display: 'flex', height: '100vh' }}>
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeItem={currentTab}
                onItemClick={handleTabChange}
                items={sidebarItems}
                headerContent={headerContent}
                headerCollapsedContent={headerCollapsedContent}
                showFooter={true}
                footerContent={customFooterContent}
                footerCollapsedContent={customFooterCollapsedContent}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header settings={settings} />
                <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {currentTab === 'rules' && (
                        <DomainRulesTheme>
                            <RulesTab settings={settings} updateRules={updateRules} editingId={editingRuleId} setEditingId={setEditingRuleId} />
                        </DomainRulesTheme>
                    )}
                    {currentTab === 'presets' && (
                        <RegexPresetsTheme>
                            <PresetsTab settings={settings} updatePresets={updatePresets} updateRules={updateRules} editingId={editingPresetId} setEditingId={setEditingPresetId} />
                        </RegexPresetsTheme>
                    )}
                    {currentTab === 'logicalGroups' && (
                        <LogicalGroupsTheme>
                            <LogicalGroupsTab settings={settings} setSettings={setSettings} editingId={editingLogicalGroupId} setEditingId={setEditingLogicalGroupId} />
                        </LogicalGroupsTheme>
                    )}
                    {currentTab === 'importexport' && (
                        <ImportTheme>
                            <ImportExportTab settings={settings} setSettings={setSettings} />
                        </ImportTheme>
                    )}
                    {currentTab === 'stats' && (
                        <StatisticsTheme>
                            <StatsTab stats={stats} onReset={handleResetStats} />
                        </StatisticsTheme>
                    )}
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
