import { h, Fragment } from './../../js/lib/preact.mjs';
import { useState } from './../../js/lib/preact-hooks.mjs';
import htm from './../../js/lib/htm.mjs';
import { getMessage } from './../../js/modules/i18n.js';
import { generateUUID, isValidRegex } from './../../js/modules/utils.js';

const html = htm.bind(h);

function PresetsTab({ settings, updatePresets, updateRules, editingId, setEditingId }) {
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
                updateRules(newRules);
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
                     <div class="form-actions">
                         <button type="submit" class="primary">${getMessage('save')}</button>
                         <button type="button" onClick=${onCancel}>${getMessage('cancel')}</button>
                     </div>
                 </form>
            </div>
        </div>
    `;
}

export { PresetsTab };
