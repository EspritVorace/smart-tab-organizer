import { h, render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { getSettings, saveSettings, getStatistics, resetStatistics } from '../js/modules/storage.js';
import { getMessage } from '../js/modules/i18n.js';
import { applyTheme } from '../js/modules/theme.js';
import { StatsTab } from '../components/StatsTab.tsx';

function PopupApp() {
  const [settings, setSettings] = useState<any>({ domainRules: [] });
  const [stats, setStats] = useState<any>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [loadedSettings, loadedStats] = await Promise.all([
        getSettings(),
        getStatistics()
      ]);
      setSettings(loadedSettings);
      setStats(loadedStats);
      applyTheme(loadedSettings.darkModePreference || 'system');
      setIsLoaded(true);
    }
    loadData();

    const storageListener = (changes: any, areaName: string) => {
      if (areaName === 'sync' && changes.settings) {
        setSettings(changes.settings.newValue);
        applyTheme(changes.settings.newValue.darkModePreference || 'system');
      }
      if (areaName === 'local' && changes.statistics) {
        setStats(changes.statistics.newValue);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveSettings(settings);
    }
  }, [settings, isLoaded]);

  const handleToggleChange = useCallback((key: string, value: boolean) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const openOptionsPage = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const handleResetStats = useCallback(async () => {
    if (confirm(getMessage('confirmResetStats'))) {
      const newStats = await resetStatistics();
      setStats(newStats);
    }
  }, []);

  return (
    <div id="popup-inner" class={isLoaded ? 'loaded' : ''}>
      <h1>{getMessage('popupTitle')}</h1>
      <div class="toggle-switch">
        <input
          type="checkbox"
          id="grouping-toggle"
          checked={settings.globalGroupingEnabled}
          onChange={e =>
            handleToggleChange(
              'globalGroupingEnabled',
              (e.target as HTMLInputElement).checked
            )
          }
        />
        <label htmlFor="grouping-toggle"></label>
        <span>{getMessage('enableGrouping')}</span>
      </div>
      <div class="toggle-switch">
        <input
          type="checkbox"
          id="deduplication-toggle"
          checked={settings.globalDeduplicationEnabled}
          onChange={e =>
            handleToggleChange(
              'globalDeduplicationEnabled',
              (e.target as HTMLInputElement).checked
            )
          }
        />
        <label htmlFor="deduplication-toggle"></label>
        <span>{getMessage('enableDeduplication')}</span>
      </div>
      <hr />
      <StatsTab stats={stats} onReset={handleResetStats} />
      <hr />
      <button onClick={openOptionsPage} class="button">
        {getMessage('openOptions')}
      </button>
    </div>
  );
}

render(<PopupApp />, document.getElementById('popup-app')!);
