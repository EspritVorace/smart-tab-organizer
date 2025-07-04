import { Card, Flex, Checkbox, Heading, Text, IconButton, DropdownMenu, HoverCard, Code, DataList } from '@radix-ui/themes';
import { Users } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { getRadixColor } from '../../../utils/utils';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import type { LogicalGroup } from '../../../schemas/logicalGroup';
import { groupNameSourceOptions, deduplicationMatchModeOptions } from '../../../schemas/enums';
import { StatusBadge } from '../../UI/StatusBadge';
import { CardActions, type CardWithClipboardProps } from '../../UI/CardActions';

interface DomainRuleCardProps extends Omit<CardWithClipboardProps<DomainRuleSetting & { id: string }>, 'item'> {
    rule: DomainRuleSetting;
    availableGroups: LogicalGroup[];
    onEnabledChanged: (enabled: boolean) => void;
    onChangeGroup: (ruleId: string, groupId: string | null) => void;
}

export function DomainRuleCard({
    rule,
    availableGroups,
    onEnabledChanged,
    onEdit,
    onDelete,
    onCopy,
    onPaste,
    onChangeGroup,
    isPasteAvailable,
    existingItems
}: DomainRuleCardProps) {
    const getGroupNameSourceLabel = (value: string) => {
        const option = groupNameSourceOptions.find(opt => opt.value === value);
        return option ? getMessage(option.keyLabel) : value;
    };

    const getDeduplicationModeLabel = (value: string) => {
        const option = deduplicationMatchModeOptions.find(opt => opt.value === value);
        return option ? getMessage(option.keyLabel) : value;
    };


    const filteredGroups = availableGroups.filter(group => group.id !== rule.groupId);

    const currentGroup = availableGroups.find(group => group.id === rule.groupId);
    
    const renderHoverCardContent = () => (
        <DataList.Root>
            <DataList.Item>
                <DataList.Label>{getMessage('labelLabel')}</DataList.Label>
                <DataList.Value>{rule.label}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('domainFilter')}</DataList.Label>
                <DataList.Value><Code>{rule.domainFilter}</Code></DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('enabled')}</DataList.Label>
                <DataList.Value>{rule.enabled ? getMessage('enabled') : '❌'}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('groupNameSource')}</DataList.Label>
                <DataList.Value>{getGroupNameSourceLabel(rule.groupNameSource)}</DataList.Value>
            </DataList.Item>
            {rule.titleParsingRegEx && (
                <DataList.Item>
                    <DataList.Label>{getMessage('titleRegex')}</DataList.Label>
                    <DataList.Value><Code>{rule.titleParsingRegEx}</Code></DataList.Value>
                </DataList.Item>
            )}
            {rule.urlParsingRegEx && (
                <DataList.Item>
                    <DataList.Label>{getMessage('urlRegex')}</DataList.Label>
                    <DataList.Value><Code>{rule.urlParsingRegEx}</Code></DataList.Value>
                </DataList.Item>
            )}
            <DataList.Item>
                <DataList.Label>{getMessage('logicalGroup')}</DataList.Label>
                <DataList.Value>
                    {currentGroup ? (
                        <Text color={getRadixColor(currentGroup.color)}>
                            {currentGroup.label}
                        </Text>
                    ) : (
                        getMessage('noGroup')
                    )}
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('enableDeduplication')}</DataList.Label>
                <DataList.Value>{rule.deduplicationEnabled ? getMessage('enabled') : '❌'}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('deduplicationMode')}</DataList.Label>
                <DataList.Value>{getDeduplicationModeLabel(rule.deduplicationMatchMode)}</DataList.Value>
            </DataList.Item>
        </DataList.Root>
    );

    return (
        <Card style={{ width: '100%' }}>
            <Flex justify="between" align="start" gap="3">
                <Flex align="start" gap="3" style={{ flex: 1 }}>
                    <Checkbox
                        checked={rule.enabled}
                        onCheckedChange={onEnabledChanged}
                        style={{ marginTop: '2px' }}
                        aria-label={`${getMessage('enabled')}: ${rule.label}`}
                    />
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Flex align="center" gap="2">
                            <HoverCard.Root>
                                <HoverCard.Trigger>
                                    <Heading size="3" style={{ cursor: 'help' }} aria-label={`${rule.label}. ${getMessage('moreOptions')}`}>{rule.label}</Heading>
                                </HoverCard.Trigger>
                                <HoverCard.Content>
                                    {renderHoverCardContent()}
                                </HoverCard.Content>
                            </HoverCard.Root>
                            {rule.badge && (
                                <StatusBadge type={rule.badge} size="1" />
                            )}
                        </Flex>
                        <Text size="2" color="gray">
                            <Code>{rule.domainFilter}</Code>
                        </Text>
                    </Flex>
                </Flex>
                <Flex gap="1" align="center">
                    <CardActions
                        item={rule as DomainRuleSetting & { id: string }}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onCopy={onCopy}
                        onPaste={onPaste}
                        isPasteAvailable={isPasteAvailable}
                        existingItems={existingItems as (DomainRuleSetting & { id: string })[]}
                    />
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <IconButton
                                variant="ghost"
                                size="2"
                                title={getMessage('changeGroup')}
                                aria-label={`${getMessage('changeGroup')} ${rule.label}`}
                                style={{ color: 'var(--gray-11)' }}
                            >
                                <Users size={16} />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content aria-label={`${getMessage('changeGroup')} ${rule.label}`}>
                            <DropdownMenu.Item 
                                onClick={() => onChangeGroup(rule.id, null)}
                                aria-label={`${getMessage('changeGroup')}: ${getMessage('noGroup')}`}
                            >
                                {getMessage('noGroup')}
                            </DropdownMenu.Item>
                            {filteredGroups.map(group => (
                                <DropdownMenu.Item 
                                    key={group.id}
                                    onClick={() => onChangeGroup(rule.id, group.id)}
                                    aria-label={`${getMessage('changeGroup')}: ${group.label}`}
                                >
                                    <Text color={getRadixColor(group.color)}>
                                        {group.label}
                                    </Text>
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Flex>
            </Flex>
        </Card>
    );
}