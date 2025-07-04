

import type { Meta, StoryObj } from '@storybook/react';
import { CardActions } from './CardActions';
import type { NamedEntity } from '../../../utils/nameUtils';
import * as Toast from '@radix-ui/react-toast';
import { DomainRuleClipboardProvider, useDomainRuleClipboard } from '../../../providers/clipboard';
import React, { useState } from 'react';
import { Flex, Card, Text, Button } from '@radix-ui/themes';
import { type DomainRule } from '../../../schemas/domainRule';

// Mock data that conforms to DomainRule structure for the provider
const mockRule: DomainRule = {
  id: '1',
  label: 'Test Item',
  domainFilter: '*',
  groupNameSource: 'title',
  titleParsingRegEx: '(.*)',
  urlParsingRegEx: null,
  deduplicationMatchMode: 'url',
  groupId: null,
  deduplicationEnabled: true,
  presetId: null,
};

// The component that will be rendered in the story
const CardActionsDemo = () => {
  const [rules, setRules] = useState<DomainRule[]>([mockRule]);
  const { copy, paste, isPasteAvailable } = useDomainRuleClipboard();

  const handlePaste = () => {
    const newItem = paste(rules);
    if (newItem) {
      setRules(prev => [...prev, newItem]);
    }
  };

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Card style={{ width: 320 }}>
      <Flex direction="column" gap="3">
        {rules.map(rule => (
          <Flex key={rule.id} align="center" justify="between">
            <Text>{rule.label}</Text>
            <CardActions
              item={rule}
              onEdit={() => console.log('Edit:', rule)}
              onDelete={() => handleDelete(rule.id)}
              onCopy={() => copy(rule)}
              onPaste={handlePaste}
              isPasteAvailable={isPasteAvailable}
            />
          </Flex>
        ))}
        <Button onClick={handlePaste} disabled={!isPasteAvailable}>
          Paste Item from outside
        </Button>
      </Flex>
    </Card>
  );
};


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
        <DomainRuleClipboardProvider>
          <div style={{ position: 'relative', minHeight: '200px' }}>
            <Story />
          </div>
          <Toast.Viewport 
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 2147483647,
            }}
          />
        </DomainRuleClipboardProvider>
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

// A simple story just to render the demo component
export const WithClipboardProvider: Story = {
  render: () => <CardActionsDemo />,
  name: 'With Clipboard Provider',
};


// Mock items for testing other stories
interface MockItem extends NamedEntity {
  id: string;
  label: string;
}

const mockItem: MockItem = {
  id: '1',
  label: 'Test Item'
};

export const CardActionsWithoutClipboard: Story = {
  args: {
    item: mockItem,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    isPasteAvailable: false, // Explicitly disable paste
  },
  name: 'Without Clipboard (Basic)',
};

export const CardActionsCustomLabels: Story = {
  args: {
    item: mockItem,
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
    onCopy: () => console.log('Copy clicked'),
    onPaste: () => console.log('Paste clicked'),
    isPasteAvailable: true,
    editLabel: 'Modifier',
    deleteLabel: 'Supprimer',
    copyLabel: 'Copier',
    pasteLabel: 'Coller',
    moreOptionsLabel: 'Plus d\'options',
  },
  name: 'Custom Labels (French)',
};
