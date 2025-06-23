// popup/popup.js
import { h, render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { browser } from 'wxt/browser';
import htm from '../../utils/lib/htm.mjs';

import { getSettings, saveSettings, getStatistics, resetStatistics } from '../../utils/storage.js';
import { getMessage } from '../../utils/i18n.js';
import { applyTheme } from '../../utils/theme.js';
import { StatsTab } from '../../components/StatsTab.js';

const html = htm.bind(h);

export default defineUnlistedScript(() => {

function PopupApp() {
    const [settings, setSettings] = useState({ domainRules: [] }); // Init avec tableau vide
    const [stats, setStats] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    // --- Effet pour charger les données et mettre à jour le thème ---
    useEffect(() => {
        async function loadData() {
            const [loadedSettings, loadedStats] = await Promise.all([getSettings(), getStatistics()]);
            setSettings(loadedSettings);
            setStats(loadedStats);
            applyTheme(loadedSettings.darkModePreference || 'system');
            setIsLoaded(true);
        }
        loadData();

        // Écouteur pour les changements
        const storageListener = (changes, areaName) => {
            if (areaName === 'sync' && changes.settings) {
                setSettings(changes.settings.newValue);
                applyTheme(changes.settings.newValue.darkModePreference || 'system');
            }
            if (areaName === 'local' && changes.statistics) {
                setStats(changes.statistics.newValue);
            }
        };
        browser.storage.onChanged.addListener(storageListener);

        // Nettoyage au démontage
        return () => browser.storage.onChanged.removeListener(storageListener);
    }, []); // [] = S'exécute une seule fois au montage

    // --- Effet pour sauvegarder les changements ---
    useEffect(() => {
        // Ne sauvegarde pas au premier chargement (quand il est vide)
        if (isLoaded) {
            saveSettings(settings);
            console.log("Paramètres sauvegardés (Popup).");
        }
    }, [settings, isLoaded]); // Se déclenche quand 'settings' ou 'isLoaded' change

    // --- Gestionnaires d'événements ---
    const handleToggleChange = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const openOptionsPage = useCallback(() => {
        browser.runtime.openOptionsPage();
    }, []);

    const handleResetStats = useCallback(async () => {
        if (confirm(getMessage('confirmResetStats'))) {
            const newStats = await resetStatistics();
            setStats(newStats);
        }
    }, []);

    // --- Rendu ---
    return html`
        <div id="popup-inner" class=${isLoaded ? 'loaded' : ''}>
            <h1>${getMessage('popupTitle')}</h1>

            <div class="toggle-switch">
                <input
                    type="checkbox"
                    id="grouping-toggle"
                    checked=${settings.globalGroupingEnabled}
                    onChange=${(e) => handleToggleChange('globalGroupingEnabled', e.target.checked)}
                />
                <label for="grouping-toggle"></label>
                <span>${getMessage('enableGrouping')}</span>
            </div>

            <div class="toggle-switch">
                <input
                    type="checkbox"
                    id="deduplication-toggle"
                    checked=${settings.globalDeduplicationEnabled}
                    onChange=${(e) => handleToggleChange('globalDeduplicationEnabled', e.target.checked)}
                />
                <label for="deduplication-toggle"></label>
                <span>${getMessage('enableDeduplication')}</span>
            </div>

            <hr />

            <${StatsTab} stats=${stats} onReset=${handleResetStats} />

            <hr />

            <button onClick=${openOptionsPage} class="button">${getMessage('openOptions')}</button>
        </div>
    `;
}

// Monte l'application Preact dans le div #popup-app
  render(html`<${PopupApp} />`, document.getElementById('popup-app'));
});
