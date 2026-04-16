import React, { useEffect, useState } from 'react';
import { Flex, Text, Separator } from '@radix-ui/themes';
import { Pin } from 'lucide-react';
import { SplitButton } from '@/components/UI/SplitButton/SplitButton';
import { getMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { restoreSessionTabs } from '@/utils/tabRestore';
import { getRuleCategory } from '@/schemas/enums';
import { chromeGroupColors } from '@/utils/tabTreeUtils';
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
          width: 18,
          height: 18,
          borderRadius: '50%',
          fontSize: 11,
          backgroundColor: chromeGroupColors[cat.color],
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {cat.emoji}
      </span>
    );
  }
  return <Pin size={14} aria-hidden="true" />;
}

export function PopupProfilesList() {
  const [pinnedSessions, setPinnedSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions().then((all) => {
      const pinned = all.filter((s) => s.isPinned);
      setPinnedSessions(pinned);
    });
  }, []);

  if (pinnedSessions.length === 0) return null;

  function handleRestore(session: Session, target: 'current' | 'new') {
    restoreSessionTabs(session, target).catch(() => {});
  }

  return (
    <>
      <Flex align="center" gap="2">
        <Separator size="1" style={{ flex: 1 }} />
        <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
          {getMessage('popupPinnedSessionsLabel')}
        </Text>
        <Separator size="1" style={{ flex: 1 }} />
      </Flex>

      <Flex data-testid="popup-profiles-list" direction="column" gap="1">
        {pinnedSessions.map((session) => (
          <Flex key={session.id} data-testid={`popup-profile-item-${session.id}`} align="center" gap="2" style={{ minWidth: 0 }}>
            <Flex align="center" style={{ flexShrink: 0, color: 'var(--gray-11)' }}>
              {getCategoryIcon(session.categoryId)}
            </Flex>
            <Text
              size="2"
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
            <SplitButton
              label="▶"
              onClick={() => handleRestore(session, 'current')}
              size="1"
              variant="soft"
              menuItems={[
                {
                  label: getMessage('sessionRestoreCurrentWindow'),
                  onClick: () => handleRestore(session, 'current'),
                },
                {
                  label: getMessage('sessionRestoreNewWindow'),
                  onClick: () => handleRestore(session, 'new'),
                },
              ]}
            />
          </Flex>
        ))}
      </Flex>
    </>
  );
}
