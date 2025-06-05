// options/options.js
import { h, render, Fragment } from './../js/lib/preact.mjs';
import { useState, useEffect, useCallback } from './../js/lib/preact-hooks.mjs';
import htm from './../js/lib/htm.mjs';

import { getSettings, saveSettings, getStatistics, resetStatistics } from './../js/modules/storage.js';
import { generateUUID, isValidDomain, isValidRegex } from './../js/modules/utils.js';
import { getMessage } from './../js/modules/i18n.js';
import { applyTheme } from './../js/modules/theme.js';

const html = htm.bind(h);

const LOGICAL_GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

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
                ${currentTab === 'presets' && html`<${PresetsTab} settings=${settings} updatePresets=${updatePresets} editingId=${editingPresetId} setEditingId=${setEditingPresetId} />`}
                ${currentTab === 'logicalGroups' && html`<${LogicalGroupsTab} settings=${settings} setSettings=${setSettings} editingId=${editingLogicalGroupId} setEditingId=${setEditingLogicalGroupId} />`}
                ${currentTab === 'importexport' && html`<${ImportExportTab} settings=${settings} setSettings=${setSettings} />`}
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

// ... Autres sous-composants (RulesTab, PresetsTab, ImportExportTab, StatsTab) ...
// Pour la brièveté, voici un exemple pour RulesTab. Les autres suivraient une logique similaire.

function RulesTab({ settings, updateRules, editingId, setEditingId }) {
    const { domainRules, regexPresets, logicalGroups = [] } = settings; // Destructure and default logicalGroups
    const [newRuleInProgress, setNewRuleInProgress] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState({});

    // Initialize collapsed states
    useEffect(() => {
        const initialCollapsedState = {};
        logicalGroups.forEach(group => {
            initialCollapsedState[group.id] = true; // Collapse all by default
        });
        initialCollapsedState['_ungrouped'] = true; // Collapse ungrouped by default too
        setCollapsedGroups(initialCollapsedState);
    }, [logicalGroups]); // Re-run if logicalGroups array changes

    const toggleGroupCollapse = (groupId) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Helper function to determine text color based on background
    // Based on common brightness perceptions.
    const getTextContrastClass = (bgColorName) => {
        switch (bgColorName) {
            case 'blue':
            case 'red':
            case 'green':
            case 'purple':
                return 'group-header-text-light';
            case 'grey':
            case 'yellow':
            case 'pink':
            case 'cyan':
            case 'orange':
            default:
                return 'group-header-text-dark';
        }
    };

    const handleAdd = () => {
        const newId = generateUUID();
        // Initialize label and groupId for new rules
        const newRule = {
            id: newId,
            label: "",
            enabled: true,
            domainFilter: "",
            titleParsingRegEx: regexPresets[0]?.regex || "",
            deduplicationMatchMode: "exact",
            groupId: null // Default to no group
        };
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

    // Prepare data for rendering
    const groupedRules = {};
    const ungroupedRules = [];
    const groupOrder = logicalGroups.map(g => g.id); // Maintain original order of groups

    logicalGroups.forEach(group => {
        groupedRules[group.id] = [];
    });

    domainRules.forEach(rule => {
        if (rule.groupId && groupedRules[rule.groupId]) {
            groupedRules[rule.groupId].push(rule);
        } else {
            ungroupedRules.push(rule);
        }
    });

    const renderRuleItem = (rule) => html`
        <${Fragment} key=${rule.id}>
            ${editingId === rule.id && (!newRuleInProgress || newRuleInProgress.id !== rule.id)
                ? html`<${RuleEditForm} rule=${rule} presets=${regexPresets} logicalGroups=${logicalGroups || []} onSave=${handleSave} onCancel=${() => setEditingId(null)} allRules=${domainRules} />`
                : html`<${RuleView} rule=${rule} presets=${regexPresets} logicalGroups=${logicalGroups || []} onEdit=${setEditingId} onDelete=${handleDelete} onToggle=${handleSave} />`
            }
        <//>
    `;

    return html`
        <section id="rules-section">
            <h2>${getMessage('domainRulesTab')}</h2>

            ${groupOrder.map(groupId => {
                const group = logicalGroups.find(g => g.id === groupId);
                const rulesInGroup = groupedRules[groupId];
                if (!group || rulesInGroup.length === 0) return null; // Don't render group if no rules or group deleted

                const isExpanded = !collapsedGroups[groupId];
                return html`
                    <div class="rules-group-container" key=${groupId}>
                        <div
                            class="rules-group-header ${group.color ? `group-color-${group.color}` : ''} ${getTextContrastClass(group.color)} ${isExpanded ? 'expanded' : ''}"
                            onClick=${() => toggleGroupCollapse(groupId)}
                        >
                            <span class="group-arrow">${isExpanded ? '▼' : '▶'}</span>
                            <span class="group-label">${group.label}</span>
                            <span class="rule-count">(${rulesInGroup.length} ${rulesInGroup.length === 1 ? getMessage('ruleCountSingular', 'rule') : getMessage('ruleCountPlural', 'rules')})</span>
                        </div>
                        <div class="rules-group-content ${isExpanded ? 'expanded' : ''}">
                            ${rulesInGroup.map(renderRuleItem)}
                        </div>
                    </div>
                `;
            })}

            ${ungroupedRules.length > 0 && html`
                <div class="rules-group-container" key="_ungrouped">
                    <div
                        class="rules-group-header ungrouped-rules-header ${!collapsedGroups['_ungrouped'] ? 'expanded' : ''}"
                        onClick=${() => toggleGroupCollapse('_ungrouped')}
                    >
                        <span class="group-arrow">${!collapsedGroups['_ungrouped'] ? '▼' : '▶'}</span>
                        <span class="group-label">${getMessage('ungroupedRules', 'Ungrouped Rules')}</span>
                         <span class="rule-count">(${ungroupedRules.length} ${ungroupedRules.length === 1 ? getMessage('ruleCountSingular', 'rule') : getMessage('ruleCountPlural', 'rules')})</span>
                    </div>
                    <div class="rules-group-content ${!collapsedGroups['_ungrouped'] ? 'expanded' : ''}">
                        ${ungroupedRules.map(renderRuleItem)}
                    </div>
                </div>
            `}

            ${newRuleInProgress && editingId === newRuleInProgress.id && html`
                <${RuleEditForm} rule=${newRuleInProgress} presets=${regexPresets} logicalGroups=${logicalGroups || []} onSave=${handleSave} onCancel=${handleCancelNew} allRules=${domainRules} />
            `}
            ${!editingId && !newRuleInProgress && html`<button onClick=${handleAdd} class="button add-button">${getMessage('addRule')}</button>`}
        </section>
    `;
}

function RuleView({ rule, presets, logicalGroups, onEdit, onDelete, onToggle }) { // Added logicalGroups
     const presetName = presets.find(p => p.regex === rule.titleParsingRegEx)?.name || rule.titleParsingRegEx;
     const dedupMode = getMessage(rule.deduplicationMatchMode === 'exact' ? 'exactMatch' : 'includesMatch');
     const disabledClass = rule.enabled ? '' : 'disabled-text';

     const handleToggle = (e) => {
        onToggle({ ...rule, enabled: e.target.checked });
     };

    const group = rule.groupId && logicalGroups ? logicalGroups.find(g => g.id === rule.groupId) : null;
    const groupColorClass = group ? `group-color-${group.color}` : '';
    // Ensure groupLabelText is derived from the potentially updated logicalGroups prop
    // const groupLabelText = group ? group.label : getMessage('noGroupAssigned', 'No group'); // Removed as per new logic

    const subtitleParts = [];
    if (!group) { // Rule is ungrouped
        subtitleParts.push(getMessage('noGroupAssigned', 'No group'));
    }
    subtitleParts.push(rule.domainFilter);
    subtitleParts.push(presetName);
    subtitleParts.push(dedupMode);

    return html`
        <div class="list-item">
            <div class="item-view">
                <input type="checkbox" id="enable-${rule.id}" checked=${rule.enabled} onChange=${handleToggle} />
                <label for="enable-${rule.id}" class="item-details">
                    <span class="item-main ${disabledClass}">${rule.label}</span>
                    <span class="item-sub ${disabledClass}">
                        ${subtitleParts.join(' | ')}
                    </span>
                </label>
                <div class="item-actions">
                    <button onClick=${() => onEdit(rule.id)}>${getMessage('edit')}</button>
                    <button onClick=${() => onDelete(rule.id)} class="danger">${getMessage('delete')}</button>
                </div>
            </div>
        </div>
    `;
}

function RuleEditForm({ rule, presets, logicalGroups, onSave, onCancel, allRules }) {
    const [formData, setFormData] = useState({...rule, groupId: rule.groupId === undefined ? null : rule.groupId });
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
        // Label validation
        if (!formData.label || formData.label.trim() === "") {
            currentErrors.label = getMessage('errorLabelRequired', 'Label is required'); // Fallback text
        } else if (allRules && allRules.some(r => r.id !== formData.id && r.label.toLowerCase() === formData.label.toLowerCase())) {
            // Uniqueness check for label (case-insensitive) using the passed 'allRules' prop
            currentErrors.label = getMessage('errorLabelUnique', 'Label must be unique'); // Fallback text
        }

        if (!isValidDomain(formData.domainFilter)) {
            currentErrors.domainFilter = getMessage('errorInvalidDomain');
        }
        if (!isValidRegex(formData.titleParsingRegEx)) {
            currentErrors.titleParsingRegEx = getMessage('errorInvalidRegex');
        }
        setErrors(currentErrors);

        if (Object.keys(currentErrors).length === 0) {
            onSave(formData);
        }
    };

     const currentRegexValue = isCustom ? 'custom' : formData.titleParsingRegEx;

    // The following div was changed from full-width to allow group selector beside it potentially
    return html`
        <div class="list-item is-editing">
            <div class="item-edit">
                 <form onSubmit=${handleSubmit}>
                    <div class="form-grid">
                        <div class="form-group tooltip-container">
                            <label data-i18n="labelLabel">${getMessage('labelLabel', 'Label')}</label>
                            <input type="text" name="label" value=${formData.label} onChange=${handleChange} required />
                            <span class="tooltip-text" data-i18n="labelTooltip">${getMessage('labelTooltip', 'A unique, user-friendly name for this rule.')}</span>
                            ${errors.label && html`<span class="error-message">${errors.label}</span>`}
                        </div>
                        <div class="form-group tooltip-container">
                            <label>${getMessage('domainFilter')}</label>
                            <input type="text" name="domainFilter" value=${formData.domainFilter} onChange=${handleChange} required />
                            <span class="tooltip-text" data-i18n="domainFilterTooltip">${getMessage('domainFilterTooltip')}</span>
                            ${errors.domainFilter && html`<span class="error-message">${errors.domainFilter}</span>`}
                        </div>
                        <div class="form-group tooltip-container">
                            <label>${getMessage('deduplicationMode')}</label>
                            <select name="deduplicationMatchMode" value=${formData.deduplicationMatchMode} onChange=${handleChange}>
                                 <option value="exact">${getMessage('exactMatch')}</option>
                                 <option value="includes">${getMessage('includesMatch')}</option>
                            </select>
                            <span class="tooltip-text" data-i18n="deduplicationModeTooltip">${getMessage('deduplicationModeTooltip')}</span>
                        </div>
                        <div class="form-group tooltip-container">
                            <label>${getMessage('logicalGroup', 'Logical Group')}</label>
                            <select name="groupId" value=${formData.groupId === null ? "" : formData.groupId} onChange=${handleChange}>
                                <option value="">${getMessage('noGroup', '-- No Group --')}</option>
                                ${logicalGroups.map(g => html`
                                    <option value=${g.id}>${g.label}</option>
                                `)}
                            </select>
                            <span class="tooltip-text" data-i18n="logicalGroupRuleTooltip">${getMessage('logicalGroupRuleTooltip', 'Assign this rule to a logical group.')}</span>
                        </div>
                        <div class="form-group tooltip-container full-width">
                            <label>${getMessage('titleRegex')}</label>
                            <select value=${currentRegexValue} onChange=${handleSelectChange}>
                                ${presets.map(p => html`<option value=${p.regex}>${p.name}</option>`)}
                                <option value="custom">${getMessage('customRegex')}</option>
                            </select>
                            <input type="text" value=${customValue} onChange=${handleCustomChange} style=${{ display: isCustom ? 'block' : 'none', marginTop: '8px' }} />
                            <span class="tooltip-text" data-i18n="titleParsingRegExTooltip">${getMessage('titleParsingRegExTooltip')}</span>
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
    const [newPresetInProgress, setNewPresetInProgress] = useState(null);

    const handleAdd = () => {
        const newId = generateUUID();
        const newPreset = { id: newId, name: "", regex: "()" }; // Start with basic group
        setNewPresetInProgress(newPreset);
        setEditingId(newId);
    };

    const handleSave = (updatedPreset) => {
        if (newPresetInProgress && updatedPreset.id === newPresetInProgress.id) {
            updatePresets([...regexPresets, updatedPreset]);
            setNewPresetInProgress(null);
        } else {
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
                // TODO: Consider updating settings.domainRules directly or via a passed callback
                updatePresets(newPresets);
            } else {
                updatePresets(newPresets);
            }
        }
        setEditingId(null);
    };

    const handleCancelNew = () => {
        setNewPresetInProgress(null);
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
                    ${editingId === preset.id && (!newPresetInProgress || newPresetInProgress.id !== preset.id)
                        ? html`<${PresetEditForm} preset=${preset} onSave=${handleSave} onCancel=${() => setEditingId(null)} />`
                        : html`<${PresetView} preset=${preset} onEdit=${setEditingId} onDelete=${handleDelete} disabled=${isPresetInUse(preset.regex)} />`
                    }
                <//>
            `)}
            ${newPresetInProgress && editingId === newPresetInProgress.id && html`
                <${PresetEditForm} preset=${newPresetInProgress} onSave=${handleSave} onCancel=${handleCancelNew} />
            `}
            ${!editingId && !newPresetInProgress && html`<button onClick=${handleAdd} class="button add-button">${getMessage('addPreset')}</button>`}
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

// --- Onglet Groupes Logiques (NOUVEAU Placeholder) ---
function LogicalGroupsTab({ settings, setSettings, editingId, setEditingId }) {
    const { logicalGroups = [], domainRules = [] } = settings; // Default to empty arrays

    const [showAddForm, setShowAddForm] = useState(false);
    // State for Add form
    const [newGroupLabel, setNewGroupLabel] = useState('');
    const [newGroupColor, setNewGroupColor] = useState(LOGICAL_GROUP_COLORS[0]);
    const [addFormError, setAddFormError] = useState('');
    // State for Edit form
    const [currentEditData, setCurrentEditData] = useState(null);
    const [editFormError, setEditFormError] = useState('');


    if (!settings.logicalGroups) { // Check specifically settings.logicalGroups for initial load
        return html`<p>${getMessage('loadingText', 'Loading...')}</p>`;
    }

    // --- Edit Logic ---
    useEffect(() => {
        if (editingId && logicalGroups) {
            const groupToEdit = logicalGroups.find(g => g.id === editingId);
            if (groupToEdit) {
                setCurrentEditData({ ...groupToEdit });
                setShowAddForm(false); // Ensure add form is hidden when editing
                setEditFormError('');
            } else {
                setEditingId(null); // Group not found, clear editingId
            }
        } else {
            setCurrentEditData(null);
        }
    }, [editingId, logicalGroups]);

    const handleEditLabelChange = (e) => {
        setCurrentEditData(prev => ({ ...prev, label: e.target.value }));
    };
    const handleEditColorChange = (e) => {
        setCurrentEditData(prev => ({ ...prev, color: e.target.value }));
    };

    const handleSaveEditGroup = () => {
        setEditFormError('');
        if (!currentEditData.label.trim()) {
            setEditFormError(getMessage('errorLabelRequired', 'Label is required.'));
            return;
        }
        // Check uniqueness only against *other* groups
        if (logicalGroups.some(g => g.id !== editingId && g.label.toLowerCase() === currentEditData.label.trim().toLowerCase())) {
            setEditFormError(getMessage('errorLabelUnique', 'Label must be unique.'));
            return;
        }
        const updatedGroups = logicalGroups.map(g => g.id === editingId ? { ...currentEditData } : g);
        setSettings(prev => ({ ...prev, logicalGroups: updatedGroups }));
        setEditingId(null); // This will also clear currentEditData via useEffect
    };

    const handleCancelEdit = () => {
        setEditingId(null); // This will also clear currentEditData via useEffect
        setEditFormError('');
    };

    // --- Add Logic ---
    const handleAddGroup = () => {
        setAddFormError('');
        if (!newGroupLabel.trim()) {
            setAddFormError(getMessage('errorLabelRequired', 'Label is required.'));
            return;
        }
        if (logicalGroups.some(g => g.label.toLowerCase() === newGroupLabel.trim().toLowerCase())) {
            setAddFormError(getMessage('errorLabelUnique', 'Label must be unique.'));
            return;
        }

        const newGroup = {
            id: generateUUID(),
            label: newGroupLabel.trim(),
            color: newGroupColor,
        };
        setSettings(prev => ({ ...prev, logicalGroups: [...prev.logicalGroups, newGroup] }));
        setNewGroupLabel('');
        setNewGroupColor(LOGICAL_GROUP_COLORS[0]);
        setShowAddForm(false);
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setNewGroupLabel('');
        setNewGroupColor(LOGICAL_GROUP_COLORS[0]);
        setAddFormError('');
    };

    return html`
        <section id="logical-groups-section">
            <h2>${getMessage('logicalGroupsTab', 'Logical Groups')}</h2>

            ${logicalGroups.map(group => html`
                <div class="list-item" key=${group.id}>
                    <div class="item-view">
                        <span class="group-color-swatch ${'group-color-' + group.color}"></span>
                        <div class="item-details">
                            <span class="item-main">${group.label}</span>
                            <code class="item-sub">ID: ${group.id}</code>
                        </div>
                        <div class="item-actions">
                            <button onClick=${() => { setEditingId(group.id); setShowAddForm(false); }}>${getMessage('edit', 'Edit')}</button>
                            <button class="danger" onClick=${() => handleDeleteGroup(group.id, group.label)}>${getMessage('delete', 'Delete')}</button>
                        </div>
                    </div>
                </div>
            `)}

            ${!showAddForm && !editingId && !currentEditData && html`
                <button onClick=${() => { setShowAddForm(true); setEditingId(null); }} class="button add-button">
                    ${getMessage('addLogicalGroup', 'Add Logical Group')}
                </button>
            `}

            ${showAddForm && !editingId && !currentEditData && html`
                <div class="list-item is-editing">
                    <div class="item-edit">
                        <h3>${getMessage('addNewLogicalGroup', 'Add New Logical Group')}</h3>
                        <div class="form-group">
                            <label for="add-group-label">${getMessage('labelLabel', 'Label')}</label> {/* Changed groupLabel to labelLabel */}
                            <input
                                type="text"
                                id="add-group-label"
                                value=${newGroupLabel}
                                onInput=${(e) => setNewGroupLabel(e.target.value)}
                            />
                            ${addFormError && html`<span class="error-message">${addFormError}</span>`}
                        </div>
                        <div class="form-group">
                            <label for="add-group-color">${getMessage('groupColor', 'Color')}</label>
                            <select
                                id="add-group-color"
                                value=${newGroupColor}
                                onChange=${(e) => setNewGroupColor(e.target.value)}
                            >
                                ${LOGICAL_GROUP_COLORS.map(color => html`
                                    <option value=${color}>${getMessage(`color_${color}`, color)}</option>
                                `)}
                            </select>
                        </div>
                        <div class="form-actions">
                            <button onClick=${handleAddGroup} class="primary">${getMessage('save', 'Save')}</button>
                            <button onClick=${handleCancelAdd}>${getMessage('cancel', 'Cancel')}</button>
                        </div>
                    </div>
                </div>
            `}

            ${editingId && currentEditData && html`
                <div class="list-item is-editing">
                    <div class="item-edit">
                        <h3>${getMessage('editLogicalGroup', 'Edit Logical Group')}</h3>
                        <div class="form-group">
                            <label for="edit-group-label-${currentEditData.id}">${getMessage('labelLabel', 'Label')}</label> {/* Changed groupLabel to labelLabel */}
                            <input
                                type="text"
                                id="edit-group-label-${currentEditData.id}"
                                value=${currentEditData.label}
                                onInput=${handleEditLabelChange}
                            />
                            ${editFormError && html`<span class="error-message">${editFormError}</span>`}
                        </div>
                        <div class="form-group">
                            <label for="edit-group-color-${currentEditData.id}">${getMessage('groupColor', 'Color')}</label>
                            <select
                                id="edit-group-color-${currentEditData.id}"
                                value=${currentEditData.color}
                                onChange=${handleEditColorChange}
                            >
                                ${LOGICAL_GROUP_COLORS.map(color => html`
                                    <option value=${color}>${getMessage(`color_${color}`, color)}</option>
                                `)}
                            </select>
                        </div>
                        <div class="form-actions">
                            <button onClick=${handleSaveEditGroup} class="primary">${getMessage('save', 'Save')}</button>
                            <button onClick=${handleCancelEdit}>${getMessage('cancel', 'Cancel')}</button>
                        </div>
                    </div>
                </div>
            `}
        </section>
    `;
}

// --- Montage ---
render(html`<${OptionsApp} />`, document.getElementById('options-app'));