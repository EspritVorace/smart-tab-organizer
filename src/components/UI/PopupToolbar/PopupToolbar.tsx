import React, { useEffect, useState } from 'react';
import { Box, Button, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { Camera, ChevronDown, RotateCcw, Wand2 } from 'lucide-react';
import { browser } from 'wxt/browser';
import { getMessage } from '../../../utils/i18n';
import { loadSessions } from '../../../utils/sessionStorage';
import { hasCapturableTabs } from '../../../utils/tabCapture';

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

export function PopupToolbar() {
  const [hasSessions, setHasSessions] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [activeTabGroupId, setActiveTabGroupId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions().then((sessions) => setHasSessions(sessions.length > 0));
    hasCapturableTabs().then(setCanSave);
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const groupId = (tabs[0] as any)?.groupId;
      setActiveTabGroupId(typeof groupId === 'number' && groupId >= 0 ? groupId : null);
    });
  }, []);

  const handleOrganize = async () => {
    setIsOrganizing(true);
    await browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' });
    window.close();
  };

  return (
    <Box
      p="1"
      style={{
        background: 'var(--gray-a3)',
        borderRadius: 'var(--radius-3)',
      }}
    >
      <Flex gap="1">
        {activeTabGroupId !== null && canSave ? (
          <Flex style={{ flex: 1 }}>
            <Button
              variant="ghost"
              onClick={() => void openOptionsWithHash('#sessions?action=snapshot')}
              aria-label={getMessage('popupSaveSession')}
              style={{
                flex: 1,
                flexDirection: 'column',
                height: 'auto',
                gap: 3,
                paddingTop: 8,
                paddingBottom: 8,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Camera size={17} aria-hidden="true" />
              <Text as="span" size="1">
                {getMessage('popupSave')}
              </Text>
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button
                  variant="ghost"
                  aria-label={getMessage('popupSaveGroupOptions')}
                  title={getMessage('popupSaveGroupOptions')}
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderLeft: '1px solid var(--gray-a6)',
                    paddingLeft: 4,
                    paddingRight: 4,
                    minWidth: 20,
                    height: 'auto',
                    paddingTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  <ChevronDown size={12} aria-hidden="true" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  onClick={() =>
                    void openOptionsWithHash(
                      `#sessions?action=snapshot&groupId=${activeTabGroupId}`,
                    )
                  }
                >
                  {getMessage('popupSaveActiveGroup')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => void openOptionsWithHash('#sessions?action=snapshot')}
                >
                  {getMessage('popupSaveAllTabs')}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        ) : (
          <Button
            variant="ghost"
            disabled={!canSave}
            onClick={() => void openOptionsWithHash('#sessions?action=snapshot')}
            aria-label={getMessage('popupSaveSession')}
            style={{
              flex: 1,
              flexDirection: 'column',
              height: 'auto',
              gap: 3,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <Camera size={17} aria-hidden="true" />
            <Text as="span" size="1">
              {getMessage('popupSave')}
            </Text>
          </Button>
        )}

        <Button
          variant="ghost"
          disabled={!hasSessions}
          onClick={() => void openOptionsWithHash('#sessions')}
          aria-label={getMessage('popupRestoreSession')}
          style={{
            flex: 1,
            flexDirection: 'column',
            height: 'auto',
            gap: 3,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <RotateCcw size={17} aria-hidden="true" />
          <Text as="span" size="1">
            {getMessage('popupRestore')}
          </Text>
        </Button>

        <Button
          variant="ghost"
          disabled={isOrganizing}
          onClick={() => void handleOrganize()}
          aria-label={getMessage('organizeAllTabs')}
          title={getMessage('organizeAllTabs')}
          style={{
            flex: 1,
            flexDirection: 'column',
            height: 'auto',
            gap: 3,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <Wand2 size={17} aria-hidden="true" />
          <Text as="span" size="1">
            {isOrganizing ? getMessage('organizingTabs') : getMessage('organizeAllTabs')}
          </Text>
        </Button>
      </Flex>
    </Box>
  );
}
