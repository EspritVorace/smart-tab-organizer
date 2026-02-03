import type { Meta, StoryObj } from '@storybook/react';
import { Badge, Text, Box } from '@radix-ui/themes';
import { Edit, Trash2, Eye, Download, Archive, Users, Settings, AlertTriangle } from 'lucide-react';
import { DataTable } from './DataTable';
import { ColumnDefinition, Action } from './types';

const meta: Meta<typeof DataTable> = {
  title: 'Components/UI/DataTable/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
    },
  },
};

export default meta;
type Story<T = Record<string, any>> = StoryObj<typeof DataTable<T>>;

// User Management Example
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

const userColumns: ColumnDefinition<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { 
    key: 'role', 
    label: 'Role', 
    render: (value) => (
      <Badge color={value === 'admin' ? 'red' : value === 'moderator' ? 'orange' : 'blue'}>
        {String(value)}
      </Badge>
    )
  },
  { 
    key: 'status', 
    label: 'Status', 
    render: (value) => (
      <Badge color={value === 'active' ? 'green' : value === 'inactive' ? 'gray' : 'yellow'}>
        {String(value)}
      </Badge>
    )
  },
  { key: 'lastLogin', label: 'Last Login' },
];

const userRowActions: Action<User>[] = [
  {
    label: 'Edit',
    icon: Edit,
    handler: (user) => alert(`Edit user: ${user.name}`),
    variant: 'secondary'
  },
  {
    label: 'View',
    icon: Eye,
    handler: (user) => alert(`View user: ${user.name}`),
    variant: 'secondary'
  },
  {
    label: 'Delete',
    icon: Trash2,
    handler: (user) => alert(`Delete user: ${user.name}`),
    variant: 'danger',
    disabled: (user) => user.role === 'admin'
  }
];

const userBulkActions: Action<User[]>[] = [
  {
    label: 'Archive',
    icon: Archive,
    handler: (users) => alert(`Archive ${users.length} users`),
    variant: 'secondary'
  },
  {
    label: 'Delete',
    icon: Trash2,
    handler: (users) => alert(`Delete ${users.length} users`),
    variant: 'danger'
  }
];

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15 10:30'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-14 16:45'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'moderator',
    status: 'inactive',
    lastLogin: '2024-01-10 09:15'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'user',
    status: 'pending',
    lastLogin: '2024-01-12 14:20'
  }
];

export const DataTableUserManagement: Story<User> = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    searchableFields: ['name', 'email'],
    rowActions: userRowActions,
    bulkActions: userBulkActions,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search users...',
    emptyStateMessage: 'No users found',
  },
};

// Product Inventory Example
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

const productColumns: ColumnDefinition<Product>[] = [
  { key: 'name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { 
    key: 'price', 
    label: 'Price', 
    render: (value) => `$${Number(value).toFixed(2)}`,
    align: 'right'
  },
  { 
    key: 'stock', 
    label: 'Stock', 
    render: (value, row) => (
      <Box>
        <Text color={row.stock < 10 ? 'red' : 'green'}>
          {String(value)}
        </Text>
      </Box>
    ),
    align: 'center'
  },
  { 
    key: 'status', 
    label: 'Status', 
    render: (value) => (
      <Badge color={value === 'in_stock' ? 'green' : value === 'low_stock' ? 'yellow' : 'red'}>
        {String(value).replace('_', ' ')}
      </Badge>
    )
  },
  { key: 'lastUpdated', label: 'Last Updated' },
];

const productRowActions: Action<Product>[] = [
  {
    label: 'Edit',
    icon: Edit,
    handler: (product) => alert(`Edit product: ${product.name}`),
    variant: 'secondary'
  },
  {
    label: 'Restock Alert',
    icon: AlertTriangle,
    handler: (product) => alert(`Restock alert for: ${product.name}`),
    variant: 'secondary',
    hidden: (product) => product.status === 'in_stock'
  }
];

const productBulkActions: Action<Product[]>[] = [
  {
    label: 'Export',
    icon: Download,
    handler: (products) => alert(`Export ${products.length} products`),
    variant: 'secondary'
  },
  {
    label: 'Update Prices',
    icon: Settings,
    handler: (products) => alert(`Update prices for ${products.length} products`),
    variant: 'primary'
  }
];

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Laptop Pro',
    category: 'Electronics',
    price: 1299.99,
    stock: 25,
    status: 'in_stock',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    category: 'Accessories',
    price: 29.99,
    stock: 5,
    status: 'low_stock',
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    name: 'Mechanical Keyboard',
    category: 'Accessories',
    price: 149.99,
    stock: 0,
    status: 'out_of_stock',
    lastUpdated: '2024-01-10'
  },
  {
    id: '4',
    name: 'Monitor 4K',
    category: 'Electronics',
    price: 599.99,
    stock: 12,
    status: 'in_stock',
    lastUpdated: '2024-01-16'
  }
];

export const DataTableProductInventory: Story<Product> = {
  args: {
    data: sampleProducts,
    columns: productColumns,
    searchableFields: ['name', 'category'],
    rowActions: productRowActions,
    bulkActions: productBulkActions,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search products...',
    emptyStateMessage: 'No products found',
  },
};

// Task Management Example
interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  project: string;
}

const taskColumns: ColumnDefinition<Task>[] = [
  { key: 'title', label: 'Task Title' },
  { key: 'assignee', label: 'Assignee' },
  { 
    key: 'priority', 
    label: 'Priority', 
    render: (value) => (
      <Badge color={value === 'high' ? 'red' : value === 'medium' ? 'orange' : 'green'}>
        {String(value)}
      </Badge>
    )
  },
  { 
    key: 'status', 
    label: 'Status', 
    render: (value) => (
      <Badge color={value === 'completed' ? 'green' : value === 'in_progress' ? 'blue' : 'gray'}>
        {String(value).replace('_', ' ')}
      </Badge>
    )
  },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'project', label: 'Project' },
];

const taskRowActions: Action<Task>[] = [
  {
    label: 'Edit',
    icon: Edit,
    handler: (task) => alert(`Edit task: ${task.title}`),
    variant: 'secondary'
  },
  {
    label: 'View',
    icon: Eye,
    handler: (task) => alert(`View task: ${task.title}`),
    variant: 'secondary'
  }
];

const taskBulkActions: Action<Task[]>[] = [
  {
    label: 'Assign',
    icon: Users,
    handler: (tasks) => alert(`Assign ${tasks.length} tasks`),
    variant: 'primary'
  },
  {
    label: 'Archive',
    icon: Archive,
    handler: (tasks) => alert(`Archive ${tasks.length} tasks`),
    variant: 'secondary'
  }
];

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    assignee: 'John Doe',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-01-20',
    project: 'Web App'
  },
  {
    id: '2',
    title: 'Design landing page',
    assignee: 'Jane Smith',
    priority: 'medium',
    status: 'todo',
    dueDate: '2024-01-25',
    project: 'Marketing Site'
  },
  {
    id: '3',
    title: 'Fix navigation bug',
    assignee: 'Bob Johnson',
    priority: 'low',
    status: 'completed',
    dueDate: '2024-01-15',
    project: 'Web App'
  },
  {
    id: '4',
    title: 'Setup CI/CD pipeline',
    assignee: 'Alice Brown',
    priority: 'high',
    status: 'todo',
    dueDate: '2024-01-18',
    project: 'DevOps'
  }
];

export const DataTableTaskManagement: Story<Task> = {
  args: {
    data: sampleTasks,
    columns: taskColumns,
    searchableFields: ['title', 'assignee', 'project'],
    rowActions: taskRowActions,
    bulkActions: taskBulkActions,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search tasks...',
    emptyStateMessage: 'No tasks found',
  },
};

// Additional stories for different states
export const DataTableEmpty: Story<User> = {
  args: {
    data: [],
    columns: userColumns,
    searchableFields: ['name', 'email'],
    rowActions: userRowActions,
    bulkActions: userBulkActions,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search users...',
    emptyStateMessage: 'No users found',
  },
};

export const DataTableLoading: Story<User> = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    searchableFields: ['name', 'email'],
    rowActions: userRowActions,
    bulkActions: userBulkActions,
    selectionMode: 'multiple',
    searchPlaceholder: 'Search users...',
    loading: true,
  },
};

export const DataTableNoSelection: Story<User> = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    searchableFields: ['name', 'email'],
    rowActions: userRowActions,
    selectionMode: 'none',
    searchPlaceholder: 'Search users...',
    emptyStateMessage: 'No users found',
  },
};

export const DataTableSingleSelection: Story<User> = {
  args: {
    data: sampleUsers,
    columns: userColumns,
    searchableFields: ['name', 'email'],
    rowActions: userRowActions,
    selectionMode: 'single',
    searchPlaceholder: 'Search users...',
    emptyStateMessage: 'No users found',
  },
};