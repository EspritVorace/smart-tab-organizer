import React, { useState, useCallback, useEffect } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  Card, Flex, Text, IconButton, TextField,
  DropdownMenu, Tooltip, Badge, Box, Separator,
} from '@radix-ui/themes';
import {
  MoreHorizontal, Pencil, Trash2, Check, X,
  Pin, PinOff, ChevronDown, ChevronRight,
  Monitor, Square, Wrench,
} from 'lucide-react';
import { getMessage, getPluralMessage } from '../../../utils/i18n';
import { countSessionTabs, formatSessionDate } from '../../../utils/sessionUtils';
import { AccessibleHighlight } from '../../UI/AccessibleHighlight/AccessibleHighlight';
import { chromeGroupColors } from '../TabTree/tabTreeUtils';
import { getRuleCategory } from '../../../schemas/enums';
import { getRadixColor } from '../../../utils/utils';
import { SessionPreviewTree } from './SessionPreviewTree';
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

  // Tooltip content for session metadata
  const tooltipContent = (
    <div style={{ whiteSpace: 'pre-line', fontSize: '12px', lineHeight: '1.4' }}>
      <strong>{session.name}</strong>
      {'\n'}
      {getMessage('sessionCreatedLabel')}: {formatSessionDate(session.createdAt)}
      {'\n'}
      {getMessage('sessionUpdatedLabel')}: {formatSessionDate(session.updatedAt)}
      {session.note && `\n${getMessage('sessionNoteLabel')}: ${session.note}`}
    </div>
  );

  return (
    <Card data-testid={`session-card-${session.id}`} size="2">
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
                <Tooltip
                  content={tooltipContent}
                  side="top"
                  delayDuration={200}
                >
                  <Text
                    data-testid={`session-card-${session.id}-name`}
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
                </Tooltip>
                {category && (
                  <Badge color={getRadixColor(category.color) as any} size="1" style={{ flexShrink: 0 }}>
                    {category.emoji} {getMessage(category.labelKey as any)}
                  </Badge>
                )}
              </>
            )}
          </Flex>

          {/* More menu */}
          {!isRenaming && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton
                  data-testid={`session-card-${session.id}-btn-dropdown`}
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

                <DropdownMenu.Item onClick={() => onRestoreCurrentWindow(session)}>
                  <Monitor size={14} aria-hidden="true" />
                  {getMessage('sessionRestoreCurrentWindow')}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => onRestoreNewWindow(session)}>
                  <Square size={14} aria-hidden="true" />
                  {getMessage('sessionRestoreNewWindow')}
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => onRestore(session)}>
                  <Wrench size={14} aria-hidden="true" />
                  {getMessage('sessionRestoreCustomize')}
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

        {/* Separator between header and preview */}
        <Separator orientation="horizontal" size="1" />

        {/* Collapsible: read-only tab/group tree preview */}
        <Collapsible.Root open={previewOpen} onOpenChange={setPreviewOpen}>
          <Collapsible.Trigger asChild>
            <button
              data-testid={`session-card-${session.id}-preview-toggle`}
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
              {session.note && (
                <Box mt="2" pt="2" style={{ borderTop: '1px solid var(--gray-a4)' }}>
                  <Text
                    size="1"
                    color="gray"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    <AccessibleHighlight text={session.note} searchTerm={searchQuery ?? ''} />
                  </Text>
                </Box>
              )}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </Card>
  );
}
