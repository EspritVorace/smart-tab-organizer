import type { Meta, StoryObj } from '@storybook/react';
import { CardActions } from './CardActions';
import type { NamedEntity } from '../../../utils/nameUtils';
import * as Toast from '@radix-ui/react-toast';

const meta = {
  title: 'Components/UI/CardActions',
  component: CardActions,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Toast.Provider>
        <div style={{ position: 'relative', minHeight: '200px' }}>
          <Story />
        </div>
        <Toast.Viewport 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--space-4)',
            gap: 'var(--space-3)',
            width: 390,
            maxWidth: '100vw',
            margin: 0,
            listStyle: 'none',
            zIndex: 2147483647,
            outline: 'none',
          }}
        />
      </Toast.Provider>
    ),
  ],
  argTypes: {
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
    onCopy: { action: 'copy' },
    onPaste: { action: 'paste' },
  },
} satisfies Meta<typeof CardActions>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock items for testing
interface MockItem extends NamedEntity {
  id: string;
  label: string;
}

const mockItem: MockItem = {
  id: '1',
  label: 'Test Item'
};

const mockExistingItems: MockItem[] = [
  mockItem,
  { id: '2', label: 'Another Item' }
];

export const CardActionsWithoutClipboard: Story = {
  args: {
    item: mockItem,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
  name: 'Without Clipboard (Basic)',
};

export const CardActionsWithClipboard: Story = {
  args: {
    item: mockItem,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onCopy: () => console.log('Copy clicked - Toast will show'),
    onPaste: (uniqueName) => console.log('Paste clicked with unique name:', uniqueName, '- Toast will show'),
    existingItems: mockExistingItems,
  },
  name: 'With Clipboard (Full Features)',
};

export const CardActionsCustomLabels: Story = {
  args: {
    ...CardActionsWithClipboard.args,
    editLabel: 'Modifier',
    deleteLabel: 'Supprimer',
    copyLabel: 'Copier',
    pasteLabel: 'Coller',
    moreOptionsLabel: 'Plus d\'options',
  },
  name: 'Custom Labels (French)',
};

export const CardActionsCustomDeleteConfirmation: Story = {
  args: {
    ...CardActionsWithClipboard.args,
    confirmDeleteTitle: 'Êtes-vous sûr ?',
    confirmDeleteDescription: 'Cette action supprimera définitivement "Test Item". Cette action ne peut pas être annulée.',
    confirmDeleteConfirmLabel: 'Oui, supprimer',
    confirmDeleteCancelLabel: 'Annuler',
  },
  name: 'Custom Delete Confirmation',
};

export const CardActionsMinimal: Story = {
  args: {
    item: mockItem,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked - Toast will show'),
    confirmDeleteTitle: 'Supprimer l\'élément',
    confirmDeleteDescription: 'Voulez-vous vraiment supprimer cet élément ?',
  },
  name: 'Minimal (No Clipboard)',
};

export const CardActionsToastDemo: Story = {
  args: {
    item: { id: 'demo', label: 'Demo Item for Toasts' },
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked - Watch for success toast'),
    onCopy: () => console.log('Copy clicked - Watch for copy toast'),
    onPaste: (uniqueName) => console.log('Paste clicked - Watch for paste toast with name:', uniqueName),
    existingItems: [
      { id: 'demo', label: 'Demo Item for Toasts' },
      { id: 'existing1', label: 'Existing Item 1' },
      { id: 'existing2', label: 'Demo Item for Toasts (Copy)' },
    ],
  },
  name: 'Toast Notifications Demo',
};