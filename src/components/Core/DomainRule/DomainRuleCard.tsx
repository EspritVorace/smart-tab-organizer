import React from 'react';
import { Card, Flex, Checkbox, Heading, Text, IconButton, DropdownMenu, HoverCard, Code, DataList, Badge } from '@radix-ui/themes';
import { Edit, MoreHorizontal, Copy, Clipboard, Users } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { getRadixColor } from '../../../utils/utils';
import type { DomainRuleSetting } from '../../../types/syncSettings';
import type { LogicalGroup } from '../../../schemas/logicalGroup';
import { groupNameSourceOptions, deduplicationMatchModeOptions } from '../../../schemas/enums';
import { StatusBadge } from '../../UI/StatusBadge';

interface DomainRuleCardProps {
    rule: DomainRuleSetting;
    availableGroups: LogicalGroup[];
    onEnabledChanged: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onChangeGroup: (ruleId: string, groupId: string | null) => void;
    isPasteAvailable: boolean;
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
    isPasteAvailable
}: DomainRuleCardProps) {
    const getGroupNameSourceLabel = (value: string) => {
        const option = groupNameSourceOptions.find(opt => opt.value === value);
        return option ? getMessage(option.keyLabel) : value;
    };

    const getDeduplicationModeLabel = (value: string) => {
        const option = deduplicationMatchModeOptions.find(opt => opt.value === value);
        return option ? getMessage(option.keyLabel) : value;
    };

    const getRegexInfo = () => {
        const parts: string[] = [];
        if (rule.groupNameSource === 'title' && rule.titleParsingRegEx) {
            parts.push(`${getMessage('regex')}: ${rule.titleParsingRegEx}`);
        }
        if (rule.groupNameSource === 'url' && rule.urlParsingRegEx) {
            parts.push(`${getMessage('regex')}: ${rule.urlParsingRegEx}`);
        }
        return parts.join(', ');
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
                <DataList.Label>{getMessage('deduplicationMode')}</DataList.Label>
                <DataList.Value>{getDeduplicationModeLabel(rule.deduplicationMatchMode)}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('enableDeduplication')}</DataList.Label>
                <DataList.Value>{rule.deduplicationEnabled ? getMessage('enabled') : '❌'}</DataList.Value>
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
                    <IconButton
                        variant="ghost"
                        size="2"
                        onClick={onEdit}
                        title={getMessage('edit')}
                        aria-label={`${getMessage('edit')} ${rule.label}`}
                        style={{ color: 'var(--gray-11)' }}
                    >
                        <Edit size={16} />
                    </IconButton>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <IconButton
                                variant="ghost"
                                size="2"
                                title={getMessage('moreOptions')}
                                aria-label={`${getMessage('moreOptions')} ${rule.label}`}
                                style={{ color: 'var(--gray-11)' }}
                            >
                                <MoreHorizontal size={16} />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content aria-label={`${getMessage('moreOptions')} ${rule.label}`}>
                            <DropdownMenu.Item onClick={onCopy} aria-label={`${getMessage('copy')} ${rule.label}`}>
                                <Copy size={14} />
                                {getMessage('copy')}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item 
                                onClick={onPaste}
                                disabled={!isPasteAvailable}
                                aria-label={`${getMessage('paste')} ${rule.label}`}
                            >
                                <Clipboard size={14} />
                                {getMessage('paste')}
                            </DropdownMenu.Item>
                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger aria-label={`${getMessage('changeGroup')} ${rule.label}`}>
                                    <Users size={14} />
                                    {getMessage('changeGroup')}
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.SubContent aria-label={`${getMessage('changeGroup')} ${rule.label}`}>
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
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Sub>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item onClick={onDelete} color="red" aria-label={`${getMessage('delete')} ${rule.label}`}>
                                {getMessage('delete')}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Flex>
            </Flex>
        </Card>
    );
}