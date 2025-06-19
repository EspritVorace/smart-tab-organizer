import { h, render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { getSettings, saveSettings, getStatistics, resetStatistics } from '../js/modules/storage.js';
import { getMessage } from '../js/modules/i18n.js';
import { applyTheme } from '../js/modules/theme.js';

import { Header } from '../components/Header.tsx';
import { Tabs } from '../components/Tabs.tsx';
import { RulesTab } from '../components/RulesTab.tsx';
import { PresetsTab } from '../components/PresetsTab.tsx';
import { ImportExportTab } from '../components/ImportExportTab.tsx';
import { StatsTab } from '../components/StatsTab.tsx';
import { LogicalGroupsTab } from '../components/LogicalGroupsTab.tsx';

const version = chrome.runtime.getManifest().version;

function OptionsApp() {
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [currentTab, setCurrentTab] = useState('rules');

  useEffect(() => {
    async function loadData() {
      const [loadedSettings, loadedStats] = await Promise.all([
        getSettings(),
        getStatistics()
      ]);
      setSettings(loadedSettings);
      setStats(loadedStats);
      applyTheme(loadedSettings.darkModePreference || 'system');
    }
    loadData();
  }, []);

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (settings) {
      saveSettings(settings);
    }
  }, [settings]);

  const updateRules = useCallback((rules: any[]) => {
    setSettings((prev: any) => ({ ...prev, domainRules: rules }));
  }, []);

  const updatePresets = useCallback((presets: any[]) => {
    setSettings((prev: any) => ({ ...prev, regexPresets: presets }));
  }, []);

  const handleResetStats = useCallback(async () => {
    if (confirm(getMessage('confirmResetStats'))) {
      const newStats = await resetStatistics();
      setStats(newStats);
    }
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab);
  }, []);

  if (!settings) {
    return <p>Chargement...</p>;
  }

  return (
    <div id="options-inner">
      <Header settings={settings} onThemeChange={val => updateSetting('darkModePreference', val)} />
      <Tabs currentTab={currentTab} onTabChange={handleTabChange} />
      <main>
        {currentTab === 'rules' && (
          <RulesTab settings={settings} updateRules={updateRules} />
        )}
        {currentTab === 'presets' && (
          <PresetsTab settings={settings} updatePresets={updatePresets} />
        )}
        {currentTab === 'logicalGroups' && (
          <LogicalGroupsTab settings={settings} setSettings={setSettings} />
        )}
        {currentTab === 'importexport' && (
          <ImportExportTab settings={settings} setSettings={setSettings} />
        )}
        {currentTab === 'stats' && (
          <StatsTab stats={stats} onReset={handleResetStats} />
        )}
      </main>
      <footer>SmartTab Organizer v{version} - Licensed under GPL-3.0-only.</footer>
    </div>
  );
}

render(<OptionsApp />, document.getElementById('options-app')!);
