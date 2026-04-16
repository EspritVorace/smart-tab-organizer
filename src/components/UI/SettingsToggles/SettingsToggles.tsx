import React from 'react';
import { Button, Flex, Switch, Text, Skeleton, Card, Box } from '@radix-ui/themes';
import { Layers, Copy, Shield, ExternalLink } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

interface SettingsTogglesProps {
    globalGroupingEnabled?: boolean;
    globalDeduplicationEnabled?: boolean;
    onGroupingChange?: (checked: boolean) => void;
    onDeduplicationChange?: (checked: boolean) => void;
    isLoading?: boolean;
    hasRules?: boolean;
    onOpenRules?: () => void;
}

export function SettingsToggles({
    globalGroupingEnabled,
    globalDeduplicationEnabled,
    onGroupingChange,
    onDeduplicationChange,
    isLoading = false,
    hasRules = true,
    onOpenRules,
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

    if (!hasRules) {
        return (
            <Card role="group" aria-label={getMessage('settingsTab')}>
                <Flex direction="column" align="center" gap="3" py="2">
                    <Shield size={28} style={{ color: 'var(--gray-8)' }} aria-hidden="true" />
                    <Text size="2" color="gray" align="center">
                        {getMessage('popupNoRulesTitle')}
                    </Text>
                    <Button variant="soft" size="2" onClick={onOpenRules}>
                        <ExternalLink size={14} aria-hidden="true" />
                        {getMessage('popupGoToRules')}
                    </Button>
                </Flex>
            </Card>
        );
    }

    return (
        <Card data-testid="settings-toggles" role="group" aria-label={getMessage('settingsTab')}>
            <Flex gap="3" direction="column">
                <Text as="label" size="2">
                    <Flex gap="3" align="center" justify="between">
                        <Flex gap="2" align="center">
                            <Box aria-hidden="true" style={{ color: 'var(--accent-9)', display: 'flex' }}>
                                <Layers size={16} />
                            </Box>
                            {getMessage('enableGrouping')}
                        </Flex>
                        <Switch
                            data-testid="settings-toggle-grouping"
                            checked={globalGroupingEnabled || false}
                            onCheckedChange={onGroupingChange}
                        />
                    </Flex>
                </Text>
                <Text as="label" size="2">
                    <Flex gap="3" align="center" justify="between">
                        <Flex gap="2" align="center">
                            <Box aria-hidden="true" style={{ color: 'var(--accent-9)', display: 'flex' }}>
                                <Copy size={16} />
                            </Box>
                            {getMessage('enableDeduplication')}
                        </Flex>
                        <Switch
                            data-testid="settings-toggle-dedup"
                            checked={globalDeduplicationEnabled || false}
                            onCheckedChange={onDeduplicationChange}
                        />
                    </Flex>
                </Text>
            </Flex>
        </Card>
    );
}
