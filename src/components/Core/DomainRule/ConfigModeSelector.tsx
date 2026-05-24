import { useId } from 'react';
import { Flex, RadioGroup, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';

export type ConfigMode = 'preset' | 'ask' | 'manual';

const CONFIG_MODES: ConfigMode[] = ['preset', 'ask', 'manual'];

const MODE_LABELS: Record<ConfigMode, Parameters<typeof getMessage>[0]> = {
  preset: 'configModePreset',
  ask: 'configModeAsk',
  manual: 'configModeManual',
};

const MODE_TAGLINES: Record<ConfigMode, Parameters<typeof getMessage>[0]> = {
  preset: 'configModePresetTagline',
  ask: 'configModeAskTagline',
  manual: 'configModeManualTagline',
};

export const MODE_HELP_LABELS: Record<ConfigMode, Parameters<typeof getMessage>[0]> = {
  preset: 'configModePresetHelp',
  ask: 'configModeAskHelp',
  manual: 'configModeManualHelp',
};

interface ConfigModeSelectorProps {
  value: ConfigMode;
  onValueChange: (mode: ConfigMode) => void;
  /** Marks the currently selected radio item with [data-autofocus] so DialogShell focuses it on open. */
  autoFocusFirstField?: boolean;
}

/**
 * Vertical list of radio cards (label + tagline) for choosing the config mode.
 * The active mode's full description is rendered by the parent (right column).
 * Shared between ConfigEditModal and WizardStep2Config.
 */
export function ConfigModeSelector({ value, onValueChange, autoFocusFirstField = false }: ConfigModeSelectorProps) {
  const labelId = useId();
  return (
    <Flex direction="column" gap="2">
      <Text id={labelId} size="2" weight="bold">
        {getMessage('configurationMode')}
      </Text>
      <RadioGroup.Root
        data-testid="wizard-rule-segmented-config"
        aria-labelledby={labelId}
        value={value}
        onValueChange={(v) => onValueChange(v as ConfigMode)}
      >
        <Flex direction="column" gap="2">
          {CONFIG_MODES.map((mode) => {
            const isSelected = value === mode;
            return (
              <Text
                key={mode}
                as="label"
                size="2"
                style={{
                  display: 'block',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-3)',
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? 'var(--accent-a7)' : 'var(--gray-a5)'}`,
                  backgroundColor: isSelected ? 'var(--accent-a3)' : 'transparent',
                  transition: 'background-color 120ms ease, border-color 120ms ease',
                }}
              >
                <Flex align="start" gap="2">
                  <RadioGroup.Item
                    value={mode}
                    data-testid={`config-mode-${mode}`}
                    data-autofocus={autoFocusFirstField && isSelected ? 'true' : undefined}
                    style={{ marginTop: '2px' }}
                  />
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="bold">
                      {getMessage(MODE_LABELS[mode])}
                    </Text>
                    <Text size="1" color="gray">
                      {getMessage(MODE_TAGLINES[mode])}
                    </Text>
                  </Flex>
                </Flex>
              </Text>
            );
          })}
        </Flex>
      </RadioGroup.Root>
    </Flex>
  );
}
