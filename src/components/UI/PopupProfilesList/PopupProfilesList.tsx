import React, { useEffect, useState } from 'react';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { browser } from 'wxt/browser';
import { ChevronDown, ExternalLink, Pin } from 'lucide-react';
import { SessionRestoreButton } from '@/components/Core/Session/SessionRestoreButton/SessionRestoreButton';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { restoreSessionTabs } from '@/utils/tabRestore';
import { getRuleCategory } from '@/schemas/enums';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import { popupPinnedEmptyCollapsedItem } from '@/utils/storageItems';
import type { Session } from '@/types/session';

function getCategoryIcon(categoryId: string | null | undefined): React.ReactNode {
  const cat = getRuleCategory(categoryId);
  if (cat) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          fontSize: 12,
          backgroundColor: chromeGroupColors[cat.color],
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {cat.emoji}
      </span>
    );
  }
  return (
    <Box
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: 'var(--accent-a3)',
        color: 'var(--accent-11)',
        flexShrink: 0,
      }}
    >
      <Pin size={12} />
    </Box>
  );
}

async function openSessionsPage(hashSuffix = '') {
  const url = browser.runtime.getURL('/options.html') + '#sessions' + hashSuffix;
  const tabs = await browser.tabs.query({ url: browser.runtime.getURL('/options.html') });
  if (tabs.length > 0 && tabs[0].id != null) {
    await browser.tabs.update(tabs[0].id, { active: true, url });
    if (tabs[0].windowId != null) {
      await browser.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await browser.tabs.create({ url });
  }
  window.close();
}

async function openCustomizeRestore(session: Session) {
  await openSessionsPage(`?action=restore&sessionId=${encodeURIComponent(session.id)}`);
}

export function PopupProfilesList() {
  const [pinnedSessions, setPinnedSessions] = useState<Session[]>([]);
  const [hasAnySession, setHasAnySession] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [emptyCollapsed, setEmptyCollapsed] = useState(false);

  useEffect(() => {
    loadSessions().then((all) => {
      setPinnedSessions(all.filter((s) => s.isPinned));
      setHasAnySession(all.length > 0);
      setLoaded(true);
    });
    popupPinnedEmptyCollapsedItem.getValue().then(setEmptyCollapsed);
  }, []);

  function handleRestore(session: Session, target: 'current' | 'new') {
    restoreSessionTabs(session, target).catch(() => {});
  }

  function handleToggleEmptyCollapsed(nextOpen: boolean) {
    const nextCollapsed = !nextOpen;
    setEmptyCollapsed(nextCollapsed);
    popupPinnedEmptyCollapsedItem.setValue(nextCollapsed).catch(() => {});
  }

  if (!loaded) return null;

  const hasPinned = pinnedSessions.length > 0;
  const showEmptyHint = !hasPinned && hasAnySession;

  if (!hasPinned && !showEmptyHint) return null;

  const sectionLabel = (
    <Text size="1" weight="medium" color="gray">
      {getMessage('popupPinnedSessionsLabel')}
    </Text>
  );

  if (showEmptyHint) {
    const isOpen = !emptyCollapsed;
    return (
      <Collapsible.Root open={isOpen} onOpenChange={handleToggleEmptyCollapsed}>
        <Flex direction="column" gap="2">
          <Collapsible.Trigger asChild>
            <button
              type="button"
              data-testid="popup-pinned-empty-toggle"
              aria-label={getMessage('popupPinnedEmptyToggleAria')}
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
                userSelect: 'none',
                borderRadius: 'var(--radius-2)',
                paddingLeft: 4,
              }}
            >
              <ChevronDown
                size={14}
                aria-hidden="true"
                style={{
                  color: 'var(--gray-9)',
                  transition: 'transform 0.2s ease',
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
              {sectionLabel}
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Card size="1" data-testid="popup-pinned-empty">
              <Flex direction="column" gap="2" align="start">
                <Text size="2" color="gray">
                  {getMessage('popupPinnedEmptyHint')}
                </Text>
                <Button
                  variant="soft"
                  size="1"
                  onClick={() => void openSessionsPage()}
                >
                  <ExternalLink size={12} aria-hidden="true" />
                  {getMessage('popupGoToSessions')}
                </Button>
              </Flex>
            </Card>
          </Collapsible.Content>
        </Flex>
      </Collapsible.Root>
    );
  }

  return (
    <Flex direction="column" gap="2">
      <Box style={{ paddingLeft: 4 }}>{sectionLabel}</Box>

      <Flex data-testid="popup-profiles-list" direction="column" gap="2">
        {pinnedSessions.map((session) => (
          <Card
            key={session.id}
            data-testid={`popup-profile-item-${session.id}`}
            size="1"
          >
            <Flex align="center" gap="3" style={{ minWidth: 0 }}>
              <Flex align="center" style={{ flexShrink: 0 }}>
                {getCategoryIcon(session.categoryId)}
              </Flex>
              <Text
                size="2"
                weight="medium"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.name}
              </Text>
              <SessionRestoreButton
                session={session}
                onRestoreCurrentWindow={(s) => handleRestore(s, 'current')}
                onRestoreNewWindow={(s) => handleRestore(s, 'new')}
                onCustomize={(s) => { void openCustomizeRestore(s); }}
                data-testid={`popup-profile-btn-restore-${session.id}`}
              />
            </Flex>
          </Card>
        ))}
      </Flex>
    </Flex>
  );
}
