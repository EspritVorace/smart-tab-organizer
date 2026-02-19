import React, { useState, useCallback } from 'react';
import { Card, Flex, Text, Badge, IconButton, TextField, DropdownMenu } from '@radix-ui/themes';
import { Camera, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { formatSessionDate, countSessionTabs } from '../../../utils/sessionUtils';
import { chromeGroupColors } from '../TabTree/tabTreeUtils';
import { SplitButton } from '../../UI/SplitButton/SplitButton';
import type { SplitButtonMenuItem } from '../../UI/SplitButton/SplitButton';
import type { Session } from '../../../types/session';

interface SessionCardProps {
  session: Session;
  onRestore: (session: Session) => void;
  onRestoreCurrentWindow: (session: Session) => void;
  onRestoreNewWindow: (session: Session) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export function SessionCard({
  session,
  onRestore,
  onRestoreCurrentWindow,
  onRestoreNewWindow,
  onRename,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(session.name);

  const tabCount = countSessionTabs(session);
  const groupCount = session.groups.length;

  // Unique group colors for the color dots
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
      <Flex direction="column" gap="3">
        {/* Top row: icon + name + menu */}
        <Flex align="center" gap="3">
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
            <Camera size={18} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
          </Flex>

          <Flex direction="column" gap="0" style={{ flex: 1, overflow: 'hidden' }}>
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

        {/* Info row: color dots + counts + date */}
        <Flex align="center" gap="3">
          {/* Group color dots */}
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

        {/* Action row */}
        <Flex align="center" justify="end">
          <SplitButton
            label={getMessage('sessionRestore')}
            onClick={() => onRestore(session)}
            menuItems={restoreMenuItems}
            size="1"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
