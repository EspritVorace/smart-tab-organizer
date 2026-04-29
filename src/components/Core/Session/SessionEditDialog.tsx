import React, { useState } from 'react';
import {
  AlertDialog,
  Box,
  Flex,
  Text,
  TextArea,
  Button,
  Separator,
} from '@radix-ui/themes';
import * as Label from '@radix-ui/react-label';
import { Pencil } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { DialogShell } from '@/components/UI/DialogShell';
import { TabTreeEditor } from '@/components/Core/TabTree/TabTreeEditor';
import { TextFieldWithCategory } from '@/components/Form/FormFields/TextFieldWithCategory';
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
    <>
      <DialogShell
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel();
          else onOpenChange(true);
        }}
        data-testid="dialog-session-edit"
        maxWidth="600px"
        title={getMessage('sessionEditorTitle')}
        icon={Pencil}
        showHeaderSeparator={false}
        onInteractOutside={interceptClose}
        onEscapeKeyDown={interceptClose}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const input = (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('#session-edit-name');
          input?.focus();
        }}
      >
        {/* Session name + category inline */}
        <Box mb="4" mt="4">
          <Text
            size="2"
            weight="medium"
            style={{ display: 'block', marginBottom: 'var(--space-1)' }}
            asChild
          >
            <Label.Root htmlFor="session-edit-name">
              {getMessage('sessionEditorNameLabel')}
            </Label.Root>
          </Text>
          <TextFieldWithCategory
            id="session-edit-name"
            data-testid="dialog-session-edit-field-name"
            value={editor.editedSession.name}
            onChange={(nextValue) => {
              editor.updateSessionName(nextValue);
              setSaveNameError(null);
            }}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
          />
          {saveNameError && (
            <Text size="1" color="red" style={{ marginTop: 2 }}>
              {saveNameError}
            </Text>
          )}
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
            size="2"
            weight="medium"
            style={{ display: 'block', marginBottom: 'var(--space-1)' }}
            asChild
          >
            <Label.Root htmlFor="session-edit-note">
              {getMessage('sessionNoteLabel')}
            </Label.Root>
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
      </DialogShell>

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
    </>
  );
}
