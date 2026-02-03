import type { Meta, StoryObj } from '@storybook/react';
import { Button, Flex, Text, TextField, Select, Switch, Box } from '@radix-ui/themes';
import { 
  DomainRulesTheme, 
  RegexPresetsTheme, 
  ImportTheme, 
  ExportTheme, 
  StatisticsTheme, 
  SettingsTheme 
} from './index';

const meta: Meta = {
  title: 'Components/Form/Themes/Themed Components',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const ThemeShowcase = ({ ThemeComponent, title }: { ThemeComponent: React.ComponentType<{ children: React.ReactNode }>, title: string }) => (
  <Box style={{ border: '1px solid var(--gray-6)', borderRadius: '8px', padding: '16px', margin: '8px 0' }}>
    <Text as="h3" size="4" weight="bold" mb="3">{title}</Text>
    <ThemeComponent>
      <Flex direction="column" gap="3">
        <Flex gap="2" align="center">
          <Text size="2" weight="medium">Button:</Text>
          <Button>Primary Button</Button>
          <Button variant="soft">Soft Button</Button>
          <Button variant="outline">Outline Button</Button>
        </Flex>
        <Flex gap="2" align="center">
          <Text size="2" weight="medium">TextField:</Text>
          <TextField.Root placeholder="Enter text..." style={{ width: '200px' }} />
        </Flex>
        <Flex gap="2" align="center">
          <Text size="2" weight="medium">Select:</Text>
          <Select.Root defaultValue="option1">
            <Select.Trigger placeholder="Select option..." style={{ width: '200px' }} />
            <Select.Content>
              <Select.Item value="option1">Option 1</Select.Item>
              <Select.Item value="option2">Option 2</Select.Item>
              <Select.Item value="option3">Option 3</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
        <Flex gap="2" align="center">
          <Text size="2" weight="medium">Switch:</Text>
          <Switch defaultChecked />
        </Flex>
      </Flex>
    </ThemeComponent>
  </Box>
);

export const ThemesAllThemes: StoryObj = {
  name: 'All Themes Showcase',
  render: () => (
    <Flex direction="column" gap="2">
      <Text as="h2" size="6" weight="bold" mb="4">Feature Themes Showcase</Text>
      <ThemeShowcase ThemeComponent={DomainRulesTheme} title="Domain Rules Theme (Purple)" />
      <ThemeShowcase ThemeComponent={RegexPresetsTheme} title="Regex Presets Theme (Cyan)" />
      <ThemeShowcase ThemeComponent={ImportTheme} title="Import Theme (Jade)" />
      <ThemeShowcase ThemeComponent={ExportTheme} title="Export Theme (Teal)" />
      <ThemeShowcase ThemeComponent={StatisticsTheme} title="Statistics Theme (Orange)" />
      <ThemeShowcase ThemeComponent={SettingsTheme} title="Settings Theme (Gray)" />
    </Flex>
  )
};

export const ThemesDomainRules: StoryObj = {
  name: 'Domain Rules Theme',
  render: () => (
    <DomainRulesTheme>
      <Flex direction="column" gap="4" p="4">
        <Text as="h2" size="6" weight="bold">Domain Rules Configuration</Text>
        <Flex direction="column" gap="3">
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Domain Filter:</Text>
            <TextField.Root placeholder="example.com" style={{ width: '250px' }} />
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
            <Button>Create Rule</Button>
            <Button variant="soft">Edit Rule</Button>
            <Button variant="outline">Delete Rule</Button>
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Enable Rule:</Text>
            <Switch defaultChecked />
          </Flex>
        </Flex>
      </Flex>
    </DomainRulesTheme>
  )
};

export const ThemesRegexPresets: StoryObj = {
  name: 'Regex Presets Theme',
  render: () => (
    <RegexPresetsTheme>
      <Flex direction="column" gap="4" p="4">
        <Text as="h2" size="6" weight="bold">Regex Presets Configuration</Text>
        <Flex direction="column" gap="3">
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Preset Name:</Text>
            <TextField.Root placeholder="My Regex Preset" style={{ width: '250px' }} />
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Pattern:</Text>
            <TextField.Root placeholder="(.+)" style={{ width: '250px' }} />
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
            <Button>Save Preset</Button>
            <Button variant="soft">Test Pattern</Button>
            <Button variant="outline">Clear</Button>
          </Flex>
        </Flex>
      </Flex>
    </RegexPresetsTheme>
  )
};


export const ThemesImportExport: StoryObj = {
  name: 'Import & Export Themes',
  render: () => (
    <Flex direction="column" gap="4">
      <ImportTheme>
        <Box style={{ border: '1px solid var(--gray-6)', borderRadius: '8px', padding: '16px' }}>
          <Text as="h3" size="5" weight="bold" mb="3">Import Configuration</Text>
          <Flex direction="column" gap="3">
            <Flex gap="2" align="center">
              <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Import File:</Text>
              <Button>Choose File</Button>
            </Flex>
            <Flex gap="2" align="center">
              <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
              <Button>Import Settings</Button>
              <Button variant="soft">Validate</Button>
            </Flex>
          </Flex>
        </Box>
      </ImportTheme>
      
      <ExportTheme>
        <Box style={{ border: '1px solid var(--gray-6)', borderRadius: '8px', padding: '16px' }}>
          <Text as="h3" size="5" weight="bold" mb="3">Export Configuration</Text>
          <Flex direction="column" gap="3">
            <Flex gap="2" align="center">
              <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Export Format:</Text>
              <Select.Root defaultValue="json">
                <Select.Trigger placeholder="Select format..." style={{ width: '150px' }} />
                <Select.Content>
                  <Select.Item value="json">JSON</Select.Item>
                  <Select.Item value="yaml">YAML</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
            <Flex gap="2" align="center">
              <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
              <Button>Export Settings</Button>
              <Button variant="soft">Preview</Button>
            </Flex>
          </Flex>
        </Box>
      </ExportTheme>
    </Flex>
  )
};

export const ThemesStatistics: StoryObj = {
  name: 'Statistics Theme',
  render: () => (
    <StatisticsTheme>
      <Flex direction="column" gap="4" p="4">
        <Text as="h2" size="6" weight="bold">Statistics Dashboard</Text>
        <Flex direction="column" gap="3">
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Time Period:</Text>
            <Select.Root defaultValue="week">
              <Select.Trigger placeholder="Select period..." style={{ width: '150px' }} />
              <Select.Content>
                <Select.Item value="day">Last Day</Select.Item>
                <Select.Item value="week">Last Week</Select.Item>
                <Select.Item value="month">Last Month</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
            <Button>Refresh Data</Button>
            <Button variant="soft">Export Stats</Button>
            <Button variant="outline">Clear History</Button>
          </Flex>
        </Flex>
      </Flex>
    </StatisticsTheme>
  )
};

export const ThemesSettings: StoryObj = {
  name: 'Settings Theme',
  render: () => (
    <SettingsTheme>
      <Flex direction="column" gap="4" p="4">
        <Text as="h2" size="6" weight="bold">Application Settings</Text>
        <Flex direction="column" gap="3">
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Theme:</Text>
            <Select.Root defaultValue="system">
              <Select.Trigger placeholder="Select theme..." style={{ width: '150px' }} />
              <Select.Content>
                <Select.Item value="light">Light</Select.Item>
                <Select.Item value="dark">Dark</Select.Item>
                <Select.Item value="system">System</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Auto-save:</Text>
            <Switch defaultChecked />
          </Flex>
          <Flex gap="2" align="center">
            <Text size="2" weight="medium" style={{ minWidth: '120px' }}>Actions:</Text>
            <Button>Save Settings</Button>
            <Button variant="soft">Reset to Default</Button>
          </Flex>
        </Flex>
      </Flex>
    </SettingsTheme>
  )
};