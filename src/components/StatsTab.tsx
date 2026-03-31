import React from 'react';
import { getMessage } from '../utils/i18n';
import { Statistics } from '../types/statistics';

interface StatsTabProps {
  stats: Statistics;
  onReset: () => void;
}

function StatsTab({ stats, onReset }: StatsTabProps) {
  return (
    <section id="stats-section">
      <h2>{getMessage('statisticsTab')}</h2>
      <div className="stats-display">
        <p><span>{getMessage('groupsCreated')}</span> {stats.tabGroupsCreatedCount || 0}</p>
        <p><span>{getMessage('tabsDeduplicated')}</span> {stats.tabsDeduplicatedCount || 0}</p>
        <button onClick={onReset} className="button danger">{getMessage('resetStats')}</button>
      </div>
    </section>
  );
}

export { StatsTab };
