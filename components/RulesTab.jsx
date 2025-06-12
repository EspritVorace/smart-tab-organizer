import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getMessage } from './../js/modules/i18n.js';
import { generateUUID, isValidDomain, isValidRegex } from './../js/modules/utils.js';
import Button from '@atlaskit/button';
import Textfield from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Checkbox from '@atlaskit/checkbox';
import Toggle from '@atlaskit/toggle';

const dedupModeKeyMap = {
    exact: 'exactMatch',
    includes: 'includesMatch',
    hostname: 'hostnameMatch',
    hostname_path: 'hostnamePathMatch',
};

const sourceKeyMap = {
    title: 'groupNameSourceTitle',
    url: 'groupNameSourceUrl',
    manual: 'groupNameSourceManual',
};

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

    const renderRuleItem = (rule) => (
        <Fragment key={rule.id}>
            {editingId === rule.id && (!newRuleInProgress || newRuleInProgress.id !== rule.id)
                ? <RuleEditForm rule={rule} presets={regexPresets} logicalGroups={logicalGroups || []} onSave={handleSave} onCancel={() => setEditingId(null)} allRules={domainRules} />
                : <RuleView rule={rule} presets={regexPresets} logicalGroups={logicalGroups || []} onEdit={setEditingId} onDelete={handleDelete} onToggle={handleSave} />
            }
        </Fragment>
    );

    return (
        <section id="rules-section">
            <h2>{getMessage('domainRulesTab')}</h2>

            {groupOrder.map(groupId => {
                const group = logicalGroups.find(g => g.id === groupId);
                const rulesInGroup = groupedRules[groupId];
                if (!group || rulesInGroup.length === 0) return null;

                const isExpanded = !collapsedGroups[groupId];
                return (
                    <div class="rules-group-container" key={groupId}>
                        <div
                            class={`rules-group-header ${group.color ? `group-color-${group.color}` : ''} ${getTextContrastClass(group.color)} ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleGroupCollapse(groupId)}
                        >
                            <span class="group-arrow">{isExpanded ? '▼' : '▶'}</span>
                            <span class="group-label">{group.label}</span>
                            <span class="rule-count">({rulesInGroup.length} {rulesInGroup.length === 1 ? getMessage('ruleCountSingular', 'rule') : getMessage('ruleCountPlural', 'rules')})</span>
                        </div>
                        <div class={`rules-group-content ${isExpanded ? 'expanded' : ''}`}>
                            {rulesInGroup.map(renderRuleItem)}
                        </div>
                    </div>
                );
            })}

            {ungroupedRules.length > 0 && (
                <div class="rules-group-container" key="_ungrouped">
                    <div
                        class={`rules-group-header ungrouped-rules-header ${!collapsedGroups['_ungrouped'] ? 'expanded' : ''}`}
                        onClick={() => toggleGroupCollapse('_ungrouped')}
                    >
                        <span class="group-arrow">{!collapsedGroups['_ungrouped'] ? '▼' : '▶'}</span>
                        <span class="group-label">{getMessage('ungroupedRules', 'Ungrouped Rules')}</span>
                        <span class="rule-count">({ungroupedRules.length} {ungroupedRules.length === 1 ? getMessage('ruleCountSingular', 'rule') : getMessage('ruleCountPlural', 'rules')})</span>
                    </div>
                    <div class={`rules-group-content ${!collapsedGroups['_ungrouped'] ? 'expanded' : ''}`}>
                        {ungroupedRules.map(renderRuleItem)}
                    </div>
                </div>
            )}

            {newRuleInProgress && editingId === newRuleInProgress.id && (
                <RuleEditForm rule={newRuleInProgress} presets={regexPresets} logicalGroups={logicalGroups || []} onSave={handleSave} onCancel={handleCancelNew} allRules={domainRules} />
            )}
            {!editingId && !newRuleInProgress && (
                <Button appearance="primary" onClick={handleAdd} className="add-button">{getMessage('addRule')}</Button>
            )}
        </section>
    );
}

function RuleView({ rule, presets, logicalGroups, onEdit, onDelete, onToggle }) { // Added logicalGroups
     const presetName = presets.find(p => p.regex === rule.titleParsingRegEx)?.name || rule.titleParsingRegEx;
     const urlPresetName = presets.find(p => p.urlRegex === rule.urlParsingRegEx)?.name || rule.urlParsingRegEx;
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
    subtitleParts.push(getMessage(sourceKeyMap[rule.groupNameSource] || 'groupNameSourceTitle'));

    return (
        <div class="list-item">
            <div class="item-view">
                <Checkbox
                    isChecked={rule.enabled}
                    onChange={handleToggle}
                    id={`enable-${rule.id}`}
                    label={
                        <span class="item-details">
                            <span class={`item-main ${disabledClass}`}>{rule.label}</span>
                            <span class={`item-sub ${disabledClass}`}>{subtitleParts.join(' | ')}</span>
                        </span>
                    }
                />
                <div class="item-actions">
                    <Button appearance="primary" onClick={() => onEdit(rule.id)}>{getMessage('edit')}</Button>
                    <Button appearance="danger" onClick={() => onDelete(rule.id)}>{getMessage('delete')}</Button>
                </div>
            </div>
        </div>
    );
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
    return (
        <div class="list-item is-editing">
            <div class="item-edit">
                 <form onSubmit={handleSubmit}>
                    <div class="form-grid">
                        <div class="form-group tooltip-container">
                            <label data-i18n="labelLabel">{getMessage('labelLabel', 'Label')}</label>
                            <Textfield name="label" value={formData.label} onChange={handleChange} isRequired />
                            <span class="tooltip-text" data-i18n="labelTooltip">{getMessage('labelTooltip', 'A unique, user-friendly name for this rule.')}</span>
                            {errors.label && <span class="error-message">{errors.label}</span>}
                        </div>
                        <div class="form-group tooltip-container">
                            <label>{getMessage('domainFilter')}</label>
                            <Textfield name="domainFilter" value={formData.domainFilter} onChange={handleChange} isRequired />
                            <span class="tooltip-text" data-i18n="domainFilterTooltip">{getMessage('domainFilterTooltip')}</span>
                            {errors.domainFilter && <span class="error-message">{errors.domainFilter}</span>}
                        </div>
                        <div class="form-group tooltip-container">
                            <label>{getMessage('deduplicationMode')}</label>
                            <Select
                                name="deduplicationMatchMode"
                                value={{ label: getMessage(dedupModeKeyMap[formData.deduplicationMatchMode] || 'exactMatch'), value: formData.deduplicationMatchMode }}
                                onChange={(opt) => handleChange({ target: { name: 'deduplicationMatchMode', value: opt.value } })}
                                options={[
                                    { label: getMessage('exactMatch'), value: 'exact' },
                                    { label: getMessage('includesMatch'), value: 'includes' },
                                    { label: getMessage('hostnameMatch'), value: 'hostname' },
                                    { label: getMessage('hostnamePathMatch'), value: 'hostname_path' },
                                ]}
                            />
                            <span class="tooltip-text" data-i18n="deduplicationModeTooltip">{getMessage('deduplicationModeTooltip')}</span>
                        </div>
                        <div class="form-group tooltip-container">
                            <label>{getMessage('groupNameSource')}</label>
                            <Select
                                name="groupNameSource"
                                inputId="groupNameSource"
                                value={{ label: getMessage(sourceKeyMap[formData.groupNameSource] || 'groupNameSourceTitle'), value: formData.groupNameSource }}
                                options={[
                                    { label: getMessage('groupNameSourceTitle'), value: 'title' },
                                    { label: getMessage('groupNameSourceUrl'), value: 'url' },
                                    { label: getMessage('groupNameSourceManual'), value: 'manual' },
                                ]}
                                onChange={(opt) => handleChange({ target: { name: 'groupNameSource', value: opt.value } })}
                            />
                            <span class="tooltip-text" data-i18n="groupNameSourceTooltip">{getMessage('groupNameSourceTooltip')}</span>
                        </div>
                        <div class="form-group tooltip-container">
                            <label>{getMessage('logicalGroup', 'Logical Group')}</label>
                            <Select
                                name="groupId"
                                inputId="logicalGroupSelect"
                                value={formData.groupId ? { label: logicalGroups.find(g => g.id === formData.groupId)?.label || '', value: formData.groupId } : { label: getMessage('noGroup', '-- No Group --'), value: '' }}
                                options={[{ label: getMessage('noGroup', '-- No Group --'), value: '' }, ...logicalGroups.map(g => ({ label: g.label, value: g.id }))]}
                                onChange={(opt) => handleChange({ target: { name: 'groupId', value: opt.value || null } })}
                            />
                            <span class="tooltip-text" data-i18n="logicalGroupRuleTooltip">{getMessage('logicalGroupRuleTooltip', 'Assign this rule to a logical group.')}</span>
                        </div>
                        {formData.groupNameSource === 'title' && (
                            <div class="form-group tooltip-container full-width">
                                <label>{getMessage('titleRegex')}</label>
                                <Select
                                    inputId="titleRegexSelect"
                                    value={currentRegexValue === 'custom' ? { label: getMessage('customRegex'), value: 'custom' } : { label: presets.find(p => p.regex === currentRegexValue)?.name || currentRegexValue, value: currentRegexValue }}
                                    onChange={(opt) => handleSelectChange({ target: { value: opt.value } })}
                                    options={[...presets.map(p => ({ label: p.name, value: p.regex })), { label: getMessage('customRegex'), value: 'custom' }]}
                                />
                                <Textfield value={customValue} onChange={handleCustomChange} style={{ display: isCustom ? 'block' : 'none', marginTop: '8px' }} />
                                <span class="tooltip-text" data-i18n="titleParsingRegExTooltip">{getMessage('titleParsingRegExTooltip')}</span>
                                {errors.titleParsingRegEx && <span class="error-message">{errors.titleParsingRegEx}</span>}
                            </div>
                        )}
                        {formData.groupNameSource === 'url' && (
                            <div class="form-group tooltip-container full-width">
                                <label>{getMessage('urlRegex')}</label>
                                <Select
                                    inputId="urlRegexSelect"
                                    value={currentUrlRegexValue === 'custom' ? { label: getMessage('customRegex'), value: 'custom' } : { label: presets.find(p => p.urlRegex === currentUrlRegexValue)?.name || currentUrlRegexValue, value: currentUrlRegexValue }}
                                    onChange={(opt) => handleUrlSelectChange({ target: { value: opt.value } })}
                                    options={[...presets.map(p => ({ label: p.name, value: p.urlRegex })), { label: getMessage('customRegex'), value: 'custom' }]}
                                />
                                <Textfield name="urlParsingRegEx" value={urlCustomValue} onChange={handleUrlCustomChange} style={{ display: isUrlCustom ? 'block' : 'none', marginTop: '8px' }} />
                                <span class="tooltip-text" data-i18n="urlParsingRegExTooltip">{getMessage('urlParsingRegExTooltip')}</span>
                                {errors.urlParsingRegEx && <span class="error-message">{errors.urlParsingRegEx}</span>}
                            </div>
                        )}
                    </div>
                    <div class="form-actions">
                        <Button type="submit" appearance="primary">{getMessage('save')}</Button>
                        <Button type="button" onClick={onCancel}>{getMessage('cancel')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { RulesTab };
