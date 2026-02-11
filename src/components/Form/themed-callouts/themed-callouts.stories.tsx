import type { Meta, StoryObj } from '@storybook/react';
import { Flex, Text, Box, Heading } from '@radix-ui/themes';
import { 
  InfoCallout, 
  WarningCallout, 
  ErrorCallout,
  DomainRulesCallouts,
  RegexPresetsCallouts,
  ImportCallouts,
  ExportCallouts,
  StatisticsCallouts,
  SettingsCallouts
} from './index';

const meta: Meta = {
  title: 'Components/Form/Themes/Themed Callouts',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

export const CalloutsGenericCallouts: StoryObj = {
  name: 'Generic Callouts',
  render: () => (
    <Flex direction="column" gap="4" p="4">
      <Heading as="h2" size="6" weight="bold" mb="4">Generic Callouts with Custom Themes</Heading>
      
      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Default Colors</Heading>
        <Flex direction="column" gap="3">
          <InfoCallout>
            This is an info callout with the default blue theme. It provides helpful information to users.
          </InfoCallout>
          <WarningCallout>
            This is a warning callout with the default amber theme. It alerts users to potential issues.
          </WarningCallout>
          <ErrorCallout>
            This is an error callout with the default red theme. It indicates something went wrong.
          </ErrorCallout>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Custom Theme Colors</Heading>
        <Flex direction="column" gap="3">
          <InfoCallout theme="purple">
            Info callout with purple theme (Domain Rules style).
          </InfoCallout>
          <InfoCallout theme="cyan">
            Info callout with cyan theme (Regex Presets style).
          </InfoCallout>
          <WarningCallout theme="jade">
            Warning callout with jade theme (Import style).
          </WarningCallout>
          <ErrorCallout theme="orange">
            Error callout with orange theme (Statistics style).
          </ErrorCallout>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Different Variants</Heading>
        <Flex direction="column" gap="3">
          <InfoCallout variant="soft">Soft variant (default)</InfoCallout>
          <InfoCallout variant="surface">Surface variant</InfoCallout>
          <InfoCallout variant="outline">Outline variant</InfoCallout>
        </Flex>
      </Box>
    </Flex>
  )
};

export const CalloutsFeatureCallouts: StoryObj = {
  name: 'Feature-Specific Callouts',
  render: () => (
    <Flex direction="column" gap="4" p="4">
      <Heading as="h2" size="6" weight="bold" mb="4">Feature-Specific Themed Callouts</Heading>
      
      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Domain Rules Callouts (Purple)</Heading>
        <Flex direction="column" gap="2">
          <DomainRulesCallouts.Info>
            Domain rule configuration saved successfully. Your new rule will be applied to matching tabs.
          </DomainRulesCallouts.Info>
          <DomainRulesCallouts.Warning>
            This domain filter may conflict with existing rules. Please review your configuration.
          </DomainRulesCallouts.Warning>
          <DomainRulesCallouts.Error>
            Invalid domain filter format. Please use a valid domain pattern like "example.com".
          </DomainRulesCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Regex Presets Callouts (Cyan)</Heading>
        <Flex direction="column" gap="2">
          <RegexPresetsCallouts.Info>
            Regex preset applied successfully. Your pattern will be used for tab title parsing.
          </RegexPresetsCallouts.Info>
          <RegexPresetsCallouts.Warning>
            This regex pattern may be too broad and could match unintended content.
          </RegexPresetsCallouts.Warning>
          <RegexPresetsCallouts.Error>
            Invalid regex pattern. Please check your syntax and try again.
          </RegexPresetsCallouts.Error>
        </Flex>
      </Box>


      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Import Callouts (Jade)</Heading>
        <Flex direction="column" gap="2">
          <ImportCallouts.Info>
            Configuration file imported successfully. All settings have been applied.
          </ImportCallouts.Info>
          <ImportCallouts.Warning>
            Some settings in the import file were skipped due to compatibility issues.
          </ImportCallouts.Warning>
          <ImportCallouts.Error>
            Failed to import configuration. The file format is invalid or corrupted.
          </ImportCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Export Callouts (Teal)</Heading>
        <Flex direction="column" gap="2">
          <ExportCallouts.Info>
            Configuration exported successfully. Your settings have been saved to the download folder.
          </ExportCallouts.Info>
          <ExportCallouts.Warning>
            Export contains sensitive information. Please handle the file securely.
          </ExportCallouts.Warning>
          <ExportCallouts.Error>
            Failed to export configuration. Please check your browser permissions and try again.
          </ExportCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Statistics Callouts (Orange)</Heading>
        <Flex direction="column" gap="2">
          <StatisticsCallouts.Info>
            Statistics have been updated. Data is current as of the last browser session.
          </StatisticsCallouts.Info>
          <StatisticsCallouts.Warning>
            Statistics data is older than 7 days. Consider refreshing for more accurate insights.
          </StatisticsCallouts.Warning>
          <StatisticsCallouts.Error>
            Unable to load statistics data. Please check your browser storage permissions.
          </StatisticsCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Settings Callouts (Gray)</Heading>
        <Flex direction="column" gap="2">
          <SettingsCallouts.Info>
            Settings saved successfully. Changes will take effect immediately.
          </SettingsCallouts.Info>
          <SettingsCallouts.Warning>
            Some settings require a browser restart to take full effect.
          </SettingsCallouts.Warning>
          <SettingsCallouts.Error>
            Failed to save settings. Please try again or reset to default values.
          </SettingsCallouts.Error>
        </Flex>
      </Box>
    </Flex>
  )
};

export const CalloutsComparison: StoryObj = {
  name: 'Theme Comparison',
  render: () => (
    <Flex direction="column" gap="4" p="4">
      <Heading as="h2" size="6" weight="bold" mb="4">Theme Color Comparison</Heading>
      
      <Text as="p" size="3" color="gray" mb="4">
        This story shows all feature themes side by side to demonstrate the visual distinction between different functional areas.
      </Text>

      <Flex direction="column" gap="3">
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Domain Rules:</Text>
          <DomainRulesCallouts.Info>Purple themed callout for domain rule operations</DomainRulesCallouts.Info>
        </Flex>
        
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Regex Presets:</Text>
          <RegexPresetsCallouts.Info>Cyan themed callout for regex preset operations</RegexPresetsCallouts.Info>
        </Flex>
        
        
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Import:</Text>
          <ImportCallouts.Info>Jade themed callout for import operations</ImportCallouts.Info>
        </Flex>
        
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Export:</Text>
          <ExportCallouts.Info>Teal themed callout for export operations</ExportCallouts.Info>
        </Flex>
        
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Statistics:</Text>
          <StatisticsCallouts.Info>Orange themed callout for statistics operations</StatisticsCallouts.Info>
        </Flex>
        
        <Flex align="center" gap="3">
          <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Settings:</Text>
          <SettingsCallouts.Info>Gray themed callout for settings operations</SettingsCallouts.Info>
        </Flex>
      </Flex>
    </Flex>
  )
};

export const CalloutsNuancedColors: StoryObj = {
  name: 'Nuanced Colors by Type',
  render: () => (
    <Flex direction="column" gap="4" p="4">
      <Heading as="h2" size="6" weight="bold" mb="4">Nuanced Colors by Message Type</Heading>
      
      <Text as="p" size="3" color="gray" mb="4">
        Each feature theme now uses different color nuances for Info, Warning, and Error messages to improve readability and semantic meaning.
      </Text>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Domain Rules (Purple Family)</Heading>
        <Flex direction="column" gap="2">
          <DomainRulesCallouts.Info>Purple for informational messages</DomainRulesCallouts.Info>
          <DomainRulesCallouts.Warning>Violet for warnings</DomainRulesCallouts.Warning>
          <DomainRulesCallouts.Error>Plum for errors</DomainRulesCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Regex Presets (Cyan Family)</Heading>
        <Flex direction="column" gap="2">
          <RegexPresetsCallouts.Info>Cyan for informational messages</RegexPresetsCallouts.Info>
          <RegexPresetsCallouts.Warning>Sky for warnings</RegexPresetsCallouts.Warning>
          <RegexPresetsCallouts.Error>Blue for errors</RegexPresetsCallouts.Error>
        </Flex>
      </Box>


      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Import (Green Family)</Heading>
        <Flex direction="column" gap="2">
          <ImportCallouts.Info>Jade for informational messages</ImportCallouts.Info>
          <ImportCallouts.Warning>Teal for warnings</ImportCallouts.Warning>
          <ImportCallouts.Error>Green for errors</ImportCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Export (Teal Family)</Heading>
        <Flex direction="column" gap="2">
          <ExportCallouts.Info>Teal for informational messages</ExportCallouts.Info>
          <ExportCallouts.Warning>Cyan for warnings</ExportCallouts.Warning>
          <ExportCallouts.Error>Blue for errors</ExportCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Statistics (Orange Family)</Heading>
        <Flex direction="column" gap="2">
          <StatisticsCallouts.Info>Orange for informational messages</StatisticsCallouts.Info>
          <StatisticsCallouts.Warning>Amber for warnings (standard warning color)</StatisticsCallouts.Warning>
          <StatisticsCallouts.Error>Red for errors (standard error color)</StatisticsCallouts.Error>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Settings (Gray Family)</Heading>
        <Flex direction="column" gap="2">
          <SettingsCallouts.Info>Gray for informational messages</SettingsCallouts.Info>
          <SettingsCallouts.Warning>Slate for warnings</SettingsCallouts.Warning>
          <SettingsCallouts.Error>Red for errors (standard error color)</SettingsCallouts.Error>
        </Flex>
      </Box>
    </Flex>
  )
};

export const CalloutsUsageExamples: StoryObj = {
  name: 'Usage Examples',
  render: () => (
    <Flex direction="column" gap="4" p="4">
      <Heading as="h2" size="6" weight="bold" mb="4">Real-World Usage Examples</Heading>
      
      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Form Validation Messages</Heading>
        <Flex direction="column" gap="2">
          <DomainRulesCallouts.Error>
            Domain filter is required. Please enter a valid domain pattern.
          </DomainRulesCallouts.Error>
          <RegexPresetsCallouts.Warning>
            This regex pattern contains capturing groups. Make sure you intend to capture these values.
          </RegexPresetsCallouts.Warning>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Operation Status Messages</Heading>
        <Flex direction="column" gap="2">
          <ImportCallouts.Info>
            Import completed successfully. 15 domain rules and 8 regex presets were added.
          </ImportCallouts.Info>
          <StatisticsCallouts.Info>
            Statistics updated. Showing data from the last 30 days with 1,247 tab operations.
          </StatisticsCallouts.Info>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="4" weight="bold" mb="3">Configuration Guidance</Heading>
        <Flex direction="column" gap="2">
          <RegexPresetsCallouts.Info style={{ marginTop: '16px' }}>
            No regex presets available. You can create custom presets to reuse common patterns across multiple rules.
          </RegexPresetsCallouts.Info>
        </Flex>
      </Box>
    </Flex>
  )
};