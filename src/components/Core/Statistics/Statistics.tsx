import React from 'react';
import { Card, Heading, DataList, IconButton, Flex, Skeleton } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';

interface StatisticsProps {
    stats?: {
        tabGroupsCreatedCount?: number;
        tabsDeduplicatedCount?: number;
    } | null;
    onReset: () => void;
    isLoading?: boolean;
}

export function Statistics({ stats, onReset, isLoading = false }: StatisticsProps) {
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

    return (
        <Card>
            <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                    <Heading size="3">{getMessage('statisticsTab')}</Heading>
                    <IconButton 
                        variant="ghost" 
                        color="red" 
                        onClick={onReset}
                        title={getMessage('resetStats')}
                        aria-label={getMessage('resetStats')}
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Flex>
                
                <DataList.Root>
                    <DataList.Item>
                        <DataList.Label>
                            {getMessage(
                                (stats?.tabGroupsCreatedCount || 0) <= 1 ? 'groupCreatedSingular' : 'groupCreatedPlural'
                            )}
                        </DataList.Label>
                        <DataList.Value>{stats?.tabGroupsCreatedCount || 0}</DataList.Value>
                    </DataList.Item>
                    <DataList.Item>
                        <DataList.Label>
                            {getMessage(
                                (stats?.tabsDeduplicatedCount || 0) <= 1 ? 'tabDeduplicatedSingular' : 'tabDeduplicatedPlural'
                            )}
                        </DataList.Label>
                        <DataList.Value>{stats?.tabsDeduplicatedCount || 0}</DataList.Value>
                    </DataList.Item>
                </DataList.Root>
            </Flex>
        </Card>
    );
}