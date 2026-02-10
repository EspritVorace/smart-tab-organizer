import React from 'react';
import { Card, Heading, Text, IconButton, Flex, Skeleton, Box } from '@radix-ui/themes';
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

    return (
        <StatisticsTheme>
            <Card>
                <Flex direction="column" gap={collapsed ? '0' : '3'}>
                    <Flex justify="between" align="center">
                        <Flex
                            align="center"
                            gap="2"
                            style={{
                                cursor: collapsible ? 'pointer' : undefined,
                                userSelect: 'none',
                            }}
                            onClick={onToggleCollapsed}
                            role={collapsible ? 'button' : undefined}
                            aria-expanded={collapsible ? !collapsed : undefined}
                        >
                            {collapsible && (
                                <ChevronDown
                                    size={16}
                                    style={{
                                        color: 'var(--gray-9)',
                                        transition: 'transform 0.2s ease',
                                        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                    }}
                                />
                            )}
                            <Heading size="3">{getMessage('statisticsTab')}</Heading>
                        </Flex>
                        {!collapsed && (
                            <IconButton
                                variant="ghost"
                                color="red"
                                size="1"
                                onClick={onReset}
                                title={getMessage('resetStats')}
                                aria-label={getMessage('resetStats')}
                            >
                                <Trash2 size={14} />
                            </IconButton>
                        )}
                    </Flex>

                    {!collapsed && (
                        <Flex gap="3">
                            {/* Group stat */}
                            <Box style={{
                                flex: 1,
                                backgroundColor: 'var(--accent-a3)',
                                borderRadius: 'var(--radius-2)',
                                padding: 'var(--space-3)',
                                textAlign: 'center',
                            }}>
                                <Flex direction="column" gap="1" align="center">
                                    <FolderOpen size={18} style={{ color: 'var(--accent-9)' }} />
                                    <Text size="5" weight="bold">{groupCount}</Text>
                                    <Text size="1" color="gray">
                                        {getMessage(groupCount <= 1 ? 'groupCreatedSingular' : 'groupCreatedPlural')}
                                    </Text>
                                </Flex>
                            </Box>

                            {/* Dedup stat */}
                            <Box style={{
                                flex: 1,
                                backgroundColor: 'var(--accent-a3)',
                                borderRadius: 'var(--radius-2)',
                                padding: 'var(--space-3)',
                                textAlign: 'center',
                            }}>
                                <Flex direction="column" gap="1" align="center">
                                    <TabletSmartphone size={18} style={{ color: 'var(--accent-9)' }} />
                                    <Text size="5" weight="bold">{dedupCount}</Text>
                                    <Text size="1" color="gray">
                                        {getMessage(dedupCount <= 1 ? 'tabDeduplicatedSingular' : 'tabDeduplicatedPlural')}
                                    </Text>
                                </Flex>
                            </Box>
                        </Flex>
                    )}
                </Flex>
            </Card>
        </StatisticsTheme>
    );
}
