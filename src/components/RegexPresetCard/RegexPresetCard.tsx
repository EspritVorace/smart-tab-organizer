import React from 'react';
import { Card, Flex, Heading, Text, IconButton, DropdownMenu, HoverCard, Code, DataList, Badge } from '@radix-ui/themes';
import { Edit, MoreHorizontal, Copy, Clipboard } from 'lucide-react';
import { getMessage } from '../../utils/i18n';
import type { RegexPresetSetting } from '../../types/syncSettings';

interface RegexPresetCardProps {
    preset: RegexPresetSetting;
    onEdit: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onPaste: () => void;
    isPasteAvailable: boolean;
    badge?: {
        text: string;
        color?: 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange' | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple' | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade' | 'green' | 'grass' | 'lime';
    };
}

export function RegexPresetCard({
    preset,
    onEdit,
    onDelete,
    onCopy,
    onPaste,
    isPasteAvailable,
    badge
}: RegexPresetCardProps) {
    const renderHoverCardContent = () => (
        <DataList.Root>
            <DataList.Item>
                <DataList.Label>{getMessage('presetName')}</DataList.Label>
                <DataList.Value>{preset.name}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
                <DataList.Label>{getMessage('titleRegex')}</DataList.Label>
                <DataList.Value><Code>{preset.titleParsingRegEx}</Code></DataList.Value>
            </DataList.Item>
            {preset.urlParsingRegEx && (
                <DataList.Item>
                    <DataList.Label>{getMessage('urlRegex')}</DataList.Label>
                    <DataList.Value><Code>{preset.urlParsingRegEx}</Code></DataList.Value>
                </DataList.Item>
            )}
        </DataList.Root>
    );

    return (
        <Card style={{ width: '100%' }}>
            <Flex justify="between" align="start" gap="3">
                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                        <HoverCard.Root>
                            <HoverCard.Trigger>
                                <Heading size="3" style={{ cursor: 'help' }} aria-label={`${preset.name}. ${getMessage('moreOptions')}`}>
                                    {preset.name}
                                </Heading>
                            </HoverCard.Trigger>
                            <HoverCard.Content>
                                {renderHoverCardContent()}
                            </HoverCard.Content>
                        </HoverCard.Root>
                        {badge && (
                            <Badge color={badge.color || 'gray'} size="1">
                                {badge.text}
                            </Badge>
                        )}
                    </Flex>
                </Flex>
                <Flex gap="1" align="center">
                    <IconButton
                        variant="ghost"
                        size="2"
                        onClick={onEdit}
                        title={getMessage('edit')}
                        aria-label={`${getMessage('edit')} ${preset.name}`}
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
                                aria-label={`${getMessage('moreOptions')} ${preset.name}`}
                                style={{ color: 'var(--gray-11)' }}
                            >
                                <MoreHorizontal size={16} />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content aria-label={`${getMessage('moreOptions')} ${preset.name}`}>
                            <DropdownMenu.Item onClick={onCopy} aria-label={`${getMessage('copy')} ${preset.name}`}>
                                <Copy size={14} />
                                {getMessage('copy')}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item 
                                onClick={onPaste}
                                disabled={!isPasteAvailable}
                                aria-label={`${getMessage('paste')} ${preset.name}`}
                            >
                                <Clipboard size={14} />
                                {getMessage('paste')}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item onClick={onDelete} color="red" aria-label={`${getMessage('delete')} ${preset.name}`}>
                                {getMessage('delete')}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Flex>
            </Flex>
        </Card>
    );
}