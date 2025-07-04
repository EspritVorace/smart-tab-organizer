import React from 'react';
import { IconButton, DropdownMenu } from '@radix-ui/themes';
import { Edit, MoreHorizontal, Copy, Clipboard, Trash2 } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import type { NamedEntity } from '../../../utils/nameUtils';

/**
 * Props de base pour les actions de card
 */
interface BaseCardActionsProps<T extends NamedEntity & { id: string }> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  editLabel?: string;
  deleteLabel?: string;
  moreOptionsLabel?: string;
}

/**
 * Props pour les actions de card avec copier-coller
 */
interface CardActionsWithClipboardProps<T extends NamedEntity & { id: string }> extends BaseCardActionsProps<T> {
  onCopy: (item: T) => void;
  onPaste: (existingItems: T[]) => void;
  isPasteAvailable: boolean;
  existingItems: T[];
  copyLabel?: string;
  pasteLabel?: string;
}

/**
 * Props pour les actions de card sans copier-coller
 */
interface CardActionsWithoutClipboardProps<T extends NamedEntity & { id: string }> extends BaseCardActionsProps<T> {
  onCopy?: never;
  onPaste?: never;
  isPasteAvailable?: never;
  existingItems?: never;
  copyLabel?: never;
  pasteLabel?: never;
}

/**
 * Type union pour les props des actions de card
 */
type CardActionsProps<T extends NamedEntity & { id: string }> = 
  | CardActionsWithClipboardProps<T>
  | CardActionsWithoutClipboardProps<T>;

/**
 * Composant générique pour les actions des cards (édition, suppression, copier-coller optionnel)
 */
export function CardActions<T extends NamedEntity & { id: string }>({
  item,
  onEdit,
  onDelete,
  onCopy,
  onPaste,
  isPasteAvailable,
  existingItems,
  editLabel = getMessage('edit'),
  deleteLabel = getMessage('delete'),
  moreOptionsLabel = getMessage('moreOptions'),
  copyLabel = getMessage('copy'),
  pasteLabel = getMessage('paste')
}: CardActionsProps<T>) {
  const itemName = item.label || item.name || '';
  const hasClipboard = Boolean(onCopy && onPaste && existingItems);

  const handlePaste = () => {
    if (onPaste && existingItems) {
      onPaste(existingItems);
    }
  };

  return (
    <>
      <IconButton
        variant="ghost"
        size="2"
        onClick={() => onEdit(item)}
        title={editLabel}
        aria-label={`${editLabel} ${itemName}`}
        style={{ color: 'var(--gray-11)' }}
      >
        <Edit size={16} />
      </IconButton>
      
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton
            variant="ghost"
            size="2"
            title={moreOptionsLabel}
            aria-label={`${moreOptionsLabel} ${itemName}`}
            style={{ color: 'var(--gray-11)' }}
          >
            <MoreHorizontal size={16} />
          </IconButton>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Content aria-label={`${moreOptionsLabel} ${itemName}`}>
          {hasClipboard && (
            <>
              <DropdownMenu.Item 
                onClick={() => onCopy!(item)}
                aria-label={`${copyLabel} ${itemName}`}
              >
                <Copy size={14} />
                {copyLabel}
              </DropdownMenu.Item>
              
              <DropdownMenu.Item 
                onClick={handlePaste}
                disabled={!isPasteAvailable}
                aria-label={`${pasteLabel} ${itemName}`}
              >
                <Clipboard size={14} />
                {pasteLabel}
              </DropdownMenu.Item>
              
              <DropdownMenu.Separator />
            </>
          )}
          
          <DropdownMenu.Item 
            onClick={() => onDelete(item.id)} 
            color="red" 
            aria-label={`${deleteLabel} ${itemName}`}
          >
            <Trash2 size={14} />
            {deleteLabel}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </>
  );
}

/**
 * Type pour les props communes des cards
 */
export interface BaseCardProps<T extends NamedEntity & { id: string }> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}

/**
 * Type pour les props des cards avec copier-coller
 */
export interface CardWithClipboardProps<T extends NamedEntity & { id: string }> extends BaseCardProps<T> {
  onCopy: (item: T) => void;
  onPaste: (existingItems: T[]) => void;
  isPasteAvailable: boolean;
  existingItems: T[];
}