import { h } from './../js/lib/preact.mjs';
import htm from './../js/lib/htm.mjs';
import { getMessage } from './../js/modules/i18n.js';

const html = htm.bind(h);

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

export { StatsTab };
