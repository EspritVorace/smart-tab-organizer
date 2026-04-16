import { getSyncSettings } from '@/utils/settingsUtils.js';
import type { SyncSettings, DomainRuleSetting } from '@/types/syncSettings.js';

export async function getSettings(): Promise<SyncSettings> {
    const settings = await getSyncSettings();
    settings.domainRules = settings.domainRules || [];
    settings.domainRules = settings.domainRules.map((rule: DomainRuleSetting) => ({
        ...rule,
        deduplicationEnabled: typeof rule.deduplicationEnabled === 'boolean' ? rule.deduplicationEnabled : true,
        groupingEnabled: typeof rule.groupingEnabled === 'boolean' ? rule.groupingEnabled : true,
        deduplicationMatchMode: rule.deduplicationMatchMode || 'exact',
        groupNameSource: rule.groupNameSource || 'title',
        urlParsingRegEx: rule.urlParsingRegEx || '',
        // Migrate legacy wildcard syntax: *.example.com → example.com
        // Subdomains now match implicitly for plain domains
        domainFilter: rule.domainFilter?.startsWith('*.') ? rule.domainFilter.slice(2) : rule.domainFilter,
    }));
    return settings;
}