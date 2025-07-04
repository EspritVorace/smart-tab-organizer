import { useState } from 'react';
import { IconButton, DropdownMenu, AlertDialog, Button, Flex } from '@radix-ui/themes';
import * as Toast from '@radix-ui/react-toast';
import { Edit, MoreHorizontal, Copy, Clipboard, Trash2, Check, X } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { type NamedEntity } from '../../../utils/nameUtils';

export interface CardActionsProps<T extends NamedEntity & { id: string }> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onCopy: (item: T) => void;
  onPaste: () => void; // N'a plus besoin d'arguments
  isPasteAvailable: boolean;
  editLabel?: string;
  deleteLabel?: string;
  copyLabel?: string;
  pasteLabel?: string;
  moreOptionsLabel?: string;
  confirmDeleteTitle?: string;
  confirmDeleteDescription?: string;
  confirmDeleteConfirmLabel?: string;
  confirmDeleteCancelLabel?: string;
}

export function CardActions<T extends NamedEntity & { id: string }>({
  item,
  onEdit,
  onDelete,
  onCopy,
  onPaste,
  isPasteAvailable,
  editLabel = getMessage('edit'),
  deleteLabel = getMessage('delete'),
  copyLabel = getMessage('copy'),
  pasteLabel = getMessage('paste'),
  moreOptionsLabel = getMessage('moreOptions'),
  confirmDeleteTitle,
  confirmDeleteDescription,
  confirmDeleteConfirmLabel = getMessage('delete'),
  confirmDeleteCancelLabel = getMessage('cancel'),
}: CardActionsProps<T>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const itemName = item.label || item.name || '';

  const handleDeleteConfirm = () => {
    onDelete(item.id);
    setIsDeleteDialogOpen(false);
  };

  const defaultDeleteTitle = confirmDeleteTitle || getMessage('confirmDelete');
  const defaultDeleteDescription =
    confirmDeleteDescription ||
    getMessage('confirmDeleteDescription').replace('{item}', itemName);

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
          <DropdownMenu.Item onClick={() => onCopy(item)} aria-label={`${copyLabel} ${itemName}`}>
            <Copy size={14} />
            {copyLabel}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={onPaste}
            disabled={!isPasteAvailable}
            aria-label={`${pasteLabel} ${itemName}`}>
            <Clipboard size={14} />
            {pasteLabel}
          </DropdownMenu.Item>

          <DropdownMenu.Separator />

          <DropdownMenu.Item
            onClick={() => setIsDeleteDialogOpen(true)}
            color="red"
            aria-label={`${deleteLabel} ${itemName}`}>
            <Trash2 size={14} />
            {deleteLabel}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>{defaultDeleteTitle}</AlertDialog.Title>
          <AlertDialog.Description>{defaultDeleteDescription}</AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {confirmDeleteCancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDeleteConfirm}>
                {confirmDeleteConfirmLabel}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
