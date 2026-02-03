import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import { Theme, Card, Flex, Avatar, Text, Button, Box, SegmentedControl } from '@radix-ui/themes';
import { 
  Home, 
  Settings, 
  BarChart3, 
  FileText, 
  Users, 
  HelpCircle,
  Bell,
  Search,
  Star,
  Archive,
  Menu,
  Shield,
  Regex,
  Group
} from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle.jsx';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/UI/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Theme>
        <div style={{ height: '100vh', display: 'flex' }}>
          <Story />
          <div style={{ flex: 1, padding: '20px', backgroundColor: 'var(--gray-2)' }}>
            <h1>Contenu principal</h1>
            <p>Cette zone représente le contenu principal de l'application.</p>
          </div>
        </div>
      </Theme>
    ),
  ],
  argTypes: {
    isCollapsed: {
      control: 'boolean',
      description: 'État de la sidebar (réduite ou étendue)',
    },
    activeItem: {
      control: 'text',
      description: 'ID de l\'élément actif',
    },
    showFooter: {
      control: 'boolean',
      description: 'Afficher le footer',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const UserFooterExpanded = () => (
  <Card variant="ghost" style={{ padding: '8px' }}>
    <Button variant="ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '8px' }}>
      <Flex align="center" gap="3" width="100%">
        <Avatar size="2" fallback="JD" />
        <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left' }}>
          John Doe
        </Text>
      </Flex>
    </Button>
  </Card>
);

const UserFooterCollapsed = () => (
  <Flex justify="center" p="2">
    <Avatar size="2" fallback="JD" />
  </Flex>
);

const HeaderExpanded = ({ title }: { title: string }) => (
  <Text size="4" weight="bold" color="gray">{title}</Text>
);

const HeaderCollapsed = () => (
  <Flex justify="center">
    <Box style={{ color: 'var(--gray-9)' }}>
      <Menu size={20} />
    </Box>
  </Flex>
);

const ToolbarExpanded = () => (
  <SegmentedControl.Root defaultValue="list" size="1">
    <SegmentedControl.Item value="list">List</SegmentedControl.Item>
    <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
  </SegmentedControl.Root>
);

const defaultItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, accentColor: 'blue' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: '3', accentColor: 'green' },
  { id: 'documents', label: 'Documents', icon: FileText, accentColor: 'orange' },
  { id: 'team', label: 'Team', icon: Users, accentColor: 'purple' },
  { id: 'settings', label: 'Settings', icon: Settings, accentColor: 'gray' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, accentColor: 'red' },
];

export const SidebarDefault: Story = {
  args: {
    items: defaultItems,
    activeItem: 'dashboard',
    isCollapsed: false,
    showFooter: false,
    headerContent: <HeaderExpanded title="Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarCollapsed: Story = {
  args: {
    items: defaultItems,
    activeItem: 'analytics',
    isCollapsed: true,
    showFooter: false,
    headerContent: <HeaderExpanded title="Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarWithFooter: Story = {
  args: {
    items: defaultItems,
    activeItem: 'documents',
    isCollapsed: false,
    showFooter: true,
    footerContent: <UserFooterExpanded />,
    footerCollapsedContent: <UserFooterCollapsed />,
    headerContent: <HeaderExpanded title="Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarWithToggle: Story = {
  args: {
    items: defaultItems,
    activeItem: 'team',
    isCollapsed: false,
    showFooter: false,
    onToggleCollapse: () => console.log('Toggle collapse'),
    headerContent: <HeaderExpanded title="Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarWithFooterCollapsed: Story = {
  args: {
    items: defaultItems,
    activeItem: 'documents',
    isCollapsed: true,
    showFooter: true,
    footerContent: <UserFooterExpanded />,
    footerCollapsedContent: <UserFooterCollapsed />,
    headerContent: <HeaderExpanded title="Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarManyItems: Story = {
  args: {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, accentColor: 'blue' },
      { id: 'search', label: 'Search', icon: Search, badge: 'New', accentColor: 'cyan' },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: '12', accentColor: 'orange' },
      { id: 'favorites', label: 'Favorites', icon: Star, accentColor: 'yellow' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: '3', accentColor: 'green' },
      { id: 'documents', label: 'Documents', icon: FileText, accentColor: 'purple' },
      { id: 'archive', label: 'Archive', icon: Archive, accentColor: 'gray' },
      { id: 'team', label: 'Team', icon: Users, accentColor: 'pink' },
      { id: 'settings', label: 'Settings', icon: Settings, accentColor: 'red' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle, accentColor: 'indigo' },
    ],
    activeItem: 'notifications',
    isCollapsed: false,
    showFooter: true,
    footerContent: <UserFooterExpanded />,
    footerCollapsedContent: <UserFooterCollapsed />,
    headerContent: <HeaderExpanded title="Navigation" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarInteractive: Story = {
  args: {
    items: defaultItems,
    activeItem: 'dashboard',
    isCollapsed: false,
    showFooter: false,
    onItemClick: (itemId: string) => console.log(`Clicked on: ${itemId}`),
    onToggleCollapse: () => console.log('Toggle collapse'),
    headerContent: <HeaderExpanded title="Interactive Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarWithToolbar: Story = {
  args: {
    items: defaultItems,
    activeItem: 'dashboard',
    isCollapsed: false,
    showFooter: false,
    showToolbar: true,
    toolbarContent: <ToolbarExpanded />,
    headerContent: <HeaderExpanded title="Menu with Toolbar" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarWithSearch: Story = {
  args: {
    items: defaultItems,
    activeItem: 'documents',
    isCollapsed: false,
    showFooter: false,
    showSearch: true,
    searchPlaceholder: "Rechercher...",
    onSearch: (query: string) => console.log(`Search: ${query}`),
    onSearchValueChange: (value: string) => console.log(`Search value: ${value}`),
    headerContent: <HeaderExpanded title="Menu with Search" />,
    headerCollapsedContent: <HeaderCollapsed />,
  },
};

export const SidebarComplete: Story = {
  args: {
    items: defaultItems,
    activeItem: 'analytics',
    isCollapsed: false,
    showFooter: true,
    showToolbar: true,
    showSearch: true,
    toolbarContent: <ToolbarExpanded />,
    searchPlaceholder: "Rechercher...",
    footerContent: <UserFooterExpanded />,
    footerCollapsedContent: <UserFooterCollapsed />,
    headerContent: <HeaderExpanded title="Complete Menu" />,
    headerCollapsedContent: <HeaderCollapsed />,
    onToggleCollapse: () => console.log('Toggle collapse'),
    onSearch: (query: string) => console.log(`Search: ${query}`),
    onSearchValueChange: (value: string) => console.log(`Search value: ${value}`),
  },
};

// SmartTab Organizer specific headers
const SmartTabHeader = () => (
  <Flex align="center" gap="3" style={{ width: '100%', paddingRight: '64px', position: 'relative' }}>
    <img 
      src="/icons/icon48.png" 
      alt="SmartTab Organizer" 
      style={{ 
        width: '32px', 
        height: '32px',
        flexShrink: 0
      }} 
    />
    <Flex direction="column" gap="0" style={{ lineHeight: '1.2', flex: 1 }}>
      <Flex align="center" gap="2">
        <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>
          SmartTab
        </Text>
        <Text size="1" style={{ color: 'var(--gray-11)' }}>
          (v1.0.0)
        </Text>
      </Flex>
      <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>
        Organizer
      </Text>
    </Flex>
    <Flex align="center" style={{ position: 'absolute', right: '8px' }}>
      <ThemeToggle />
    </Flex>
  </Flex>
);

const SmartTabHeaderCollapsed = () => (
  <Flex align="center" justify="center" style={{ width: '100%' }}>
    <img 
      src="/icons/icon48.png" 
      alt="SmartTab Organizer" 
      style={{ 
        width: '32px', 
        height: '32px'
      }} 
    />
  </Flex>
);

const smartTabItems = [
  { id: 'rules', label: 'Domain Rules', icon: Shield, accentColor: 'blue' },
  { id: 'presets', label: 'Regex Presets', icon: Regex, accentColor: 'green' },
  { id: 'importexport', label: 'Import/Export', icon: FileText, accentColor: 'orange' },
  { id: 'stats', label: 'Statistics', icon: BarChart3, accentColor: 'red' },
];

export const SidebarSmartTabExpanded: Story = {
  args: {
    items: smartTabItems,
    activeItem: 'rules',
    isCollapsed: false,
    showFooter: true,
    footerContent: <div style={{ padding: '16px', fontSize: '12px', color: 'var(--gray-11)' }}>Licensed under GPL-3.0-only.</div>,
    footerCollapsedContent: <div style={{ padding: '8px', fontSize: '10px', color: 'var(--gray-11)', textAlign: 'center' }}>GPL</div>,
    headerContent: <SmartTabHeader />,
    headerCollapsedContent: <SmartTabHeaderCollapsed />,
    onToggleCollapse: () => console.log('Toggle collapse'),
  },
};

export const SidebarSmartTabCollapsed: Story = {
  args: {
    items: smartTabItems,
    activeItem: 'presets',
    isCollapsed: true,
    showFooter: true,
    footerContent: <div style={{ padding: '16px', fontSize: '12px', color: 'var(--gray-11)' }}>Licensed under GPL-3.0-only.</div>,
    footerCollapsedContent: <div style={{ padding: '8px', fontSize: '10px', color: 'var(--gray-11)', textAlign: 'center' }}>GPL</div>,
    headerContent: <SmartTabHeader />,
    headerCollapsedContent: <SmartTabHeaderCollapsed />,
    onToggleCollapse: () => console.log('Toggle collapse'),
  },
};