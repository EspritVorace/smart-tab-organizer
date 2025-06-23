import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import htm from '../utils/lib/htm.mjs';
import { getMessage } from '../utils/i18n.js';
import { generateUUID } from '../utils/utils.js';

const html = htm.bind(h);

const LOGICAL_GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// --- Composants pour LogicalGroupsTab ---
function LogicalGroupView({ group, onEdit, onDelete }) {
    return html`
        <div class="list-item" key=${group.id}>
            <div class="item-view">
                <span class="group-color-swatch ${'group-color-' + group.color}"></span>
                <div class="item-details">
                    <span class="item-main">${group.label}</span>
                    <code class="item-sub">ID: ${group.id}</code>
                </div>
                <div class="item-actions">
                    <button onClick=${() => onEdit(group.id)}>${getMessage('edit', 'Edit')}</button>
                    <button class="danger" onClick=${() => onDelete(group.id, group.label)}>${getMessage('delete', 'Delete')}</button>
                </div>
            </div>
        </div>
    `;
}

function LogicalGroupEditForm({ group, onSave, onCancel, editFormError, handleEditLabelChange, handleEditColorChange, LOGICAL_GROUP_COLORS }) {
    return html`
        <div class="list-item is-editing">
            <div class="item-edit">
                <h3>${getMessage('editLogicalGroup', 'Edit Logical Group')}</h3>
                <div class="form-group">
                    <label for="edit-group-label-${group.id}">${getMessage('labelLabel', 'Label')}</label>
                    <input
                        type="text"
                        id="edit-group-label-${group.id}"
                        value=${group.label}
                        onInput=${handleEditLabelChange}
                    />
                    ${editFormError && html`<span class="error-message">${editFormError}</span>`}
                </div>
                <div class="form-group">
                    <label for="edit-group-color-${group.id}">${getMessage('groupColor', 'Color')}</label>
                    <select
                        id="edit-group-color-${group.id}"
                        value=${group.color}
                        onChange=${handleEditColorChange}
                    >
                        ${LOGICAL_GROUP_COLORS.map(color => html`
                            <option value=${color}>${getMessage(`color_${color}`, color)}</option>
                        `)}
                    </select>
                </div>
                <div class="form-actions">
                    <button onClick=${onSave} class="primary">${getMessage('save', 'Save')}</button>
                    <button onClick=${onCancel}>${getMessage('cancel', 'Cancel')}</button>
                </div>
            </div>
        </div>
    `;
}

// --- Onglet Groupes Logiques ---
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

    // --- Delete Logic ---
    const handleDeleteGroup = (groupId, groupLabel) => {
        console.log(`Attempting to delete group: ${groupLabel} (ID: ${groupId})`);

        const associatedRules = domainRules.filter(rule => rule.groupId === groupId);

        if (associatedRules.length > 0) {
            const confirmMessage = getMessage('confirmDeleteGroupAssociated', [groupLabel, associatedRules.length], `The logical group "${groupLabel}" is associated with ${associatedRules.length} domain rule(s). Deleting this group will remove its association from these rules. Are you sure you want to delete it?`);
            if (!confirm(confirmMessage)) {
                return;
            }
        } else {
            const confirmMessage = getMessage('confirmDeleteGroupNoRules', [groupLabel], `Are you sure you want to delete the logical group "${groupLabel}"? This group is not currently associated with any domain rules.`);
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        const newDomainRules = domainRules.map(rule => {
            if (rule.groupId === groupId) {
                return { ...rule, groupId: null };
            }
            return rule;
        });

        const newLogicalGroups = logicalGroups.filter(group => group.id !== groupId);

        setSettings(prevSettings => ({
            ...prevSettings,
            logicalGroups: newLogicalGroups,
            domainRules: newDomainRules
        }));
        console.log(`Group ${groupLabel} (ID: ${groupId}) deleted and domain rules updated.`);
    };

    return html`
        <section id="logical-groups-section">
            <h2>${getMessage('logicalGroupsTab', 'Logical Groups')}</h2>

            ${logicalGroups.map(group => {
                if (editingId === group.id && currentEditData) {
                    return html`<${LogicalGroupEditForm}
                        key=${group.id}
                        group=${currentEditData}
                        onSave=${handleSaveEditGroup}
                        onCancel=${handleCancelEdit}
                        editFormError=${editFormError}
                        handleEditLabelChange=${handleEditLabelChange}
                        handleEditColorChange=${handleEditColorChange}
                        LOGICAL_GROUP_COLORS=${LOGICAL_GROUP_COLORS}
                    />`;
                } else {
                    return html`<${LogicalGroupView}
                        key=${group.id}
                        group=${group}
                        onEdit=${(id) => { setEditingId(id); setShowAddForm(false); }}
                        onDelete=${handleDeleteGroup}
                    />`;
                }
            })}

            ${!showAddForm && !editingId && html`
                <button onClick=${() => { setShowAddForm(true); setEditingId(null); }} class="button add-button">
                    ${getMessage('addLogicalGroup', 'Add Logical Group')}
                </button>
            `}

            ${showAddForm && !editingId && html`
                <div class="list-item is-editing">
                    <div class="item-edit">
                        <h3>${getMessage('addNewLogicalGroup', 'Add New Logical Group')}</h3>
                        <div class="form-group">
                            <label for="add-group-label">${getMessage('labelLabel', 'Label')}</label>
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
        </section>
    `;
}

export { LogicalGroupsTab };
