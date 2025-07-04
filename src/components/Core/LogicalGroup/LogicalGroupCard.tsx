import React, { useState } from 'react';
import { Card, Flex, Checkbox, Heading, IconButton, DropdownMenu, HoverCard, DataList, Badge, Box, Text } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Edit, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { getRadixColor } from '../../../utils/utils';
import type { LogicalGroupSetting, DomainRuleSetting } from '../../../types/syncSettings';
import { DomainRuleCard } from '../DomainRule/DomainRuleCard';
import { StatusBadge } from '../../UI/StatusBadge';

interface LogicalGroupCardProps {
    group: LogicalGroupSetting;
    domainRulesList?: DomainRuleSetting[];
    availableGroups?: LogicalGroupSetting[];
    onEnabledChanged: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    // Props pour les DomainRuleCard
    onDomainRuleEnabledChanged?: (ruleId: string, enabled: boolean) => void;
    onDomainRuleEdit?: (ruleId: string) => void;
    onDomainRuleDelete?: (ruleId: string) => void;
    onDomainRuleCopy?: (ruleId: string) => void;
    onDomainRulePaste?: (ruleId: string) => void;
    onDomainRuleChangeGroup?: (ruleId: string, groupId: string | null) => void;
    isDomainRulePasteAvailable?: boolean;
}

export function LogicalGroupCard({
    group,
    domainRulesList = [],
    availableGroups = [],
    onEnabledChanged,
    onEdit,
    onDelete,
    onDomainRuleEnabledChanged,
    onDomainRuleEdit,
    onDomainRuleDelete,
    onDomainRuleCopy,
    onDomainRulePaste,
    onDomainRuleChangeGroup,
    isDomainRulePasteAvailable = false
}: LogicalGroupCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const renderHoverCardContent = () => (
        <DataList.Root>
            <DataList.Item>
                <DataList.Label>{getMessage('labelLabel')}</DataList.Label>
                <DataList.Value>{group.label}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('tabGroupColor')}</DataList.Label>
                <DataList.Value>
                    <Flex align="center" gap="2">
                        <Box
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                backgroundColor: `var(--${getRadixColor(group.color)}-9)`
                            }}
                        />
                        {getMessage(`color_${group.color}`)}
                    </Flex>
                </DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('enabled')}</DataList.Label>
                <DataList.Value>{group.enabled ? getMessage('enabled') : '❌'}</DataList.Value>
            </DataList.Item>
        </DataList.Root>
    );

    return (
        <Card style={{ width: '100%' }}>
            <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
                {/* Header du groupe logique */}
                <Flex justify="between" align="start" gap="3" style={{ padding: '16px' }}>
                    <Flex align="start" gap="3" style={{ flex: 1 }}>
                        {domainRulesList.length > 0 && (
                            <Collapsible.Trigger asChild>
                                <IconButton
                                    variant="ghost"
                                    size="1"
                                    title={isOpen ? 'Collapse' : 'Expand'}
                                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${group.label}`}
                                    style={{ color: 'var(--gray-11)', marginTop: '1px' }}
                                >
                                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </IconButton>
                            </Collapsible.Trigger>
                        )}
                        <Checkbox
                            checked={group.enabled ?? true}
                            onCheckedChange={onEnabledChanged}
                            style={{ marginTop: '2px' }}
                            aria-label={`${getMessage('enabled')}: ${group.label}`}
                        />
                        <Box
                            style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                backgroundColor: `var(--${getRadixColor(group.color)}-9)`,
                                border: `1px solid var(--${getRadixColor(group.color)}-8)`,
                                marginTop: '2px',
                                flexShrink: 0
                            }}
                        />
                        <Flex direction="column" gap="1" style={{ flex: 1 }}>
                            <Flex align="center" gap="2">
                                <HoverCard.Root>
                                    <HoverCard.Trigger>
                                        <Heading size="3" style={{ cursor: 'help' }} aria-label={`${group.label}. ${getMessage('moreOptions')}`}>
                                            {group.label}
                                        </Heading>
                                    </HoverCard.Trigger>
                                    <HoverCard.Content>
                                        {renderHoverCardContent()}
                                    </HoverCard.Content>
                                </HoverCard.Root>
                                {group.badge && (
                                    <StatusBadge type={group.badge} size="1" />
                                )}
                                {domainRulesList.length > 0 && (
                                    <Badge variant="soft" color="gray" size="1">
                                        {domainRulesList.length} {domainRulesList.length === 1 ? getMessage('ruleCountSingular') : getMessage('ruleCountPlural')}
                                    </Badge>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                    <Flex gap="1" align="center">
                        <IconButton
                            variant="ghost"
                            size="2"
                            onClick={onEdit}
                            title={getMessage('edit')}
                            aria-label={`${getMessage('edit')} ${group.label}`}
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
                                    aria-label={`${getMessage('moreOptions')} ${group.label}`}
                                    style={{ color: 'var(--gray-11)' }}
                                >
                                    <MoreHorizontal size={16} />
                                </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content aria-label={`${getMessage('moreOptions')} ${group.label}`}>
                                <DropdownMenu.Item onClick={onDelete} color="red" aria-label={`${getMessage('delete')} ${group.label}`}>
                                    {getMessage('delete')}
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </Flex>
                </Flex>

                {/* Section collapsible avec les DomainRuleCard */}
                <Collapsible.Content>
                    {domainRulesList.length > 0 && (
                        <Box style={{ 
                            borderTop: '1px solid var(--gray-6)', 
                            backgroundColor: 'var(--gray-2)',
                            padding: '12px'
                        }}>
                            <Flex direction="column" gap="2">
                                {domainRulesList.map((rule) => (
                                    <DomainRuleCard
                                        key={rule.id}
                                        rule={rule}
                                        availableGroups={availableGroups}
                                        onEnabledChanged={(enabled) => onDomainRuleEnabledChanged?.(rule.id, enabled)}
                                        onEdit={() => onDomainRuleEdit?.(rule.id)}
                                        onDelete={() => onDomainRuleDelete?.(rule.id)}
                                        onCopy={() => onDomainRuleCopy?.(rule.id)}
                                        onPaste={() => onDomainRulePaste?.(rule.id)}
                                        onChangeGroup={(ruleId, groupId) => onDomainRuleChangeGroup?.(ruleId, groupId)}
                                        isPasteAvailable={isDomainRulePasteAvailable}
                                    />
                                ))}
                            </Flex>
                        </Box>
                    )}
                </Collapsible.Content>
            </Collapsible.Root>
        </Card>
    );
}