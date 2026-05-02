import React, { useEffect, useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n.js';
import type { WorkspaceAccentColor, WorkspaceMeta } from '@/schemas/workspace.js';
import { WorkspaceColorPicker } from './WorkspaceColorPicker.js';
import { WorkspaceAvatar } from './WorkspaceAvatar.js';

interface WorkspaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog is in edit mode; otherwise, in create mode. */
  initial?: WorkspaceMeta;
  /** Names already in use; the dialog forbids submitting a duplicate. */
  takenNames: string[];
  onSubmit: (data: { name: string; accentColor: WorkspaceAccentColor }) => Promise<void> | void;
}

const DEFAULT_NEW_COLOR: WorkspaceAccentColor = 'jade';

function isNameDuplicate(takenNames: string[], name: string, originalName?: string): boolean {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;
  return takenNames.some(
    (t) => t.toLowerCase() === trimmed && t.toLowerCase() !== originalName?.trim().toLowerCase(),
  );
}

export function WorkspaceFormDialog({
  open,
  onOpenChange,
  initial,
  takenNames,
  onSubmit,
}: WorkspaceFormDialogProps) {
  const isEdit = !!initial;
  const [name, setName] = useState<string>(initial?.name ?? '');
  const [accentColor, setAccentColor] = useState<WorkspaceAccentColor>(
    initial?.accentColor ?? DEFAULT_NEW_COLOR,
  );

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setAccentColor(initial?.accentColor ?? DEFAULT_NEW_COLOR);
  }, [open, initial]);

  const trimmed = name.trim();
  const duplicate = isNameDuplicate(takenNames, name, initial?.name);
  const tooLong = trimmed.length > 40;
  const canSubmit = trimmed.length > 0 && !duplicate && !tooLong;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({ name: trimmed, accentColor });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content data-testid="workspace-form-dialog" maxWidth="460px">
        <Dialog.Title>
          {isEdit ? getMessage('workspaceEditTitle') : getMessage('workspaceCreateTitle')}
        </Dialog.Title>
        <Dialog.Description size="2" mb="3">
          {isEdit ? getMessage('workspaceEditDescription') : getMessage('workspaceCreateDescription')}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex align="center" gap="3">
            <WorkspaceAvatar name={trimmed || '?'} accentColor={accentColor} size="lg" />
            <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
              <Text as="label" size="2" weight="medium" htmlFor="workspace-form-name">
                {getMessage('workspaceFormNameLabel')}
              </Text>
              <TextField.Root
                id="workspace-form-name"
                data-testid="workspace-form-name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder={getMessage('workspaceFormNamePlaceholder')}
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
              />
              {duplicate ? (
                <Text size="1" color="red" data-testid="workspace-form-error-duplicate">
                  {getMessage('workspaceFormErrorDuplicate')}
                </Text>
              ) : null}
            </Flex>
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">{getMessage('workspaceFormColorLabel')}</Text>
            <WorkspaceColorPicker
              value={accentColor}
              onChange={setAccentColor}
              ariaLabel={getMessage('workspaceFormColorLabel')}
            />
          </Flex>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button data-testid="workspace-form-btn-cancel" variant="soft" color="gray">
              {getMessage('cancel')}
            </Button>
          </Dialog.Close>
          <Button
            data-testid="workspace-form-btn-submit"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? getMessage('save') : getMessage('workspaceFormBtnCreate')}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
