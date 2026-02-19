import React, { useState, useCallback } from 'react';
import {
  Card, Flex, Text, IconButton, TextField,
  DropdownMenu, Switch, Tooltip, Popover,
} from '@radix-ui/themes';
import {
  Camera, MoreHorizontal, Pencil, Trash2, Check, X,
  Pin, PinOff, Image, HelpCircle,
  Briefcase, Home, Code, BookOpen, Gamepad2,
  Music, Coffee, Globe, Star, Heart,
} from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { formatSessionDate, countSessionTabs } from '../../../utils/sessionUtils';
import { chromeGroupColors } from '../TabTree/tabTreeUtils';
import { SplitButton } from '../../UI/SplitButton/SplitButton';
import { ProfileIconPicker } from './ProfileIconPicker';
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
  onToggleAutoSync: (session: Session, autoSync: boolean) => void;
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
  onToggleAutoSync,
}: SessionCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(session.name);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

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

  // Choose the profile icon component to display
  const ProfileIconComponent = session.isPinned && session.icon
    ? PROFILE_ICON_COMPONENTS[session.icon]
    : session.isPinned
    ? Pin
    : Camera;

  return (
    <Card size="2" style={{ position: 'relative' }}>
      {/* Hidden popover anchor for icon picker */}
      <Popover.Root open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
        <Popover.Trigger>
          <button
            style={{
              position: 'absolute',
              top: 8,
              right: 36,
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
        <Popover.Content side="bottom" align="end" style={{ padding: 'var(--space-3)' }}>
          <ProfileIconPicker value={session.icon} onChange={handleIconChange} />
        </Popover.Content>
      </Popover.Root>

      <Flex direction="column" gap="3">
        {/* Top row: icon + name + [profile extras] + menu */}
        <Flex align="center" gap="2">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-2)',
              backgroundColor: 'var(--accent-a3)',
              flexShrink: 0,
            }}
          >
            <ProfileIconComponent size={18} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
          </Flex>

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

          {/* AutoSync toggle (profiles only) */}
          {session.isPinned && !isRenaming && (
            <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
              <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
                {getMessage('sessionAutoSync')}
              </Text>
              <Switch
                size="1"
                checked={session.autoSync}
                onCheckedChange={(checked) => onToggleAutoSync(session, checked)}
                aria-label={getMessage('sessionAutoSync')}
              />
              <Tooltip content={getMessage('sessionAutoSyncTooltip')}>
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  aria-label={getMessage('sessionAutoSyncTooltip')}
                  style={{ cursor: 'default' }}
                >
                  <HelpCircle size={13} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </Flex>
          )}

          {/* Pin / Unpin direct button */}
          {!isRenaming && (
            <Tooltip
              content={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPinAsProfile')}
            >
              <IconButton
                size="1"
                variant={session.isPinned ? 'soft' : 'ghost'}
                color={session.isPinned ? 'indigo' : 'gray'}
                onClick={() => session.isPinned ? onUnpin(session) : onPin(session)}
                aria-label={session.isPinned ? getMessage('sessionUnpin') : getMessage('sessionPinAsProfile')}
              >
                {session.isPinned
                  ? <PinOff size={14} aria-hidden="true" />
                  : <Pin size={14} aria-hidden="true" />
                }
              </IconButton>
            </Tooltip>
          )}

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

                {session.isPinned && (
                  <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                      onClick={() => setTimeout(() => setIconPickerOpen(true), 50)}
                    >
                      <Image size={14} aria-hidden="true" />
                      {getMessage('sessionChangeIcon')}
                    </DropdownMenu.Item>
                  </>
                )}

                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onClick={() => onDelete(session)}>
                  <Trash2 size={14} aria-hidden="true" />
                  {getMessage('delete')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </Flex>

        {/* Info row: color dots + counts + date */}
        <Flex align="center" gap="3">
          {groupColors.length > 0 && (
            <Flex align="center" gap="1">
              {groupColors.map((color, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
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

          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>
            {formatSessionDate(session.updatedAt)}
          </Text>
        </Flex>

        {/* Auto-sync status text (profiles only, when autoSync enabled) */}
        {session.isPinned && session.autoSync && (
          <Text size="1" color="indigo">
            {getMessage('sessionAutoSyncEnabled')}
          </Text>
        )}

        {/* Action row */}
        <Flex align="center" justify="end">
          <SplitButton
            label={getMessage('sessionRestore')}
            onClick={() => onRestore(session)}
            menuItems={restoreMenuItems}
            variant="solid"
            size="1"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
