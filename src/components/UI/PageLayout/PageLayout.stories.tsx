import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from './PageLayout';
import { Text, Box, Button, Flex } from '@radix-ui/themes';
import { defaultAppSettings } from '@/types/syncSettings';

const meta: Meta<typeof PageLayout> = {
  title: 'Components/UI/PageLayout/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    titleKey: {
      control: 'text',
    },
    descriptionKey: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PageLayoutDomainRules: Story = {
  args: {
    titleKey: 'domainRulesTab',
    descriptionKey: 'domainRulesPageDescription',
    syncSettings: defaultAppSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Manage domain rules for automatic grouping
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Rule count: {settings.domainRules.length}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="solid">Add rule</Button>
        </Flex>
      </Box>
    ),
  },
};

export const PageLayoutImportExport: Story = {
  args: {
    titleKey: 'importExportTab',
    descriptionKey: 'importExportPageDescription',
    syncSettings: defaultAppSettings,
    children: () => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Import or export your settings
        </Text>
        <Flex gap="3">
          <Button variant="solid">Export</Button>
          <Button variant="outline">Import</Button>
        </Flex>
      </Box>
    ),
  },
};

export const PageLayoutStatistics: Story = {
  args: {
    titleKey: 'statisticsTab',
    descriptionKey: 'statisticsPageDescription',
    syncSettings: defaultAppSettings,
    children: (settings) => (
      <Box>
        <Text size="3" style={{ marginBottom: '16px', display: 'block' }}>
          Extension usage statistics
        </Text>
        <Box style={{ marginBottom: '16px' }}>
          <Text size="2" style={{ color: 'var(--gray-11)' }}>
            Global grouping: {settings.globalGroupingEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </Box>
        <Flex gap="3">
          <Button variant="outline" color="red">Reset</Button>
        </Flex>
      </Box>
    ),
  },
};
