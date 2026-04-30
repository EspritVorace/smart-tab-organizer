import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useSortable } from '@dnd-kit/react/sortable';
import {
  Card, Flex, Text, IconButton, TextField,
  DropdownMenu, HoverCard, Tooltip, Badge, Box,
} from '@radix-ui/themes';
import {
  MoreHorizontal, Pencil, Trash2, Check, X,
  Pin, PinOff, ChevronDown, ChevronRight,
  GripVertical, AlertTriangle,
} from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { countSessionTabs, formatSessionDate } from '@/utils/sessionUtils';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { AccessibleHighlight } from '@/components/UI/AccessibleHighlight/AccessibleHighlight';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import { getRuleCategory, getCategoryLabel } from '@/utils/categoriesStore';
import { getRadixColor } from '@/utils/utils';
import { SessionPreviewTree } from './SessionPreviewTree';
import { SessionRestoreButton } from './SessionRestoreButton/SessionRestoreButton';
import type { Session } from '@/types/session';

interface SessionCardProps {
  session: Session;
  /**
   * 'full' (défaut) : carte complète avec drag, pin, restore, menu.
   * 'summary' : carte épurée pour les wizards d'import/export (pas d'actions).
   */
  variant?: 'full' | 'summary';
  /**
   * État visuel de la carte en mode summary.
   * 'conflict' : fond orange + icône AlertTriangle.
   * 'identical' : opacité réduite.
   */
  status?: SessionCardStatus;
  /** Slot gauche en mode summary (ex. Checkbox de sélection). */
  leading?: React.ReactNode;
  /** Slot droit en mode summary (ex. Badge statut, DiffPopover). */
  trailing?: React.ReactNode;
  existingSessions?: Session[];
  onRestore?: (session: Session) => void;
  onRestoreCurrentWindow?: (session: Session) => void;
  onRestoreNewWindow?: (session: Session) => void;
  onReplaceCurrentWindow?: (session: Session) => void;
  onRename?: (id: string, newName: string) => Promise<void>;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  onPin?: (session: Session) => void;
  onUnpin?: (session: Session) => void;
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
  /** Array index for drag-and-drop sorting */
  index?: number;
  /** Disable drag when filtering or other conditions */
  isDragDisabled?: boolean;
  /** Called when user clicks "Move to First" in menu */
  onMoveToFirst?: () => void;
  /** Called when user clicks "Move to Last" in menu */
  onMoveLast?: () => void;
  /** Keyboard handler forwarded to the card root for up/down navigation between cards */
  onCardKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
}

/** État visuel d'une SessionCard en mode summary. */
export type SessionCardStatus = 'default' | 'conflict' | 'identical';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getStatusStyle(status: SessionCardStatus): React.CSSProperties {
  if (status === 'conflict') return { background: 'var(--orange-a2)' };
  if (status === 'identical') return { opacity: 0.6 };
  return {};
}

/* ─── SessionMoreMenu ─────────────────────────────────────────────────────── */

interface SessionMoreMenuProps {
  session: Session;
  isDragDisabled: boolean;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onMoveToFirst?: () => void;
  onMoveLast?: () => void;
}

function SessionMoreMenu({ session, isDragDisabled, onEdit, onDelete, onMoveToFirst, onMoveLast }: SessionMoreMenuProps) {
  return (
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

        {(onMoveToFirst || onMoveLast) && <DropdownMenu.Separator />}

        {onMoveToFirst && (
          <DropdownMenu.Item onClick={onMoveToFirst} disabled={isDragDisabled}>
            {getMessage('sessionMoveToFirst')}
          </DropdownMenu.Item>
        )}
        {onMoveLast && (
          <DropdownMenu.Item onClick={onMoveLast} disabled={isDragDisabled}>
            {getMessage('sessionMoveLast')}
          </DropdownMenu.Item>
        )}

        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onClick={() => onDelete(session)}>
          <Trash2 size={14} aria-hidden="true" />
          {getMessage('delete')}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

/* ─── SessionMetadataHoverContent ─────────────────────────────────────────── */

function SessionMetadataHoverContent({ session }: { session: Session }) {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="bold" style={{ borderBottom: '1px solid var(--gray-5)', paddingBottom: 'var(--space-2)' }}>
        {session.name}
      </Text>
      <Box style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', alignItems: 'baseline' }}>
        <Text size="1" weight="bold" color="gray">{getMessage('sessionCreatedLabel')}</Text>
        <Text size="2">{formatSessionDate(session.createdAt)}</Text>
        <Text size="1" weight="bold" color="gray">{getMessage('sessionUpdatedLabel')}</Text>
        <Text size="2">{formatSessionDate(session.updatedAt)}</Text>
        {session.note && (
          <>
            <Text size="1" weight="bold" color="gray">{getMessage('sessionNoteLabel')}</Text>
            <Text size="2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{session.note}</Text>
          </>
        )}
      </Box>
    </Flex>
  );
}

/* ─── useSessionRename ────────────────────────────────────────────────────── */

function useSessionRename(session: Session, existingSessions: Session[], onRename: (id: string, name: string) => Promise<void>) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(session.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.focus();
  }, [isRenaming]);

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

  return {
    isRenaming, setIsRenaming,
    nameValue, setNameValue,
    renameError, setRenameError,
    renameInputRef,
    handleRenameSubmit, handleRenameCancel, handleKeyDown,
  };
}

/* ─── SessionCardSummaryHeader ────────────────────────────────────────────── */

interface SessionCardSummaryHeaderProps {
  session: Session;
  status: SessionCardStatus;
  leading: React.ReactNode;
  trailing: React.ReactNode;
  searchQuery: string | undefined;
  category: ReturnType<typeof getRuleCategory>;
  hoverCardContent: React.ReactNode;
}

function SessionCardSummaryHeader({
  session, status, leading, trailing, searchQuery, category, hoverCardContent,
}: SessionCardSummaryHeaderProps) {
  return (
    <>
      {leading && <Flex align="center" style={{ flexShrink: 0 }}>{leading}</Flex>}
      {status === 'conflict' && (
        <AlertTriangle size={16} style={{ color: 'var(--orange-9)', flexShrink: 0 }} aria-hidden="true" />
      )}
      <Flex align="center" gap="2" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <HoverCard.Root>
          <HoverCard.Trigger>
            <Text
              data-testid={`session-card-${session.id}-name`}
              size="3"
              weight="medium"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
            >
              <AccessibleHighlight text={session.name} searchTerm={searchQuery ?? ''} />
            </Text>
          </HoverCard.Trigger>
          <HoverCard.Content size="2" style={{ maxWidth: 360 }}>
            {hoverCardContent}
          </HoverCard.Content>
        </HoverCard.Root>
        {category && (
          <Tooltip content={getCategoryLabel(category)}>
            <Badge color={getRadixColor(category.color)} size="1" style={{ flexShrink: 0 }}>
              {category.emoji}
            </Badge>
          </Tooltip>
        )}
      </Flex>
      {trailing && <Flex align="center" style={{ flexShrink: 0 }}>{trailing}</Flex>}
    </>
  );
}

/* ─── SessionCardFullHeader ───────────────────────────────────────────────── */

interface SessionCardFullHeaderProps {
  session: Session;
  handleRef: (element: HTMLElement | null) => void;
  isDragDisabled: boolean;
  isRenaming: boolean;
  setIsRenaming: (v: boolean) => void;
  nameValue: string;
  setNameValue: (v: string) => void;
  renameError: string | null;
  setRenameError: (v: string | null) => void;
  renameInputRef: React.RefObject<HTMLInputElement>;
  handleRenameSubmit: () => void;
  handleRenameCancel: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  searchQuery: string | undefined;
  category: ReturnType<typeof getRuleCategory>;
  hoverCardContent: React.ReactNode;
  onPin?: (session: Session) => void;
  onUnpin?: (session: Session) => void;
  onRestore?: (session: Session) => void;
  onRestoreCurrentWindow?: (session: Session) => void;
  onRestoreNewWindow?: (session: Session) => void;
  onReplaceCurrentWindow?: (session: Session) => void;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  onMoveToFirst?: () => void;
  onMoveLast?: () => void;
}

function SessionCardFullHeader({
  session, handleRef, isDragDisabled,
  isRenaming, setIsRenaming, nameValue, setNameValue,
  renameError, setRenameError, renameInputRef,
  handleRenameSubmit, handleRenameCancel, handleKeyDown,
  searchQuery, category, hoverCardContent,
  onPin, onUnpin, onRestore, onRestoreCurrentWindow, onRestoreNewWindow, onReplaceCurrentWindow,
  onEdit, onDelete, onMoveToFirst, onMoveLast,
}: SessionCardFullHeaderProps) {
  return (
    <>
      {/* Drag handle */}
      {!isRenaming && (
        <Box
          ref={handleRef}
          data-testid={`session-card-${session.id}-drag-handle`}
          aria-disabled={isDragDisabled}
          aria-label={getMessage('dragHandle')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragDisabled ? 'not-allowed' : 'grab',
            touchAction: 'none',
            color: isDragDisabled ? 'var(--gray-6)' : 'var(--gray-9)',
            flexShrink: 0,
          }}
        >
          <GripVertical size={16} aria-hidden="true" />
        </Box>
      )}

      {/* Pin / Unpin button */}
      {!isRenaming && (
        <Tooltip content={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPin')}>
          <IconButton
            size="1"
            variant={session.isPinned ? 'soft' : 'ghost'}
            color={session.isPinned ? 'indigo' : 'gray'}
            onClick={() => session.isPinned ? onUnpin?.(session) : onPin?.(session)}
            aria-label={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPin')}
          >
            {session.isPinned
              ? <PinOff size={14} aria-hidden="true" />
              : <Pin size={14} aria-hidden="true" />
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
                ref={renameInputRef}
                value={nameValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNameValue(e.target.value);
                  setRenameError(null);
                }}
                onKeyDown={handleKeyDown}
                size="2"
                aria-label={getMessage('sessionRenameLabel')}
              />
              {renameError && (
                <Text size="1" color="red" style={{ marginTop: 2 }}>
                  {renameError}
                </Text>
              )}
            </Flex>
            <IconButton size="1" variant="soft" onClick={handleRenameSubmit} aria-label={getMessage('sessionConfirmRename')}>
              <Check size={12} aria-hidden="true" />
            </IconButton>
            <IconButton size="1" variant="soft" color="gray" onClick={handleRenameCancel} aria-label={getMessage('cancel')}>
              <X size={12} aria-hidden="true" />
            </IconButton>
          </>
        ) : (
          <>
            <HoverCard.Root>
              <HoverCard.Trigger>
                <Text
                  data-testid={`session-card-${session.id}-name`}
                  size="3"
                  weight="medium"
                  onDoubleClick={() => { setNameValue(session.name); setRenameError(null); setIsRenaming(true); }}
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
                >
                  <AccessibleHighlight text={session.name} searchTerm={searchQuery ?? ''} />
                </Text>
              </HoverCard.Trigger>
              <HoverCard.Content size="2" style={{ maxWidth: 360 }}>
                {hoverCardContent}
              </HoverCard.Content>
            </HoverCard.Root>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              onClick={() => { setNameValue(session.name); setRenameError(null); setIsRenaming(true); }}
              aria-label={getMessage('sessionRename')}
              style={{ flexShrink: 0 }}
            >
              <Pencil size={14} aria-hidden="true" />
            </IconButton>
            {category && (
              <Badge color={getRadixColor(category.color)} size="1" style={{ flexShrink: 0 }}>
                {category.emoji} {getCategoryLabel(category)}
              </Badge>
            )}
          </>
        )}
      </Flex>

      {/* Restore split button */}
      {!isRenaming && onRestoreCurrentWindow && onRestoreNewWindow && onReplaceCurrentWindow && onRestore && (
        <SessionRestoreButton
          session={session}
          onRestoreCurrentWindow={onRestoreCurrentWindow}
          onRestoreNewWindow={onRestoreNewWindow}
          onReplaceCurrentWindow={onReplaceCurrentWindow}
          onCustomize={onRestore}
          data-testid={`session-card-${session.id}-btn-restore`}
        />
      )}

      {/* More menu */}
      {!isRenaming && onEdit && onDelete && (
        <SessionMoreMenu
          session={session}
          isDragDisabled={isDragDisabled}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveToFirst={onMoveToFirst}
          onMoveLast={onMoveLast}
        />
      )}
    </>
  );
}

/* ─── SessionCard ─────────────────────────────────────────────────────────── */

export function SessionCard({
  session,
  variant = 'full',
  status = 'default',
  leading,
  trailing,
  existingSessions = [],
  onRestore,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onReplaceCurrentWindow,
  onRename,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  forcePreviewOpen = false,
  searchMatchingGroupIds,
  searchQuery,
  index = 0,
  isDragDisabled = false,
  onMoveToFirst,
  onMoveLast,
  onCardKeyDown,
}: SessionCardProps) {
  const isSummary = variant === 'summary';

  const {
    isRenaming, setIsRenaming,
    nameValue, setNameValue,
    renameError, setRenameError,
    renameInputRef,
    handleRenameSubmit, handleRenameCancel, handleKeyDown,
  } = useSessionRename(session, existingSessions, onRename ?? (() => Promise.resolve()));
  const [previewOpen, setPreviewOpen] = useState(false);

  // Toujours appelé pour respecter les règles des hooks React
  const { ref, handleRef, isDragging } = useSortable({
    id: session.id,
    index,
    disabled: isSummary || isDragDisabled,
  });

  const dragStyle: React.CSSProperties = {
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? 'relative' : undefined,
  };

  // When a search match forces the preview open, open it.
  // When the search is cleared, close it (resets stale state across different
  // search queries even if the user had opened it themselves).
  useEffect(() => {
    setPreviewOpen(forcePreviewOpen);
  }, [forcePreviewOpen]);

  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  const groupColors = session.groups.map(g => g.color);
  const category = getRuleCategory(session.categoryId);

  const isUpdated = !!session.updatedAt && session.updatedAt !== session.createdAt;
  const relativeDate = isUpdated ? session.updatedAt : session.createdAt;
  const relativePrefix = isUpdated
    ? getMessage('sessionCardModifiedPrefix')
    : getMessage('sessionCardCreatedPrefix');
  const relativeText = useRelativeTime(relativeDate);

  const hoverCardContent = <SessionMetadataHoverContent session={session} />;

  return (
    <Card
      ref={isSummary ? null : ref}
      data-testid={`session-card-${session.id}`}
      data-session-card="true"
      tabIndex={isSummary ? undefined : 0}
      onKeyDown={isSummary ? undefined : onCardKeyDown}
      size="2"
      style={{
        ...dragStyle,
        ...getStatusStyle(status),
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-2)',
      }}
    >
      <Flex direction="column" gap="2">
        {/* Top row */}
        <Flex align="center" gap="2">
          {isSummary ? (
            <SessionCardSummaryHeader
              session={session}
              status={status}
              leading={leading}
              trailing={trailing}
              searchQuery={searchQuery}
              category={category}
              hoverCardContent={hoverCardContent}
            />
          ) : (
            <SessionCardFullHeader
              session={session}
              handleRef={handleRef}
              isDragDisabled={isDragDisabled}
              isRenaming={isRenaming}
              setIsRenaming={setIsRenaming}
              nameValue={nameValue}
              setNameValue={setNameValue}
              renameError={renameError}
              setRenameError={setRenameError}
              renameInputRef={renameInputRef}
              handleRenameSubmit={handleRenameSubmit}
              handleRenameCancel={handleRenameCancel}
              handleKeyDown={handleKeyDown}
              searchQuery={searchQuery}
              category={category}
              hoverCardContent={hoverCardContent}
              onPin={onPin}
              onUnpin={onUnpin}
              onRestore={onRestore}
              onRestoreCurrentWindow={onRestoreCurrentWindow}
              onRestoreNewWindow={onRestoreNewWindow}
              onReplaceCurrentWindow={onReplaceCurrentWindow}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveToFirst={onMoveToFirst}
              onMoveLast={onMoveLast}
            />
          )}
        </Flex>

        {/* Separator between header and preview */}
        <Box
          mb="2"
          style={{
            marginLeft: 'calc(-1 * var(--card-padding, var(--space-4)))',
            marginRight: 'calc(-1 * var(--card-padding, var(--space-4)))',
            borderTop: '1px solid var(--gray-6)',
          }}
        />

        {/* Collapsible: read-only tab/group tree preview */}
        <Collapsible.Root
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          style={{ marginTop: '-6px' }}
        >
          <Collapsible.Trigger asChild>
            <button
              data-testid={`session-card-${session.id}-preview-toggle`}
              type="button"
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
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
              <Text
                size="1"
                color="gray"
                data-testid={`session-card-${session.id}-relative-time`}
                style={{ marginLeft: 'auto' }}
              >
                {relativePrefix}{' '}
                <time dateTime={relativeDate}>{relativeText}</time>
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
