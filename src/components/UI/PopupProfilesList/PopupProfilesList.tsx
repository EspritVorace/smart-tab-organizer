import React, { useEffect, useState } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
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
    <Flex direction="column" gap="2">
      <Text size="1" weight="medium" color="gray" style={{ paddingLeft: 4 }}>
        {getMessage('popupPinnedSessionsLabel')}
      </Text>

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
          </Card>
        ))}
      </Flex>
    </Flex>
  );
}
