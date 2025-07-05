import { getSyncSettings } from '../utils/settingsUtils.js';
import type { SyncSettings, DomainRuleSetting } from '../types/syncSettings.js';

export async function getSettings(): Promise<SyncSettings> {
    const settings = await getSyncSettings();
    settings.domainRules = settings.domainRules || [];
    settings.domainRules = settings.domainRules.map((rule: DomainRuleSetting) => ({
        ...rule,
        deduplicationEnabled: typeof rule.deduplicationEnabled === 'boolean' ? rule.deduplicationEnabled : true,
        deduplicationMatchMode: rule.deduplicationMatchMode || 'exact',
        groupNameSource: rule.groupNameSource || 'title',
        urlParsingRegEx: rule.urlParsingRegEx || ''
    }));
    return settings;
}