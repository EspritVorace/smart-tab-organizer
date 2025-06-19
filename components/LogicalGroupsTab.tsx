import { h } from 'preact';
import { useState } from 'preact/hooks';
import { getMessage } from '../js/modules/i18n.js';
import { generateUUID } from '../js/modules/utils.js';

const LOGICAL_GROUP_COLORS = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange'
];

export interface LogicalGroupsTabProps {
  settings: any;
  setSettings: (s: any) => void;
}

export function LogicalGroupsTab({ settings, setSettings }: LogicalGroupsTabProps) {
  const { logicalGroups = [] } = settings;
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(LOGICAL_GROUP_COLORS[0]);

  const handleAdd = () => {
    if (!label.trim()) return;
    const newGroup = { id: generateUUID(), label: label.trim(), color };
    setSettings((prev: any) => ({
      ...prev,
      logicalGroups: [...(prev.logicalGroups || []), newGroup]
    }));
    setLabel('');
    setColor(LOGICAL_GROUP_COLORS[0]);
  };

  const handleDelete = (id: string) => {
    setSettings((prev: any) => ({
      ...prev,
      logicalGroups: prev.logicalGroups.filter((g: any) => g.id !== id)
    }));
  };

  return (
    <section id="logical-groups-section">
      <h2>{getMessage('logicalGroupsTab', 'Logical Groups')}</h2>
      {logicalGroups.map((group: any) => (
        <div class="list-item" key={group.id}>
          <span class={`group-color-swatch group-color-${group.color}`}></span>
          <span class="item-main">{group.label}</span>
          <button onClick={() => handleDelete(group.id)} class="danger">
            {getMessage('delete', 'Delete')}
          </button>
        </div>
      ))}
      <div class="add-form">
        <input
          type="text"
          value={label}
          onInput={e => setLabel((e.target as HTMLInputElement).value)}
        />
        <select
          value={color}
          onChange={e => setColor((e.target as HTMLSelectElement).value)}
        >
          {LOGICAL_GROUP_COLORS.map(c => (
            <option value={c}>{c}</option>
          ))}
        </select>
        <button onClick={handleAdd} class="button add-button">
          {getMessage('addLogicalGroup', 'Add Logical Group')}
        </button>
      </div>
    </section>
  );
}
