import type { Meta, StoryObj } from '@storybook/react';
import { Flex, Heading, Text, Theme } from '@radix-ui/themes';
import {
  BarChart3,
  Bell,
  Bookmark,
  Layers,
  Settings,
  Shield,
} from 'lucide-react';
import { IconBox } from './IconBox';

const meta: Meta<typeof IconBox> = {
  title: 'Components/UI/IconBox/IconBox',
  component: IconBox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IconBox>;

export const IconBoxDefault: Story = {
  args: {
    icon: Settings,
  },
};

export const IconBoxAllSizes: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconBox icon={Layers} size="sm" />
      <IconBox icon={Layers} size="md" />
      <IconBox icon={Layers} size="lg" />
    </Flex>
  ),
};

export const IconBoxAllVariants: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconBox icon={Bell} size="md" variant="gradient" />
      <IconBox icon={Bell} size="md" variant="soft" />
    </Flex>
  ),
};

export const IconBoxInAccentSubtheme: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Theme accentColor="indigo" hasBackground={false}>
        <IconBox icon={Settings} size="lg" />
      </Theme>
      <Theme accentColor="green" hasBackground={false}>
        <IconBox icon={Settings} size="lg" />
      </Theme>
      <Theme accentColor="orange" hasBackground={false}>
        <IconBox icon={Settings} size="lg" />
      </Theme>
      <Theme accentColor="pink" hasBackground={false}>
        <IconBox icon={Settings} size="lg" />
      </Theme>
    </Flex>
  ),
};

export const IconBoxSidebarPreview: Story = {
  render: () => (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="3">
        <IconBox icon={Shield} size="sm" variant="soft" />
        <Text>Domain Rules</Text>
      </Flex>
      <Flex align="center" gap="3">
        <IconBox icon={Bookmark} size="sm" variant="soft" />
        <Text>Sessions</Text>
      </Flex>
      <Flex align="center" gap="3">
        <IconBox icon={BarChart3} size="sm" variant="soft" />
        <Text>Statistics</Text>
      </Flex>
      <Flex align="center" gap="3">
        <IconBox icon={Settings} size="sm" variant="soft" />
        <Text>Preferences</Text>
      </Flex>
    </Flex>
  ),
};

export const IconBoxPageHeaderPreview: Story = {
  render: () => (
    <Flex align="center" gap="3">
      <IconBox icon={BarChart3} size="lg" variant="gradient" />
      <Heading size="6">Statistics</Heading>
    </Flex>
  ),
};
