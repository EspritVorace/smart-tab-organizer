import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { browser } from 'wxt/browser';
import { ChevronDown, ExternalLink, Pin } from 'lucide-react';
import { SessionRestoreButton } from '@/components/Core/Session/SessionRestoreButton/SessionRestoreButton';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { restoreSessionTabs, type RestoreTarget } from '@/utils/tabRestore';
import { showSuccessNotification } from '@/utils/notifications';
import { getRuleCategory } from '@/utils/categoriesStore';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
import { useActiveWorkspaceContext } from '@/contexts/ActiveWorkspaceContext';
import type { Session } from '@/types/session';
import styles from './PopupProfilesList.module.css';

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
  const { scopedItems } = useActiveWorkspaceContext();
  const popupPinnedEmptyCollapsedItem = scopedItems.popupPinnedEmptyCollapsedItem;
  const [pinnedSessions, setPinnedSessions] = useState<Session[]>([]);
  const [hasAnySession, setHasAnySession] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [emptyCollapsed, setEmptyCollapsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions().then((all) => {
      setPinnedSessions(all.filter((s) => s.isPinned));
      setHasAnySession(all.length > 0);
      setLoaded(true);
    });
    popupPinnedEmptyCollapsedItem.getValue().then((v) => setEmptyCollapsed(v ?? false));
  }, [popupPinnedEmptyCollapsedItem]);

  const handleRestore = useCallback((session: Session, target: RestoreTarget) => {
    // The popup is not a tab, so browser.tabs.getCurrent() returns undefined,
    // which means every non-pinned tab in the active window is replaced.
    restoreSessionTabs(session, target)
      .then(() => {
        if (target === 'replace') {
          void showSuccessNotification(
            getMessage('sessionSwitchedNotificationTitle'),
            getMessage('sessionSwitchedNotificationMessage', [session.name]),
          );
          window.close();
        }
      })
      .catch(() => {});
  }, []);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, session: Session, index: number) => {
    if (e.target !== e.currentTarget) return;
    const cards = listRef.current?.querySelectorAll<HTMLElement>('[data-popup-pinned-card]');
    if (!cards) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cards[index + 1]?.focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      cards[index - 1]?.focus();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      cards[0]?.focus();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      cards[cards.length - 1]?.focus();
      return;
    }
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.altKey && e.shiftKey) {
        handleRestore(session, 'new');
      } else if (e.altKey) {
        handleRestore(session, 'replace');
      } else if (e.shiftKey) {
        handleRestore(session, 'current');
      } else {
        void openCustomizeRestore(session);
      }
    }
  }, [handleRestore]);

  const handleToggleEmptyCollapsed = useCallback((nextOpen: boolean) => {
    const nextCollapsed = !nextOpen;
    setEmptyCollapsed(nextCollapsed);
    popupPinnedEmptyCollapsedItem.setValue(nextCollapsed).catch(() => {});
  }, [popupPinnedEmptyCollapsedItem]);

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
                  <ExternalLink size={12} />
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

      <Flex
        ref={listRef}
        data-testid="popup-profiles-list"
        direction="column"
        gap="2"
        role="list"
        aria-label={getMessage('popupPinnedSessionsLabel')}
      >
        {pinnedSessions.map((session, index) => (
          <Card
            key={session.id}
            data-testid={`popup-profile-item-${session.id}`}
            data-popup-pinned-card=""
            size="1"
            tabIndex={0}
            role="listitem"
            aria-label={session.name}
            className={styles.pinnedCard}
            onKeyDown={(e) => handleCardKeyDown(e, session, index)}
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
                onReplaceCurrentWindow={(s) => handleRestore(s, 'replace')}
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
