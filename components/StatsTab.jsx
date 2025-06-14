import { h } from 'preact';
import { getMessage } from './../js/modules/i18n.js';
import Button from '@atlaskit/button';
import { Box, Stack } from '@atlaskit/primitives';

function StatsTab({ stats, onReset }) {
    return (
        <Box as="section" id="stats-section">
            <h2>{getMessage('statisticsTab')}</h2>
            <Stack space="space.200" className="stats-display">
                <p><span>{getMessage('groupsCreated')}</span> {stats.tabGroupsCreatedCount || 0}</p>
                <p><span>{getMessage('tabsDeduplicated')}</span> {stats.tabsDeduplicatedCount || 0}</p>
                <Button appearance="danger" onClick={onReset}>{getMessage('resetStats')}</Button>
            </Stack>
        </Box>
    );
}

export { StatsTab };
