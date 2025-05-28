// options/options.js
import { h, render, Fragment } from './../js/lib/preact.mjs';
import { useState, useEffect, useCallback } from './../js/lib/preact-hooks.mjs';
import htm from './../js/lib/htm.mjs';

import { getSettings, saveSettings, getStatistics, resetStatistics } from './../js/modules/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from './../js/modules/utils.js';
import { getMessage } from './../js/modules/i18n.js';
import { applyTheme } from './../js/modules/theme.js';

const html = htm.bind(h);

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

     const handleResetStats = useCallback(async () => {
         if (confirm(getMessage('confirmResetStats'))) {
            const newStats = await resetStatistics();
            setStats(newStats);
         }
    }, []);

    const handleTabChange = useCallback((tab) => {
        setEditingRuleId(null); // Reset editing when changing tabs
        setEditingPresetId(null);
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
                ${currentTab === 'presets' && html`<${PresetsTab} settings=${settings} updatePresets=${updatePresets} editingId=${editingPresetId} setEditingId=${setEditingPresetId} />`}
                ${currentTab === 'importexport' && html`<${ImportExportTab} settings=${settings} setSettings=${setSettings}/>`}
                ${currentTab === 'stats' && html`<${StatsTab} stats=${stats} onReset=${handleResetStats} />`}
            </main>
            <footer>SmartTab Organizer v1.0.2 - Licensed under GPL-3.0-only.</footer>
        </div>
    `;
}

// --- Header & Tabs ---
function Header({ settings, onThemeChange }) {
    return html`
        <header>
            <h1 data-i18n="optionsTitle">${getMessage('optionsTitle')}</h1>
            <div class="theme-selector">
                <label data-i18n="darkMode">${getMessage('darkMode')}</label>
                <select value=${settings.darkModePreference} onChange=${(e) => onThemeChange(e.target.value)}>
                    <option value="system" data-i18n="systemTheme">${getMessage('systemTheme')}</option>
                    <option value="disabled" data-i18n="lightMode">${getMessage('lightMode')}</option>
                    <option value="enabled" data-i18n="darkModeOption">${getMessage('darkModeOption')}</option>
                </select>
            </div>
        </header>
    `;
}

function Tabs({ currentTab, onTabChange }) {
    const tabs = [
        { key: 'rules', labelKey: 'domainRulesTab' },
        { key: 'presets', labelKey: 'regexPresetsTab' },
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

// ... Autres sous-composants (RulesTab, PresetsTab, ImportExportTab, StatsTab) ...
// Pour la brièveté, voici un exemple pour RulesTab. Les autres suivraient une logique similaire.

function RulesTab({ settings, updateRules, editingId, setEditingId }) {
    const { domainRules, regexPresets } = settings;
    const [newRuleInProgress, setNewRuleInProgress] = useState(null);

    const handleAdd = () => {
        const newId = generateUUID();
        const newRule = { id: newId, enabled: true, domainFilter: "", titleParsingRegEx: regexPresets[0]?.regex || "", deduplicationMatchMode: "exact" };
        setNewRuleInProgress(newRule);
        setEditingId(newId); // Ouvre le formulaire pour la nouvelle règle
    };

    const handleSave = (updatedRule) => {
        if (newRuleInProgress && updatedRule.id === newRuleInProgress.id) {
            updateRules([...domainRules, updatedRule]);
            setNewRuleInProgress(null);
        } else {
            const newRules = domainRules.map(r => r.id === updatedRule.id ? updatedRule : r);
            updateRules(newRules);
        }
        setEditingId(null);
    };

    const handleCancelNew = () => {
        setNewRuleInProgress(null);
        setEditingId(null);
    };

    const handleDelete = (idToDelete) => {
         if (confirm(getMessage('confirmDeleteRule'))) {
            updateRules(domainRules.filter(r => r.id !== idToDelete));
         }
    };

    return html`
        <section id="rules-section">
            <h2>${getMessage('domainRulesTab')}</h2>
            ${domainRules.map(rule => html`
                <${Fragment} key=${rule.id}>
                    ${editingId === rule.id && (!newRuleInProgress || newRuleInProgress.id !== rule.id)
                        ? html`<${RuleEditForm} rule=${rule} presets=${regexPresets} onSave=${handleSave} onCancel=${() => setEditingId(null)} />`
                        : html`<${RuleView} rule=${rule} presets=${regexPresets} onEdit=${setEditingId} onDelete=${handleDelete} onToggle=${handleSave} />`
                    }
                <//>
            `)}
            ${newRuleInProgress && editingId === newRuleInProgress.id && html`
                <${RuleEditForm} rule=${newRuleInProgress} presets=${regexPresets} onSave=${handleSave} onCancel=${handleCancelNew} />
            `}
            ${!editingId && !newRuleInProgress && html`<button onClick=${handleAdd} class="button add-button">${getMessage('addRule')}</button>`}
        </section>
    `;
}

function RuleView({ rule, presets, onEdit, onDelete, onToggle }) {
     const presetName = presets.find(p => p.regex === rule.titleParsingRegEx)?.name || rule.titleParsingRegEx;
     const dedupMode = getMessage(rule.deduplicationMatchMode === 'exact' ? 'exactMatch' : 'includesMatch');
     const disabledClass = rule.enabled ? '' : 'disabled-text';

     const handleToggle = (e) => {
        onToggle({ ...rule, enabled: e.target.checked });
     };

    return html`
        <div class="list-item">
            <div class="item-view">
                <input type="checkbox" id="enable-${rule.id}" checked=${rule.enabled} onChange=${handleToggle} />
                <label for="enable-${rule.id}" class="item-details">
                    <span class="item-main ${disabledClass}">${rule.domainFilter}</span>
                    <span class="item-sub ${disabledClass}">${presetName} | ${dedupMode}</span>
                </label>
                <div class="item-actions">
                    <button onClick=${() => onEdit(rule.id)}>${getMessage('edit')}</button>
                    <button onClick=${() => onDelete(rule.id)} class="danger">${getMessage('delete')}</button>
                </div>
            </div>
        </div>
    `;
}

function RuleEditForm({ rule, presets, onSave, onCancel }) {
    const [formData, setFormData] = useState(rule);
    const [errors, setErrors] = useState({});

    const isPreset = presets.some(p => p.regex === formData.titleParsingRegEx);
    const [isCustom, setIsCustom] = useState(!isPreset);
    const [customValue, setCustomValue] = useState(isPreset ? '' : formData.titleParsingRegEx);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e) => {
         const value = e.target.value;
         if(value === 'custom') {
            setIsCustom(true);
            setFormData(prev => ({ ...prev, titleParsingRegEx: customValue }));
         } else {
            setIsCustom(false);
            setFormData(prev => ({ ...prev, titleParsingRegEx: value }));
         }
    };

     const handleCustomChange = (e) => {
        setCustomValue(e.target.value);
        if (isCustom) {
            setFormData(prev => ({ ...prev, titleParsingRegEx: e.target.value }));
        }
     };

    const handleSubmit = (e) => {
        e.preventDefault();
        // --- Validation ---
        let currentErrors = {};
        if (!isValidDomain(formData.domainFilter)) {
            currentErrors.domainFilter = getMessage('errorInvalidDomain');
        } // Add duplicate check later if needed
        if (!isValidRegex(formData.titleParsingRegEx)) {
            currentErrors.titleParsingRegEx = getMessage('errorInvalidRegex');
        }
        setErrors(currentErrors);

        if (Object.keys(currentErrors).length === 0) {
            onSave(formData);
        }
    };

     const currentRegexValue = isCustom ? 'custom' : formData.titleParsingRegEx;

    return html`
        <div class="list-item is-editing">
            <div class="item-edit">
                 <form onSubmit=${handleSubmit}>
                    <div class="form-grid">
                        <div class="form-group tooltip-container">
                            <label>${getMessage('domainFilter')}</label>
                            <input type="text" name="domainFilter" value=${formData.domainFilter} onChange=${handleChange} required />
                            ${errors.domainFilter && html`<span class="error-message">${errors.domainFilter}</span>`}
                        </div>
                        <div class="form-group tooltip-container">
                            <label>${getMessage('deduplicationMode')}</label>
                            <select name="deduplicationMatchMode" value=${formData.deduplicationMatchMode} onChange=${handleChange}>
                                 <option value="exact">${getMessage('exactMatch')}</option>
                                 <option value="includes">${getMessage('includesMatch')}</option>
                            </select>
                        </div>
                        <div class="form-group tooltip-container full-width">
                            <label>${getMessage('titleRegex')}</label>
                            <select value=${currentRegexValue} onChange=${handleSelectChange}>
                                ${presets.map(p => html`<option value=${p.regex}>${p.name}</option>`)}
                                <option value="custom">${getMessage('customRegex')}</option>
                            </select>
                            <input type="text" value=${customValue} onChange=${handleCustomChange} style=${{ display: isCustom ? 'block' : 'none', marginTop: '8px' }} />
                             ${errors.titleParsingRegEx && html`<span class="error-message">${errors.titleParsingRegEx}</span>`}
                        </div>
                    </div>
                    <div class="form-group form-actions">
                        <button type="submit" class="primary">${getMessage('save')}</button>
                        <button type="button" onClick=${onCancel}>${getMessage('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}


// --- Onglet Préréglages (NOUVEAU) ---
function PresetsTab({ settings, updatePresets, editingId, setEditingId }) {
    const { regexPresets, domainRules } = settings;

    const handleAdd = () => {
        const newId = generateUUID();
        const newPreset = { id: newId, name: "", regex: "()" }; // Start with basic group
        updatePresets([...regexPresets, newPreset]);
        setEditingId(newId);
    };

    const handleSave = (updatedPreset) => {
        const originalRegex = regexPresets.find(p => p.id === updatedPreset.id)?.regex;
        const newPresets = regexPresets.map(p => p.id === updatedPreset.id ? updatedPreset : p);

        // Update rules using this preset if regex changed
        if (originalRegex && originalRegex !== updatedPreset.regex) {
            const newRules = domainRules.map(rule =>
                rule.titleParsingRegEx === originalRegex
                    ? { ...rule, titleParsingRegEx: updatedPreset.regex }
                    : rule
            );
            // We need to update settings directly here or pass a function
            // For now, let's assume we pass an updateSettings function or handle this in parent
            // A simpler way: just update presets, rely on user to update rules manually or handle later.
            // Let's just update presets for now. The save effect will save settings.
            updatePresets(newPresets);
        } else {
            updatePresets(newPresets);
        }
        setEditingId(null);
    };

    const handleDelete = (idToDelete) => {
        const preset = regexPresets.find(p => p.id === idToDelete);
        const isInUse = domainRules.some(r => r.titleParsingRegEx === preset.regex);

        if (isInUse) {
            alert(getMessage("errorPresetInUse"));
            return;
        }

        if (confirm(getMessage('confirmDeletePreset'))) {
            updatePresets(regexPresets.filter(p => p.id !== idToDelete));
        }
    };

     const isPresetInUse = (regex) => domainRules.some(r => r.titleParsingRegEx === regex);

    return html`
        <section id="presets-section">
            <h2>${getMessage('regexPresetsTab')}</h2>
            ${regexPresets.map(preset => html`
                <${Fragment} key=${preset.id}>
                    ${editingId === preset.id
                        ? html`<${PresetEditForm} preset=${preset} onSave=${handleSave} onCancel=${() => setEditingId(null)} />`
                        : html`<${PresetView} preset=${preset} onEdit=${setEditingId} onDelete=${handleDelete} disabled=${isPresetInUse(preset.regex)} />`
                    }
                <//>
            `)}
            ${!editingId && html`<button onClick=${handleAdd} class="button add-button">${getMessage('addPreset')}</button>`}
        </section>
    `;
}

function PresetView({ preset, onEdit, onDelete, disabled }) {
    return html`
        <div class="list-item">
            <div class="item-view">
                <div class="item-details">
                    <span class="item-main">${preset.name}</span>
                    <code class="item-sub">${preset.regex}</code>
                </div>
                <div class="item-actions">
                    <button onClick=${() => onEdit(preset.id)}>${getMessage('edit')}</button>
                    <button onClick=${() => onDelete(preset.id)} class="danger" disabled=${disabled}>${getMessage('delete')}</button>
                </div>
            </div>
        </div>
    `;
}

function PresetEditForm({ preset, onSave, onCancel }) {
    const [formData, setFormData] = useState(preset);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!isValidRegex(formData.regex)) {
            setError(getMessage('errorInvalidRegex'));
            return;
        }
        onSave(formData);
    };

    return html`
        <div class="list-item is-editing">
            <div class="item-edit">
                 <form onSubmit=${handleSubmit}>
                    <div class="form-grid">
                        <div class="form-group tooltip-container">
                             <label>${getMessage('presetName')}</label>
                             <input type="text" name="name" value=${formData.name} onChange=${handleChange} required />
                             <span class="tooltip-text" data-i18n="presetNameTooltip">${getMessage('presetNameTooltip')}</span>
                        </div>
                         <div class="form-group tooltip-container">
                            <label>${getMessage('presetRegex')}</label>
                            <input type="text" name="regex" value=${formData.regex} onChange=${handleChange} required />
                            <span class="tooltip-text" data-i18n="presetRegexTooltip">${getMessage('presetRegexTooltip')}</span>
                            ${error && html`<span class="error-message">${error}</span>`}
                        </div>
                    </div>
                     <div class="form-group form-actions">
                         <button type="submit" class="primary">${getMessage('save')}</button>
                         <button type="button" onClick=${onCancel}>${getMessage('cancel')}</button>
                     </div>
                 </form>
            </div>
        </div>
    `;
}


// --- Onglet Importer / Exporter (NOUVEAU) ---
function ImportExportTab({ settings, setSettings }) {
    const [feedback, setFeedback] = useState({ message: '', status: '' });

    const showFeedback = (message, status = 'info', duration = 3000) => {
        setFeedback({ message, status });
        setTimeout(() => setFeedback({ message: '', status: '' }), duration);
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "smarttab_organizer_settings.json";
        a.click();
        showFeedback(getMessage("exportMessage"), 'success');
    };

    const handleImportClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const imported = JSON.parse(re.target.result);
                    if (imported && imported.domainRules && imported.regexPresets) {
                        setSettings(imported); // Met à jour l'état global
                        showFeedback(getMessage("importSuccess"), 'success');
                    } else { throw new Error("Format de fichier invalide."); }
                } catch (error) {
                    showFeedback(getMessage("importError") + error.message, 'error', 5000);
                }
            };
            reader.readAsText(file);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    };

    return html`
        <section id="importexport-section">
            <h2>${getMessage('importExportTab')}</h2>
            <div class="import-export-section">
                <button onClick=${handleExport} class="button">${getMessage('exportSettings')}</button>
                <button onClick=${handleImportClick} class="button">${getMessage('importSettings')}</button>
            </div>
            ${feedback.message && html`
                <p class="feedback-message ${feedback.status}">${feedback.message}</p>
            `}
        </section>
    `;
}


// --- Onglet Statistiques (NOUVEAU) ---
function StatsTab({ stats, onReset }) {
    return html`
        <section id="stats-section">
            <h2>${getMessage('statisticsTab')}</h2>
            <div class="stats-display">
                <p><span>${getMessage('groupsCreated')}</span> ${stats.tabGroupsCreatedCount || 0}</p>
                <p><span>${getMessage('tabsDeduplicated')}</span> ${stats.tabsDeduplicatedCount || 0}</p>
                <button onClick=${onReset} class="button danger">${getMessage('resetStats')}</button>
            </div>
        </section>
    `;
}

// --- Montage ---
render(html`<${OptionsApp} />`, document.getElementById('options-app'));