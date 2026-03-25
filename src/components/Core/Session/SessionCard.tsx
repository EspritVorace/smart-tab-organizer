import React, { useState, useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  Card, Flex, Text, IconButton, TextField,
  DropdownMenu, Tooltip, Popover,
} from '@radix-ui/themes';
import {
  Camera, MoreHorizontal, Pencil, Trash2, Check, X,
  Pin, PinOff, ChevronDown, ChevronRight,
  Briefcase, Home, Code, BookOpen, Gamepad2,
  Music, Coffee, Globe, Star, Heart,
} from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { countSessionTabs } from '../../../utils/sessionUtils';
import { chromeGroupColors } from '../TabTree/tabTreeUtils';
import { SplitButton } from '../../UI/SplitButton/SplitButton';
import { ProfileIconPicker } from './ProfileIconPicker';
import { SessionPreviewTree } from './SessionPreviewTree';
import type { SplitButtonMenuItem } from '../../UI/SplitButton/SplitButton';
import type { Session, ProfileIcon } from '../../../types/session';

const PROFILE_ICON_COMPONENTS: Record<ProfileIcon, React.ElementType> = {
  briefcase: Briefcase,
  home: Home,
  code: Code,
  book: BookOpen,
  gamepad: Gamepad2,
  music: Music,
  coffee: Coffee,
  globe: Globe,
  star: Star,
  heart: Heart,
};

interface SessionCardProps {
  session: Session;
  onRestore: (session: Session) => void;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
  onPin: (session: Session) => void;
  onUnpin: (session: Session) => void;
  onChangeIcon: (session: Session, icon: ProfileIcon | undefined) => void;
}

export function SessionCard({
  session,
  onRestore,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onRename,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  onChangeIcon,
}: SessionCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(session.name);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconHovered, setIconHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;
  const groupColors = session.groups.map(g => g.color);

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== session.name) {
      await onRename(session.id, trimmed);
    }
    setIsRenaming(false);
  }, [nameValue, session.id, session.name, onRename]);

  const handleRenameCancel = useCallback(() => {
    setNameValue(session.name);
    setIsRenaming(false);
  }, [session.name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameSubmit();
      if (e.key === 'Escape') handleRenameCancel();
    },
    [handleRenameSubmit, handleRenameCancel],
  );

  const handleIconChange = useCallback(
    (icon: ProfileIcon) => {
      onChangeIcon(session, icon);
      setIconPickerOpen(false);
    },
    [session, onChangeIcon],
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

  // Icon to display: custom icon takes priority, then pin icon for profiles, then camera
  const ProfileIconComponent = session.icon
    ? PROFILE_ICON_COMPONENTS[session.icon]
    : session.isPinned
    ? Pin
    : Camera;

  return (
    <Card size="2">
      <Flex direction="column" gap="2">
        {/* Top row: icon (with pencil overlay) + pin btn + name + more menu */}
        <Flex align="center" gap="2">
          {/* Icon block with pencil overlay */}
          <Popover.Root open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Hidden anchor for the popover */}
              <Popover.Trigger>
                <button
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: 0,
                    border: 0,
                    background: 'transparent',
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </Popover.Trigger>

              <div
                role="button"
                tabIndex={0}
                aria-label={getMessage('sessionChangeIcon')}
                onMouseEnter={() => setIconHovered(true)}
                onMouseLeave={() => setIconHovered(false)}
                onClick={() => setIconPickerOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIconPickerOpen(true); }}
                style={{ cursor: 'pointer' }}
              >
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-2)',
                    backgroundColor: 'var(--accent-a3)',
                  }}
                >
                  <ProfileIconComponent
                    size={18}
                    style={{ color: 'var(--accent-11)' }}
                    aria-hidden="true"
                  />
                </Flex>
                {iconHovered && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-panel-solid)',
                      border: '1px solid var(--gray-a6)',
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  >
                    <Pencil size={9} style={{ color: 'var(--gray-11)' }} aria-hidden="true" />
                  </span>
                )}
              </div>
            </div>
            <Popover.Content side="bottom" align="start" style={{ padding: 'var(--space-3)' }}>
              <ProfileIconPicker value={session.icon} onChange={handleIconChange} />
            </Popover.Content>
          </Popover.Root>

          {/* Pin / Unpin button — before title, larger */}
          {!isRenaming && (
            <Tooltip
              content={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPinAsProfile')}
            >
              <IconButton
                size="3"
                variant={session.isPinned ? 'soft' : 'ghost'}
                color={session.isPinned ? 'indigo' : 'gray'}
                onClick={() => session.isPinned ? onUnpin(session) : onPin(session)}
                aria-label={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPinAsProfile')}
              >
                {session.isPinned
                  ? <PinOff size={16} aria-hidden="true" />
                  : <Pin size={16} aria-hidden="true" />
                }
              </IconButton>
            </Tooltip>
          )}

          {/* Session name / rename field */}
          <Flex direction="column" gap="0" style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            {isRenaming ? (
              <Flex align="center" gap="2">
                <TextField.Root
                  value={nameValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNameValue(e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  autoFocus
                  size="2"
                  style={{ flex: 1 }}
                  aria-label={getMessage('sessionRenameLabel')}
                />
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
              </Flex>
            ) : (
              <Text
                size="3"
                weight="medium"
                onDoubleClick={() => {
                  setNameValue(session.name);
                  setIsRenaming(true);
                }}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'default',
                }}
              >
                {session.name}
              </Text>
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
                {getMessage('sessionTabCount', [String(tabCount)])}
                {groupCount > 0 && ` · ${getMessage('sessionGroupCount', [String(groupCount)])}`}
              </Text>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <SessionPreviewTree session={session} />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </Card>
  );
}
