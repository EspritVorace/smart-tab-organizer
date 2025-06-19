import { h } from 'preact';
import { useState } from 'preact/hooks';
import { getMessage } from '../js/modules/i18n.js';
import { generateUUID } from '../js/modules/utils.js';

export interface RulesTabProps {
  settings: any;
  updateRules: (rules: any[]) => void;
}

export function RulesTab({ settings, updateRules }: RulesTabProps) {
  const { domainRules = [] } = settings;
  const [label, setLabel] = useState('');
  const [domain, setDomain] = useState('');

  const handleAdd = () => {
    if (!domain.trim()) return;
    const newRule = {
      id: generateUUID(),
      label: label.trim() || domain,
      domainFilter: domain.trim()
    };
    updateRules([...domainRules, newRule]);
    setLabel('');
    setDomain('');
  };

  const handleDelete = (id: string) => {
    updateRules(domainRules.filter((r: any) => r.id !== id));
  };

  return (
    <section id="rules-section">
      <h2>{getMessage('domainRulesTab')}</h2>
      <ul class="rules-list">
        {domainRules.map((rule: any) => (
          <li key={rule.id} class="list-item">
            <span class="item-main">{rule.label}</span>
            <code class="item-sub">{rule.domainFilter}</code>
            <button onClick={() => handleDelete(rule.id)} class="danger">
              {getMessage('delete', 'Delete')}
            </button>
          </li>
        ))}
      </ul>
      <div class="add-form">
        <input
          type="text"
          placeholder="Label"
          value={label}
          onInput={e => setLabel((e.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          placeholder="example.com"
          value={domain}
          onInput={e => setDomain((e.target as HTMLInputElement).value)}
        />
        <button onClick={handleAdd} class="button add-button">
          {getMessage('addRule', 'Add Rule')}
        </button>
      </div>
    </section>
  );
}
