import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';
import Button from '@atlaskit/button';

function StatsTab({ stats, onReset }) {
    return (
        <section id="stats-section">
            <h2>{getMessage('statisticsTab')}</h2>
            <div class="stats-display">
                <p><span>{getMessage('groupsCreated')}</span> {stats.tabGroupsCreatedCount || 0}</p>
                <p><span>{getMessage('tabsDeduplicated')}</span> {stats.tabsDeduplicatedCount || 0}</p>
                <Button appearance="danger" onClick={onReset}>{getMessage('resetStats')}</Button>
            </div>
        </section>
    );
}

export { StatsTab };
