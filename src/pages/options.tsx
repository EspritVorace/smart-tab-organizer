// options/options.ts
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { useSyncedSettings } from '../hooks/useSyncedSettings.js';
import { useStatistics } from '../hooks/useStatistics.js';
import { generateUUID, isValidDomain, isValidRegex } from '../utils/utils.js';
import { getMessage } from '../utils/i18n';
const version = browser.runtime.getManifest().version;

import { Sidebar } from '../components/UI/Sidebar/Sidebar';
import type { SidebarItem } from '../components/UI/Sidebar/Sidebar';
import { ThemeToggle } from '../components/UI/ThemeToggle/ThemeToggle.jsx';
import { Flex, Text } from '@radix-ui/themes';
import { DomainRulesPage } from './DomainRulesPage';
import { ImportExportPage } from '../components/UI/ImportExportPage/ImportExportPage';
import { StatsTab } from '../components/StatsTab.jsx';
import { Shield, FileText, BarChart3, Github } from 'lucide-react';
import { FEATURE_BASE_COLORS } from '../utils/themeConstants';
import type { SyncSettings, DomainRuleSettings } from '../types/syncSettings';
import type { Statistics } from '../types/statistics';
import { 
  DomainRulesTheme, 
  RegexPresetsTheme, 
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
            <span className="tooltip-text">{getMessage(textKey)}</span>
        </div>
    );
}

// --- Composant Principal ---
function OptionsContent() {
    const { settings, updateSettings } = useSyncedSettings();
    const { statistics: stats, resetStatistics } = useStatistics();
    const [currentTab, setCurrentTab] = useState<string>('rules');
    
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    // Storage handled by hooks

    // --- Gestionnaires ---
    const updateSetting = useCallback((key: keyof SyncSettings, value: any) => {
        updateSettings({ [key]: value });
    }, [updateSettings]);

    const updateRules = useCallback((newRules: DomainRuleSettings) => {
        updateSettings({ domainRules: newRules });
    }, [updateSettings]);

    


     const handleResetStats = useCallback(async () => {
         if (confirm(getMessage('confirmResetStats'))) {
            await resetStatistics();
         }
    }, [resetStatistics]);

    const handleTabChange = useCallback((tab: string) => {
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
                <main style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {currentTab === 'rules' && (
                        <DomainRulesPage syncSettings={settings} updateRules={updateRules} />
                    )}
                    {currentTab === 'importexport' && (
                        <ImportExportPage syncSettings={settings} onSettingsUpdate={updateSettings} />
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
