import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from '../utils/htm.mjs';
import { getMessage } from '../modules/i18n.js';
import { generateUUID, isValidDomain, isValidRegex } from '../modules/utils.js';

const html = htm.bind(h);

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
            urlParsingRegEx: regexPresets[0]?.urlRegex || "",
            groupNameSource: "title",
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
     const urlPresetName = presets.find(p => p.urlRegex === rule.urlParsingRegEx)?.name || rule.urlParsingRegEx;
     const dedupModeKeyMap = {
        'exact': 'exactMatch',
        'includes': 'includesMatch',
        'hostname': 'hostnameMatch',
        'hostname_path': 'hostnamePathMatch'
     };
    const dedupMode = getMessage(dedupModeKeyMap[rule.deduplicationMatchMode] || 'exactMatch');
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
    const activeRegexName = rule.groupNameSource === 'title' ? presetName :
                            rule.groupNameSource === 'url' ? urlPresetName : '';
    if (activeRegexName) {
        subtitleParts.push(activeRegexName);
    }
    subtitleParts.push(dedupMode);
    const sourceKeyMap = { 'title': 'groupNameSourceTitle', 'url': 'groupNameSourceUrl', 'manual': 'groupNameSourceManual' };
    subtitleParts.push(getMessage(sourceKeyMap[rule.groupNameSource] || 'groupNameSourceTitle'));

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
    const [formData, setFormData] = useState({
        ...rule,
        groupId: rule.groupId === undefined ? null : rule.groupId,
        groupNameSource: rule.groupNameSource || 'title',
        urlParsingRegEx: rule.urlParsingRegEx || ''
    });
    const [errors, setErrors] = useState({});

    const isPreset = presets.some(p => p.regex === formData.titleParsingRegEx);
    const [isCustom, setIsCustom] = useState(!isPreset);
    const [customValue, setCustomValue] = useState(isPreset ? '' : formData.titleParsingRegEx);

    const isUrlPreset = presets.some(p => p.urlRegex === formData.urlParsingRegEx);
    const [isUrlCustom, setIsUrlCustom] = useState(!isUrlPreset);
    const [urlCustomValue, setUrlCustomValue] = useState(isUrlPreset ? '' : formData.urlParsingRegEx);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'groupNameSource') {
            if (value === 'title' && !formData.titleParsingRegEx) {
                setFormData(prev => ({
                    ...prev,
                    groupNameSource: value,
                    titleParsingRegEx: presets[0]?.regex || ''
                }));
                return;
            } else if (value === 'url' && !formData.urlParsingRegEx) {
                setFormData(prev => ({
                    ...prev,
                    groupNameSource: value,
                    urlParsingRegEx: presets[0]?.urlRegex || ''
                }));
                return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e) => {
         const value = e.target.value;
         if(value === 'custom') {
            setIsCustom(true);
            setFormData(prev => ({ ...prev, titleParsingRegEx: customValue }));
         } else {
            setIsCustom(false);
            const selectedPreset = presets.find(p => p.regex === value);
            setFormData(prev => ({
                ...prev,
                titleParsingRegEx: value,
                urlParsingRegEx: isUrlCustom ? prev.urlParsingRegEx : (selectedPreset?.urlRegex || '')
            }));
            if (!isUrlCustom) {
                setUrlCustomValue(selectedPreset?.urlRegex || '');
            }
         }
    };

    const handleCustomChange = (e) => {
        setCustomValue(e.target.value);
        if (isCustom) {
            setFormData(prev => ({ ...prev, titleParsingRegEx: e.target.value }));
        }
    };

    const handleUrlSelectChange = (e) => {
        const value = e.target.value;
        if (value === 'custom') {
            setIsUrlCustom(true);
            setFormData(prev => ({ ...prev, urlParsingRegEx: urlCustomValue }));
        } else {
            setIsUrlCustom(false);
            setFormData(prev => ({ ...prev, urlParsingRegEx: value }));
        }
    };

    const handleUrlCustomChange = (e) => {
        setUrlCustomValue(e.target.value);
        if (isUrlCustom) {
            setFormData(prev => ({ ...prev, urlParsingRegEx: e.target.value }));
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
        if (formData.urlParsingRegEx && !isValidRegex(formData.urlParsingRegEx)) {
            currentErrors.urlParsingRegEx = getMessage('errorInvalidRegex');
        }
        setErrors(currentErrors);

        if (Object.keys(currentErrors).length === 0) {
            onSave(formData);
        }
    };

    const currentRegexValue = isCustom ? 'custom' : formData.titleParsingRegEx;
    const currentUrlRegexValue = isUrlCustom ? 'custom' : formData.urlParsingRegEx;

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
                                 <option value="hostname">${getMessage('hostnameMatch')}</option>
                                 <option value="hostname_path">${getMessage('hostnamePathMatch')}</option>
                            </select>
                            <span class="tooltip-text" data-i18n="deduplicationModeTooltip">${getMessage('deduplicationModeTooltip')}</span>
                        </div>
                        <div class="form-group tooltip-container">
                            <label>${getMessage('groupNameSource')}</label>
                            <select name="groupNameSource" value=${formData.groupNameSource} onChange=${handleChange}>
                                <option value="title">${getMessage('groupNameSourceTitle')}</option>
                                <option value="url">${getMessage('groupNameSourceUrl')}</option>
                                <option value="manual">${getMessage('groupNameSourceManual')}</option>
                            </select>
                            <span class="tooltip-text" data-i18n="groupNameSourceTooltip">${getMessage('groupNameSourceTooltip')}</span>
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
                        ${formData.groupNameSource === 'title' && html`
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
                        `}
                        ${formData.groupNameSource === 'url' && html`
                            <div class="form-group tooltip-container full-width">
                                <label>${getMessage('urlRegex')}</label>
                                <select value=${currentUrlRegexValue} onChange=${handleUrlSelectChange}>
                                    ${presets.map(p => html`<option value=${p.urlRegex}>${p.name}</option>`)}
                                    <option value="custom">${getMessage('customRegex')}</option>
                                </select>
                                <input type="text" name="urlParsingRegEx" value=${urlCustomValue} onChange=${handleUrlCustomChange} style=${{ display: isUrlCustom ? 'block' : 'none', marginTop: '8px' }} />
                                <span class="tooltip-text" data-i18n="urlParsingRegExTooltip">${getMessage('urlParsingRegExTooltip')}</span>
                                ${errors.urlParsingRegEx && html`<span class="error-message">${errors.urlParsingRegEx}</span>`}
                            </div>
                        `}
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="primary">${getMessage('save')}</button>
                        <button type="button" onClick=${onCancel}>${getMessage('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

export { RulesTab };
