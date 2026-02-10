import React from 'react';
import { Flex, Switch, Text, Skeleton, Card, Box } from '@radix-ui/themes';
import { Layers, Copy } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';

interface SettingsTogglesProps {
    globalGroupingEnabled?: boolean;
    globalDeduplicationEnabled?: boolean;
    onGroupingChange?: (checked: boolean) => void;
    onDeduplicationChange?: (checked: boolean) => void;
    isLoading?: boolean;
}

export function SettingsToggles({
    globalGroupingEnabled,
    globalDeduplicationEnabled,
    onGroupingChange,
    onDeduplicationChange,
    isLoading = false
}: SettingsTogglesProps) {
    if (isLoading) {
        return (
            <Card>
                <Flex gap="3" direction="column">
                    <Skeleton width="250px" height="24px" />
                    <Skeleton width="220px" height="24px" />
                </Flex>
            </Card>
        );
    }

    return (
        <Card>
            <Flex gap="3" direction="column">
                <Text as="label" size="2">
                    <Flex gap="3" align="center" justify="between">
                        <Flex gap="2" align="center">
                            <Box style={{ color: 'var(--accent-9)', display: 'flex' }}>
                                <Layers size={16} />
                            </Box>
                            {getMessage('enableGrouping')}
                        </Flex>
                        <Switch
                            checked={globalGroupingEnabled || false}
                            onCheckedChange={onGroupingChange}
                        />
                    </Flex>
                </Text>
                <Text as="label" size="2">
                    <Flex gap="3" align="center" justify="between">
                        <Flex gap="2" align="center">
                            <Box style={{ color: 'var(--accent-9)', display: 'flex' }}>
                                <Copy size={16} />
                            </Box>
                            {getMessage('enableDeduplication')}
                        </Flex>
                        <Switch
                            checked={globalDeduplicationEnabled || false}
                            onCheckedChange={onDeduplicationChange}
                        />
                    </Flex>
                </Text>
            </Flex>
        </Card>
    );
}
