import React, { useState, useCallback, useEffect } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  Card, Flex, Text, IconButton, TextField,
  DropdownMenu, Tooltip, Badge,
} from '@radix-ui/themes';
import {
  MoreHorizontal, Pencil, Trash2, Check, X,
  Pin, PinOff, ChevronDown, ChevronRight,
} from 'lucide-react';
import { getMessage, getPluralMessage } from '../../../utils/i18n';
import { countSessionTabs } from '../../../utils/sessionUtils';
import { AccessibleHighlight } from '../../UI/AccessibleHighlight/AccessibleHighlight';
import { chromeGroupColors } from '../TabTree/tabTreeUtils';
import { getRuleCategory } from '../../../schemas/enums';
import { getRadixColor } from '../../../utils/utils';
import { SplitButton } from '../../UI/SplitButton/SplitButton';
import { SessionPreviewTree } from './SessionPreviewTree';
import type { SplitButtonMenuItem } from '../../UI/SplitButton/SplitButton';
import type { Session } from '../../../types/session';

interface SessionCardProps {
  session: Session;
  existingSessions: Session[];
  onRestore: (session: Session) => void;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onPin: (session: Session) => void;
  onUnpin: (session: Session) => void;
  /**
   * When true, the collapsible preview is forced open (e.g. search matched a tab/group).
   * The user can still manually close it by clicking the trigger.
   */
  forcePreviewOpen?: boolean;
  /**
   * Group IDs that should be expanded in the preview tree when forced open by search.
   * When undefined, all groups are expanded (default behavior).
   */
  searchMatchingGroupIds?: Set<string>;
  /** Raw search query used to highlight matching text in the card */
  searchQuery?: string;
}

export function SessionCard({
  session,
  existingSessions,
  onRestore,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onRename,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  forcePreviewOpen = false,
  searchMatchingGroupIds,
  searchQuery,
}: SessionCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(session.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // When a search match forces the preview open, open it.
  // When the search is cleared (forcePreviewOpen becomes false), close it
  // (unless the user opened it themselves, but we reset to closed to avoid
  // leaving stale state across different search queries).
  useEffect(() => {
    if (forcePreviewOpen) {
      setPreviewOpen(true);
    } else {
      setPreviewOpen(false);
    }
  }, [forcePreviewOpen]);

  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  const groupColors = session.groups.map(g => g.color);
  const category = getRuleCategory(session.categoryId);

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== session.name) {
      const isDuplicate = existingSessions.some(
        s => s.id !== session.id && s.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (isDuplicate) {
        setRenameError(getMessage('errorSessionNameUnique'));
        return;
      }
      await onRename(session.id, trimmed);
    }
    setIsRenaming(false);
  }, [nameValue, session.id, session.name, onRename, existingSessions]);

  const handleRenameCancel = useCallback(() => {
    setNameValue(session.name);
    setRenameError(null);
    setIsRenaming(false);
  }, [session.name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameSubmit();
      if (e.key === 'Escape') handleRenameCancel();
    },
    [handleRenameSubmit, handleRenameCancel],
  );

  const restoreMenuItems: SplitButtonMenuItem[] = [
    {
      label: getMessage('sessionRestoreCurrentWindow'),
      onClick: () => onRestoreCurrentWindow(session),
    },
    {
      label: getMessage('sessionRestoreNewWindow'),
      onClick: () => onRestoreNewWindow(session),
    },
    {
      label: getMessage('sessionRestoreCustomize'),
      onClick: () => onRestore(session),
      separator: true,
    },
  ];

  return (
    <Card size="2">
      <Flex direction="column" gap="2">
        {/* Top row: pin btn + name + category badge + restore + more menu */}
        <Flex align="center" gap="2">
          {/* Pin / Unpin button */}
          {!isRenaming && (
            <Tooltip
              content={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPin')}
            >
              <IconButton
                size="3"
                variant={session.isPinned ? 'soft' : 'ghost'}
                color={session.isPinned ? 'indigo' : 'gray'}
                onClick={() => session.isPinned ? onUnpin(session) : onPin(session)}
                aria-label={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPin')}
              >
                {session.isPinned
                  ? <PinOff size={16} aria-hidden="true" />
                  : <Pin size={16} aria-hidden="true" />
                }
              </IconButton>
            </Tooltip>
          )}

          {/* Session name + category badge */}
          <Flex align="center" gap="2" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            {isRenaming ? (
              <>
                <Flex direction="column" style={{ flex: 1 }}>
                  <TextField.Root
                    value={nameValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNameValue(e.target.value);
                      setRenameError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    size="2"
                    aria-label={getMessage('sessionRenameLabel')}
                  />
                  {renameError && (
                    <Text size="1" color="red" style={{ marginTop: 2 }}>
                      {renameError}
                    </Text>
                  )}
                </Flex>
                <IconButton
                  size="1"
                  variant="soft"
                  onClick={handleRenameSubmit}
                  aria-label={getMessage('sessionConfirmRename')}
                >
                  <Check size={12} aria-hidden="true" />
                </IconButton>
                <IconButton
                  size="1"
                  variant="soft"
                  color="gray"
                  onClick={handleRenameCancel}
                  aria-label={getMessage('cancel')}
                >
                  <X size={12} aria-hidden="true" />
                </IconButton>
              </>
            ) : (
              <>
                <Text
                  size="3"
                  weight="medium"
                  onDoubleClick={() => {
                    setNameValue(session.name);
                    setRenameError(null);
                    setIsRenaming(true);
                  }}
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'default',
                  }}
                >
                  <AccessibleHighlight text={session.name} searchTerm={searchQuery ?? ''} />
                </Text>
                {category && (
                  <Badge color={getRadixColor(category.color) as any} size="1" style={{ flexShrink: 0 }}>
                    {category.emoji} {getMessage(category.labelKey as any)}
                  </Badge>
                )}
              </>
            )}
          </Flex>

          {/* Restore button — just before "..." */}
          {!isRenaming && (
            <SplitButton
              label={getMessage('sessionRestore')}
              onClick={() => onRestore(session)}
              menuItems={restoreMenuItems}
              variant="solid"
              size="1"
            />
          )}

          {/* More menu */}
          {!isRenaming && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  aria-label={getMessage('sessionMoreActions')}
                >
                  <MoreHorizontal size={16} aria-hidden="true" />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => onEdit(session)}>
                  <Pencil size={14} aria-hidden="true" />
                  {getMessage('sessionEdit')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => {
                    setNameValue(session.name);
                    setRenameError(null);
                    setIsRenaming(true);
                  }}
                >
                  <Pencil size={14} aria-hidden="true" />
                  {getMessage('sessionRename')}
                </DropdownMenu.Item>

                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onClick={() => onDelete(session)}>
                  <Trash2 size={14} aria-hidden="true" />
                  {getMessage('delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </Flex>

        {/* Collapsible: read-only tab/group tree preview */}
        <Collapsible.Root open={previewOpen} onOpenChange={setPreviewOpen}>
          <Collapsible.Trigger asChild>
            <button
              type="button"
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                cursor: 'pointer',
                color: 'var(--gray-11)',
              }}
            >
              {previewOpen
                ? <ChevronDown size={13} aria-hidden="true" />
                : <ChevronRight size={13} aria-hidden="true" />
              }
              {groupColors.length > 0 && (
                <Flex align="center" gap="1">
                  {groupColors.map((color, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: chromeGroupColors[color] ?? chromeGroupColors.grey,
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </Flex>
              )}
              <Text size="1" color="gray">
                {getPluralMessage(tabCount, 'sessionTabOne', 'sessionTabCount')}
                {groupCount > 0 && ` · ${getPluralMessage(groupCount, 'sessionGroupOne', 'sessionGroupCount')}`}
              </Text>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <SessionPreviewTree
                session={session}
                forcedExpandedGroupIds={searchMatchingGroupIds}
                searchQuery={searchQuery}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </Card>
  );
}
