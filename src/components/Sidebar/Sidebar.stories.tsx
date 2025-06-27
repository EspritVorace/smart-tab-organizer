import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import { Theme, Card, Flex, Avatar, Text, Button, Box } from '@radix-ui/themes';
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
  Menu
} from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
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