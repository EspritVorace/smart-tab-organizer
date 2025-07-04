import React from 'react';
import { Card, Flex, Heading, Text, IconButton, DropdownMenu, HoverCard, Code, DataList, Badge } from '@radix-ui/themes';
import { getMessage } from '../../../utils/i18n';
import type { RegexPresetSetting } from '../../../types/syncSettings';
import { StatusBadge } from '../../UI/StatusBadge';
import { CardActions, type CardWithClipboardProps } from '../../UI/CardActions';

interface RegexPresetCardProps extends Omit<CardWithClipboardProps<RegexPresetSetting>, 'item'> {
    preset: RegexPresetSetting;
}

export function RegexPresetCard({
    preset,
    onEdit,
    onDelete,
    onCopy,
    onPaste,
    isPasteAvailable,
    existingItems
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
                        {preset.badge && (
                            <StatusBadge type={preset.badge} size="1" />
                        )}
                    </Flex>
                </Flex>
                <Flex gap="1" align="center">
                    <CardActions
                        item={preset}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onCopy={onCopy}
                        onPaste={onPaste}
                        isPasteAvailable={isPasteAvailable}
                        existingItems={existingItems}
                    />
                </Flex>
            </Flex>
        </Card>
    );
}