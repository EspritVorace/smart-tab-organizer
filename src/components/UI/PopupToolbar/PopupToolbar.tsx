import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { browser } from 'wxt/browser';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { hasCapturableTabs } from '@/utils/tabCapture';

/** Focus an existing Options tab or open a new one with the given hash. */
async function openOptionsWithHash(hash: string) {
  const optionsUrl = browser.runtime.getURL('/options.html');
  const allTabs = await browser.tabs.query({});
  const existing = allTabs.find((t) => t.url?.startsWith(optionsUrl));

  if (existing?.id != null) {
    await browser.tabs.update(existing.id, { url: optionsUrl + hash, active: true });
    if (existing.windowId != null) {
      await browser.windows.update(existing.windowId, { focused: true });
    }
  } else {
    await browser.tabs.create({ url: optionsUrl + hash });
  }
}

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  flexDirection: 'column',
  height: 'auto',
  gap: 4,
  paddingTop: 10,
  paddingBottom: 10,
  borderRadius: 'var(--radius-5)',
};

const actionEmojiStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function PopupToolbar() {
  const [hasSessions, setHasSessions] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [activeTabGroupId, setActiveTabGroupId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions().then((sessions) => setHasSessions(sessions.length > 0));
    hasCapturableTabs().then(setCanSave);
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const groupId = (tabs[0] as { groupId?: number } | undefined)?.groupId;
      setActiveTabGroupId(typeof groupId === 'number' && groupId >= 0 ? groupId : null);
    });
  }, []);

  const handleOrganize = async () => {
    setIsOrganizing(true);
    await browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' });
    window.close();
  };

  const saveDisabledHint = !canSave ? getMessage('popupSaveDisabledHint') : undefined;
  const isInGroup = activeTabGroupId !== null && canSave;
  const saveHash = isInGroup
    ? `#sessions?action=snapshot&groupId=${activeTabGroupId}`
    : '#sessions?action=snapshot';
  const saveAriaLabel = isInGroup
    ? getMessage('popupSaveActiveGroup')
    : getMessage('popupSaveSession');

  return (
    <Box
      data-testid="popup-toolbar"
      p="1"
      style={{
        background: 'var(--gray-a3)',
        borderRadius: 'var(--radius-5)',
      }}
    >
      <Flex gap="1">
        <Button
          data-testid="popup-toolbar-btn-save"
          variant="soft"
          disabled={!canSave}
          onClick={() => void openOptionsWithHash(saveHash)}
          aria-label={saveAriaLabel}
          title={saveDisabledHint}
          style={actionButtonStyle}
        >
          <span aria-hidden="true" style={actionEmojiStyle}>
            📸
          </span>
          <Text as="span" size="1">
            {getMessage('popupSave')}
          </Text>
        </Button>

        <Button
          data-testid="popup-toolbar-btn-restore"
          variant="soft"
          disabled={!hasSessions}
          onClick={() => void openOptionsWithHash('#sessions')}
          aria-label={getMessage('popupRestoreSession')}
          style={actionButtonStyle}
        >
          <span aria-hidden="true" style={actionEmojiStyle}>
            🔄
          </span>
          <Text as="span" size="1">
            {getMessage('popupRestore')}
          </Text>
        </Button>

        <Button
          data-testid="popup-toolbar-btn-organize"
          variant="soft"
          disabled={isOrganizing}
          onClick={() => void handleOrganize()}
          aria-label={getMessage('organizeAllTabs')}
          title={getMessage('organizeAllTabs')}
          style={actionButtonStyle}
        >
          <span aria-hidden="true" style={actionEmojiStyle}>
            🪄
          </span>
          <Text as="span" size="1">
            {isOrganizing ? getMessage('organizingTabs') : getMessage('organizeAllTabs')}
          </Text>
        </Button>
      </Flex>
    </Box>
  );
}
