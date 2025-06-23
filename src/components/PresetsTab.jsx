import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { getMessage } from '../utils/i18n.js';
import { generateUUID, isValidRegex } from '../utils/utils.js';

function PresetsTab({ settings, updatePresets, updateRules, editingId, setEditingId }) {
    const { regexPresets, domainRules } = settings;
    const [newPresetInProgress, setNewPresetInProgress] = useState(null);

    const handleAdd = () => {
        const newId = generateUUID();
        const newPreset = { id: newId, name: "", regex: "()", urlRegex: "" }; // Start with basic group
        setNewPresetInProgress(newPreset);
        setEditingId(newId);
    };

    const handleSave = (updatedPreset) => {
        if (newPresetInProgress && updatedPreset.id === newPresetInProgress.id) {
            updatePresets([...regexPresets, updatedPreset]);
            setNewPresetInProgress(null);
        } else {
            const foundPreset = regexPresets.find(p => p.id === updatedPreset.id) || {};
            const originalRegex = foundPreset.regex;
            const originalUrlRegex = foundPreset.urlRegex;
            const newPresets = regexPresets.map(p => p.id === updatedPreset.id ? updatedPreset : p);

            let newRules = domainRules;
            if (originalRegex && originalRegex !== updatedPreset.regex) {
                newRules = newRules.map(rule =>
                    rule.titleParsingRegEx === originalRegex
                        ? { ...rule, titleParsingRegEx: updatedPreset.regex }
                        : rule
                );
            }
            if (originalUrlRegex && originalUrlRegex !== updatedPreset.urlRegex) {
                newRules = newRules.map(rule =>
                    rule.urlParsingRegEx === originalUrlRegex
                        ? { ...rule, urlParsingRegEx: updatedPreset.urlRegex }
                        : rule
                );
            }
            if (newRules !== domainRules) {
                updateRules(newRules);
            }
            updatePresets(newPresets);
        }
        setEditingId(null);
    };

    const handleCancelNew = () => {
        setNewPresetInProgress(null);
        setEditingId(null);
    };

    const handleDelete = (idToDelete) => {
        const preset = regexPresets.find(p => p.id === idToDelete);
        const isInUse = domainRules.some(r => r.titleParsingRegEx === preset.regex || r.urlParsingRegEx === preset.urlRegex);

        if (isInUse) {
            alert(getMessage("errorPresetInUse"));
            return;
        }

        if (confirm(getMessage('confirmDeletePreset'))) {
            updatePresets(regexPresets.filter(p => p.id !== idToDelete));
        }
    };

     const isPresetInUse = (regex, urlRegex) => domainRules.some(r => r.titleParsingRegEx === regex || r.urlParsingRegEx === urlRegex);

    return (
        <section id="presets-section">
            <h2>{getMessage('regexPresetsTab')}</h2>
            {regexPresets.map(preset => (
                <Fragment key={preset.id}>
                    {editingId === preset.id && (!newPresetInProgress || newPresetInProgress.id !== preset.id)
                        ? <PresetEditForm preset={preset} onSave={handleSave} onCancel={() => setEditingId(null)} />
                        : <PresetView preset={preset} onEdit={setEditingId} onDelete={handleDelete} disabled={isPresetInUse(preset.regex, preset.urlRegex)} />
                    }
                </Fragment>
            ))}
            {newPresetInProgress && editingId === newPresetInProgress.id && 
                <PresetEditForm preset={newPresetInProgress} onSave={handleSave} onCancel={handleCancelNew} />
            }
            {!editingId && !newPresetInProgress && <button onClick={handleAdd} className="button add-button">{getMessage('addPreset')}</button>}
        </section>
    );
}

function PresetView({ preset, onEdit, onDelete, disabled }) {
    return (
        <div className="list-item">
            <div className="item-view">
                <div className="item-details">
                    <span className="item-main">{preset.name}</span>
                    <code className="item-sub">{preset.regex}{preset.urlRegex ? ` | ${preset.urlRegex}` : ''}</code>
                </div>
                <div className="item-actions">
                    <button onClick={() => onEdit(preset.id)}>{getMessage('edit')}</button>
                    <button onClick={() => onDelete(preset.id)} className="danger" disabled={disabled}>{getMessage('delete')}</button>
                </div>
            </div>
        </div>
    );
}

function PresetEditForm({ preset, onSave, onCancel }) {
    const [formData, setFormData] = useState({ ...preset, urlRegex: preset.urlRegex || '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!isValidRegex(formData.regex) || (formData.urlRegex && !isValidRegex(formData.urlRegex))) {
            setError(getMessage('errorInvalidRegex'));
            return;
        }
        onSave(formData);
    };

    return (
        <div className="list-item is-editing">
            <div className="item-edit">
                 <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group tooltip-container">
                             <label>{getMessage('presetName')}</label>
                             <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                             <span className="tooltip-text" data-i18n="presetNameTooltip">{getMessage('presetNameTooltip')}</span>
                        </div>
                        <div className="form-group tooltip-container">
                            <label>{getMessage('presetRegex')}</label>
                            <input type="text" name="regex" value={formData.regex} onChange={handleChange} required />
                            <span className="tooltip-text" data-i18n="presetRegexTooltip">{getMessage('presetRegexTooltip')}</span>
                            {error && <span className="error-message">{error}</span>}
                        </div>
                        <div className="form-group tooltip-container">
                            <label>{getMessage('urlRegex')}</label>
                            <input type="text" name="urlRegex" value={formData.urlRegex} onChange={handleChange} />
                            <span className="tooltip-text" data-i18n="urlParsingRegExTooltip">{getMessage('urlParsingRegExTooltip')}</span>
                        </div>
                    </div>
                     <div className="form-actions">
                         <button type="submit" className="primary">{getMessage('save')}</button>
                         <button type="button" onClick={onCancel}>{getMessage('cancel')}</button>
                     </div>
                 </form>
            </div>
        </div>
    );
}

export { PresetsTab };
