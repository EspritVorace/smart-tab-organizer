import React from 'react';
import { Flex, Switch, Text, Skeleton, Card } from '@radix-ui/themes';
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
            <Flex gap="2" direction="column">
                <Skeleton width="250px" height="24px" />
                <Skeleton width="220px" height="24px" />
            </Flex>
        );
    }

    return (
        <Card>
            <Flex gap="2" direction="column">
                <Text as="label" size="3">
                    <Flex gap="2">
                        <Switch 
                            checked={globalGroupingEnabled || false} 
                            onCheckedChange={onGroupingChange} 
                        /> 
                        {getMessage('enableGrouping')}
                    </Flex>
                </Text>
                <Text as="label" size="3">
                    <Flex gap="2">
                        <Switch 
                            checked={globalDeduplicationEnabled || false} 
                            onCheckedChange={onDeduplicationChange} 
                        /> 
                        {getMessage('enableDeduplication')}
                    </Flex>
                </Text>
            </Flex>
        </Card>
    );
}