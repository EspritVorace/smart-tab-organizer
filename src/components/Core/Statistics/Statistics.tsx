import React from 'react';
import { Card, Heading, Text, IconButton, Flex, Skeleton, Box } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Trash2, FolderOpen, TabletSmartphone, ChevronDown } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { StatisticsTheme } from '../../Form/themes';

interface StatisticsProps {
    stats?: {
        tabGroupsCreatedCount?: number;
        tabsDeduplicatedCount?: number;
    } | null;
    onReset: () => void;
    isLoading?: boolean;
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
}

export function Statistics({ stats, onReset, isLoading = false, collapsed = false, onToggleCollapsed }: StatisticsProps) {
    if (isLoading) {
        return (
            <Card>
                <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                        <Skeleton width="120px" height="24px" />
                        <Skeleton width="24px" height="24px" />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Flex justify="between">
                            <Skeleton width="100px" height="20px" />
                            <Skeleton width="20px" height="20px" />
                        </Flex>
                        <Flex justify="between">
                            <Skeleton width="120px" height="20px" />
                            <Skeleton width="20px" height="20px" />
                        </Flex>
                    </Flex>
                </Flex>
            </Card>
        );
    }

    const groupCount = stats?.tabGroupsCreatedCount || 0;
    const dedupCount = stats?.tabsDeduplicatedCount || 0;
    const collapsible = !!onToggleCollapsed;
    const isOpen = !collapsed;

    const groupLabel = getMessage(groupCount <= 1 ? 'groupCreatedSingular' : 'groupCreatedPlural');
    const dedupLabel = getMessage(dedupCount <= 1 ? 'tabDeduplicatedSingular' : 'tabDeduplicatedPlural');

    return (
        <StatisticsTheme>
            <Card role="region" aria-label={getMessage('statisticsTab')}>
                <Collapsible.Root
                    open={isOpen}
                    onOpenChange={collapsible ? (open) => { if (open !== isOpen) onToggleCollapsed?.(); } : undefined}
                    disabled={!collapsible}
                >
                    <Flex direction="column" gap={collapsed ? '0' : '3'}>
                        <Flex justify="between" align="center">
                            {collapsible ? (
                                <Collapsible.Trigger asChild>
                                    <button
                                        type="button"
                                        style={{
                                            all: 'unset',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            borderRadius: 'var(--radius-2)',
                                        }}
                                    >
                                        <ChevronDown
                                            size={16}
                                            aria-hidden="true"
                                            style={{
                                                color: 'var(--gray-9)',
                                                transition: 'transform 0.2s ease',
                                                transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                            }}
                                        />
                                        <Heading size="3">{getMessage('statisticsTab')}</Heading>
                                    </button>
                                </Collapsible.Trigger>
                            ) : (
                                <Heading size="3">{getMessage('statisticsTab')}</Heading>
                            )}
                            {isOpen && (
                                <IconButton
                                    variant="ghost"
                                    color="red"
                                    size="1"
                                    onClick={onReset}
                                    title={getMessage('resetStats')}
                                    aria-label={getMessage('resetStats')}
                                >
                                    <Trash2 size={14} aria-hidden="true" />
                                </IconButton>
                            )}
                        </Flex>

                        <Collapsible.Content>
                            <Flex gap="3" role="list" style={{ paddingTop: collapsed ? 0 : undefined }}>
                                {/* Group stat */}
                                <Box role="listitem" aria-label={`${groupCount} ${groupLabel}`} style={{
                                    flex: 1,
                                    backgroundColor: 'var(--accent-a3)',
                                    borderRadius: 'var(--radius-2)',
                                    padding: 'var(--space-3)',
                                    textAlign: 'center',
                                }}>
                                    <Flex direction="column" gap="1" align="center">
                                        <FolderOpen size={18} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
                                        <Text size="5" weight="bold" aria-hidden="true">{groupCount}</Text>
                                        <Text size="1" color="gray" aria-hidden="true">
                                            {groupLabel}
                                        </Text>
                                    </Flex>
                                </Box>

                                {/* Dedup stat */}
                                <Box role="listitem" aria-label={`${dedupCount} ${dedupLabel}`} style={{
                                    flex: 1,
                                    backgroundColor: 'var(--accent-a3)',
                                    borderRadius: 'var(--radius-2)',
                                    padding: 'var(--space-3)',
                                    textAlign: 'center',
                                }}>
                                    <Flex direction="column" gap="1" align="center">
                                        <TabletSmartphone size={18} aria-hidden="true" style={{ color: 'var(--accent-9)' }} />
                                        <Text size="5" weight="bold" aria-hidden="true">{dedupCount}</Text>
                                        <Text size="1" color="gray" aria-hidden="true">
                                            {dedupLabel}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Flex>
                        </Collapsible.Content>
                    </Flex>
                </Collapsible.Root>
            </Card>
        </StatisticsTheme>
    );
}
