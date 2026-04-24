import { useId } from 'react';
import { Box, Flex, HoverCard, SegmentedControl, Text } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { getMessage } from '@/utils/i18n';

export type ConfigMode = 'preset' | 'ask' | 'manual';

const CONFIG_MODES: ConfigMode[] = ['preset', 'ask', 'manual'];

const MODE_LABELS: Record<ConfigMode, Parameters<typeof getMessage>[0]> = {
  preset: 'configModePreset',
  ask: 'configModeAsk',
  manual: 'configModeManual',
};

const MODE_HELP_LABELS: Record<ConfigMode, Parameters<typeof getMessage>[0]> = {
  preset: 'configModePresetHelp',
  ask: 'configModeAskHelp',
  manual: 'configModeManualHelp',
};

interface ConfigModeSelectorProps {
  value: ConfigMode;
  onValueChange: (mode: ConfigMode) => void;
}

/**
 * Segmented control for choosing between preset / ask / manual config modes.
 * Each item shows a HoverCard tooltip with the mode description.
 * Shared between ConfigEditModal and WizardStep2Config.
 */
export function ConfigModeSelector({ value, onValueChange }: ConfigModeSelectorProps) {
  const labelId = useId();
  return (
    <Flex direction="column" gap="1">
      <Text id={labelId} size="2" weight="bold">
        {getMessage('configurationMode')}
      </Text>
      <SegmentedControl.Root
        data-testid="wizard-rule-segmented-config"
        aria-labelledby={labelId}
        value={value}
        onValueChange={(v) => onValueChange(v as ConfigMode)}
        size="2"
      >
        {CONFIG_MODES.map((mode) => (
          <SegmentedControl.Item key={mode} value={mode} data-testid={`config-mode-${mode}`}>
            <Flex align="center" gap="1">
              {getMessage(MODE_LABELS[mode])}
              <HoverCard.Root openDelay={300} closeDelay={100}>
                <HoverCard.Trigger>
                  <Box
                    as="span"
                    style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default', lineHeight: 0 }}
                  >
                    <Info size={12} aria-hidden="true" />
                  </Box>
                </HoverCard.Trigger>
                <HoverCard.Content
                  size="1"
                  maxWidth="240px"
                  side="top"
                  sideOffset={4}
                  align={mode === 'manual' ? 'end' : 'center'}
                >
                  <Text size="2">{getMessage(MODE_HELP_LABELS[mode])}</Text>
                </HoverCard.Content>
              </HoverCard.Root>
            </Flex>
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.Root>
    </Flex>
  );
}
