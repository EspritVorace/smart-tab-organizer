import { h } from 'preact';
import { useState } from 'preact/hooks';
import { getMessage } from '../js/modules/i18n.js';
import { generateUUID } from '../js/modules/utils.js';

export interface PresetsTabProps {
  settings: any;
  updatePresets: (p: any[]) => void;
}

export function PresetsTab({ settings, updatePresets }: PresetsTabProps) {
  const { regexPresets = [] } = settings;
  const [name, setName] = useState('');
  const [regex, setRegex] = useState('()');

  const handleAdd = () => {
    if (!name.trim() || !regex.trim()) return;
    const preset = { id: generateUUID(), name: name.trim(), regex, urlRegex: '' };
    updatePresets([...regexPresets, preset]);
    setName('');
    setRegex('()');
  };

  const handleDelete = (id: string) => {
    updatePresets(regexPresets.filter((p: any) => p.id !== id));
  };

  return (
    <section id="presets-section">
      <h2>{getMessage('regexPresetsTab')}</h2>
      {regexPresets.map((p: any) => (
        <div class="list-item" key={p.id}>
          <span class="item-main">{p.name}</span>
          <code class="item-sub">{p.regex}</code>
          <button onClick={() => handleDelete(p.id)} class="danger">
            {getMessage('delete', 'Delete')}
          </button>
        </div>
      ))}
      <div class="add-form">
        <input
          type="text"
          placeholder={getMessage('presetName')}
          value={name}
          onInput={e => setName((e.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          value={regex}
          onInput={e => setRegex((e.target as HTMLInputElement).value)}
        />
        <button onClick={handleAdd} class="button add-button">
          {getMessage('addPreset')}
        </button>
      </div>
    </section>
  );
}
