import React, { useEffect, useState } from 'react';
import { AlertDialog, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n.js';
import type { WorkspaceMeta } from '@/schemas/workspace.js';

interface WorkspaceDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: WorkspaceMeta | null;
  onConfirm: () => Promise<void> | void;
}

/**
 * Destructive confirmation that asks the user to retype the workspace name.
 * The button stays disabled until the typed string matches exactly.
 */
export function WorkspaceDeleteConfirmDialog({
  open,
  onOpenChange,
  workspace,
  onConfirm,
}: WorkspaceDeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  if (!workspace) return null;

  const expected = workspace.name.trim();
  const matches = confirmText.trim() === expected;

  const handleConfirm = async () => {
    if (!matches) return;
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content data-testid="workspace-delete-dialog" maxWidth="460px">
        <AlertDialog.Title>
          {getMessage('workspaceDeleteTitle')}
        </AlertDialog.Title>
        <AlertDialog.Description size="2" mb="3">
          {getMessage('workspaceDeleteDescription', [workspace.name])}
        </AlertDialog.Description>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" htmlFor="workspace-delete-confirm-input">
            {getMessage('workspaceDeleteRetypePrompt', [workspace.name])}
          </Text>
          <TextField.Root
            id="workspace-delete-confirm-input"
            data-testid="workspace-delete-confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.currentTarget.value)}
            placeholder={workspace.name}
          />
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button
              data-testid="workspace-delete-btn-cancel"
              variant="soft"
              color="gray"
            >
              {getMessage('cancel')}
            </Button>
          </AlertDialog.Cancel>
          <Button
            data-testid="workspace-delete-btn-confirm"
            color="red"
            disabled={!matches}
            onClick={handleConfirm}
          >
            {getMessage('workspaceDeleteBtnConfirm')}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
