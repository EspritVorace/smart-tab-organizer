import React, { useState } from 'react';
import {
  Dialog,
  AlertDialog,
  Box,
  Flex,
  Text,
  TextField,
  TextArea,
  Button,
  Separator,
  IconButton,
} from '@radix-ui/themes';
import { Pencil, X } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { SessionsTheme } from '@/components/Form/themes';
import { TabTreeEditor } from '@/components/Core/TabTree/TabTreeEditor';
import { CategoryPicker } from '@/components/Core/DomainRule/CategoryPicker';
import { useSessionEditor } from '@/hooks/useSessionEditor';
import { countSessionTabs } from '@/utils/sessionUtils';
import type { Session } from '@/types/session';

interface SessionEditDialogProps {
  /** The session to edit, or null when the dialog is closed */
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the updated session when the user clicks Save */
  onSave: (updatedSession: Session) => Promise<void>;
  existingSessions: Session[];
}

/**
 * Modal dialog for editing a saved session's content and name.
 * Uses a working copy of the session — nothing is persisted until the user clicks Save.
 */
export function SessionEditDialog({
  session,
  open,
  onOpenChange,
  onSave,
  existingSessions,
}: SessionEditDialogProps) {
  if (!session) return null;

  return (
    // key ensures a clean remount (fresh state) whenever a different session is opened
    <SessionEditDialogInner
      key={session.id}
      session={session}
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
      existingSessions={existingSessions}
    />
  );
}

interface InnerProps {
  session: Session;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSession: Session) => Promise<void>;
  existingSessions: Session[];
}

function SessionEditDialogInner({ session, open, onOpenChange, onSave, existingSessions }: InnerProps) {
  const editor = useSessionEditor(session);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(session.categoryId ?? null);
  const [saveNameError, setSaveNameError] = useState<string | null>(null);

  const tabCount = countSessionTabs(editor.editedSession);
  const groupCount = editor.editedSession.groups.length;

  async function handleSave() {
    const name = editor.editedSession.name.trim();
    const isDuplicate = existingSessions.some(
      s => s.id !== session.id && s.name.toLowerCase() === name.toLowerCase(),
    );
    if (isDuplicate) {
      setSaveNameError(getMessage('errorSessionNameUnique'));
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...editor.editedSession,
        categoryId,
        updatedAt: new Date().toISOString(),
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (editor.isDirty) {
      setShowUnsavedAlert(true);
    } else {
      onOpenChange(false);
    }
  }

  function handleConfirmLeave() {
    setShowUnsavedAlert(false);
    editor.reset();
    onOpenChange(false);
  }

  function interceptClose(e: Event) {
    if (editor.isDirty) {
      e.preventDefault();
      setShowUnsavedAlert(true);
    }
  }

  return (
    <SessionsTheme>
      <Dialog.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel();
          else onOpenChange(true);
        }}
      >
        <Dialog.Content
          data-testid="dialog-session-edit"
          maxWidth="600px"
          onInteractOutside={interceptClose}
          onEscapeKeyDown={interceptClose}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('#session-edit-name');
            input?.focus();
          }}
        >
          {/* Title row */}
          <Flex justify="between" align="center" mb="4">
            <Dialog.Title mb="0">
              <Flex align="center" gap="2">
                <Pencil size={16} aria-hidden="true" />
                {getMessage('sessionEditorTitle')}
              </Flex>
            </Dialog.Title>
            <Dialog.Close>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                aria-label={getMessage('close')}
              >
                <X size={16} aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </Flex>

          {/* Session name + category inline */}
          <Box mb="4">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="session-edit-name"
              style={{ display: 'block', marginBottom: 'var(--space-1)' }}
            >
              {getMessage('sessionEditorNameLabel')}
            </Text>
            <Flex align="center" gap="2">
              <Box style={{ flex: 1 }}>
                <TextField.Root
                  data-testid="dialog-session-edit-field-name"
                  id="session-edit-name"
                  value={editor.editedSession.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    editor.updateSessionName(e.target.value);
                    setSaveNameError(null);
                  }}
                  size="2"
                  style={{ width: '100%' }}
                  aria-label={getMessage('sessionEditorNameLabel')}
                />
                {saveNameError && (
                  <Text size="1" color="red" style={{ marginTop: 2 }}>
                    {saveNameError}
                  </Text>
                )}
              </Box>
              <CategoryPicker value={categoryId as any} onChange={setCategoryId} />
            </Flex>
          </Box>

          <Separator size="4" mb="3" />

          {/* Editable tab tree */}
          <TabTreeEditor
            session={editor.editedSession}
            onSessionChange={editor.applySessionUpdate}
            maxHeight={360}
          />

          {/* Note */}
          <Box mt="3">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="session-edit-note"
              style={{ display: 'block', marginBottom: 'var(--space-1)' }}
            >
              {getMessage('sessionNoteLabel')}
            </Text>
            <TextArea
              id="session-edit-note"
              value={editor.editedSession.note ?? ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                editor.updateSessionNote(e.target.value)
              }
              placeholder={getMessage('sessionNotePlaceholder')}
              resize="vertical"
              rows={3}
            />
          </Box>

          {/* Summary */}
          <Box mt="3">
            <Text size="1" color="gray">
              {getPluralMessage(tabCount, 'sessionTabOne', 'sessionTabCount')}
              {' · '}
              {getPluralMessage(groupCount, 'sessionGroupOne', 'sessionGroupCount')}
            </Text>
          </Box>

          {/* Footer buttons */}
          <Flex gap="2" justify="end" mt="4">
            <Button
              data-testid="dialog-session-edit-btn-cancel"
              variant="soft"
              color="gray"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {getMessage('cancel')}
            </Button>
            <Button data-testid="dialog-session-edit-btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? getMessage('loadingText') : getMessage('save')}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Unsaved changes confirmation */}
      <AlertDialog.Root open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>{getMessage('sessionEditorUnsavedTitle')}</AlertDialog.Title>
          <AlertDialog.Description size="2">
            {getMessage('sessionEditorUnsavedChanges')}
          </AlertDialog.Description>
          <Flex gap="2" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {getMessage('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleConfirmLeave}>
                {getMessage('sessionEditorLeave')}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </SessionsTheme>
  );
}
