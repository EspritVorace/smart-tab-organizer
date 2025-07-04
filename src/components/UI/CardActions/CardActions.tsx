import { useState } from 'react';
import { IconButton, DropdownMenu, AlertDialog, Button, Flex } from '@radix-ui/themes';
import * as Toast from '@radix-ui/react-toast';
import { Edit, MoreHorizontal, Copy, Clipboard, Trash2, Check, X } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { generateUniqueName, extractName, type NamedEntity } from '../../../utils/nameUtils';

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
  confirmDeleteTitle?: string;
  confirmDeleteDescription?: string;
  confirmDeleteConfirmLabel?: string;
  confirmDeleteCancelLabel?: string;
}

/**
 * Props pour les actions de card avec copier-coller
 */
interface CardActionsWithClipboardProps<T extends NamedEntity & { id: string }> extends BaseCardActionsProps<T> {
  onCopy: (item: T) => void;
  onPaste: (uniqueName: string) => void;
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
  existingItems,
  editLabel = getMessage('edit'),
  deleteLabel = getMessage('delete'),
  moreOptionsLabel = getMessage('moreOptions'),
  copyLabel = getMessage('copy'),
  pasteLabel = getMessage('paste'),
  confirmDeleteTitle,
  confirmDeleteDescription,
  confirmDeleteConfirmLabel = getMessage('delete'),
  confirmDeleteCancelLabel = getMessage('cancel')
}: CardActionsProps<T>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clipboardItem, setClipboardItem] = useState<T | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
  const itemName = item.label || item.name || '';
  const hasClipboard = Boolean(onCopy && onPaste && existingItems);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleCopy = () => {
    if (onCopy) {
      setClipboardItem(item);
      onCopy(item);
      showToast(getMessage('toastCopied').replace('{item}', itemName));
    }
  };

  const handlePaste = () => {
    if (onPaste && existingItems && clipboardItem) {
      const originalName = extractName(clipboardItem);
      const existingNames = existingItems.map(item => extractName(item));
      const uniqueName = generateUniqueName(originalName, existingNames);
      onPaste(uniqueName);
      showToast(getMessage('toastPasted').replace('{item}', uniqueName));
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(item.id);
    setIsDeleteDialogOpen(false);
    showToast(getMessage('toastDeleted').replace('{item}', itemName));
  };

  const isPasteAvailable = clipboardItem !== null;

  const defaultDeleteTitle = confirmDeleteTitle || getMessage('confirmDelete');
  const defaultDeleteDescription = confirmDeleteDescription || 
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
          {hasClipboard && (
            <>
              <DropdownMenu.Item 
                onClick={handleCopy}
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
            onClick={() => setIsDeleteDialogOpen(true)} 
            color="red" 
            aria-label={`${deleteLabel} ${itemName}`}
          >
            <Trash2 size={14} />
            {deleteLabel}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>{defaultDeleteTitle}</AlertDialog.Title>
          <AlertDialog.Description>
            {defaultDeleteDescription}
          </AlertDialog.Description>

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

      {toasts.map((toast) => (
        <Toast.Root 
          key={toast.id}
          open={true}
          onOpenChange={() => removeToast(toast.id)}
          duration={3000}
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--green-9)' : 'var(--red-9)',
            color: 'white',
            borderRadius: 'var(--radius-2)',
            padding: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            boxShadow: 'var(--shadow-4)',
            border: 'none',
          }}
        >
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <Toast.Title style={{ margin: 0, fontSize: 'var(--font-size-2)', fontWeight: 'normal' }}>
            {toast.message}
          </Toast.Title>
          <Toast.Close 
            onClick={() => removeToast(toast.id)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-1)',
            }}
          >
            <X size={14} />
          </Toast.Close>
        </Toast.Root>
      ))}
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
  onPaste: (uniqueName: string) => void;
  existingItems: T[];
}