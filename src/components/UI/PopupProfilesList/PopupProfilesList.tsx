import React, { useEffect, useState } from 'react';
import { Flex, Text, Separator, Tooltip } from '@radix-ui/themes';
import {
  Briefcase, Home, Code, BookOpen, Gamepad2,
  Music, Coffee, Globe, Star, Heart, Pin,
} from 'lucide-react';
import { browser } from 'wxt/browser';
import { SplitButton } from '../SplitButton/SplitButton';
import { getMessage } from '../../../utils/i18n';
import { loadSessions } from '../../../utils/sessionStorage';
import { getProfileWindowMap, type ProfileWindowMap } from '../../../utils/profileWindowMap';
import type { Session, ProfileIcon } from '../../../types/session';

const ICON_COMPONENTS: Record<ProfileIcon, React.ElementType> = {
  briefcase: Briefcase,
  home: Home,
  code: Code,
  book: BookOpen,
  gamepad: Gamepad2,
  music: Music,
  coffee: Coffee,
  globe: Globe,
  star: Star,
  heart: Heart,
};

function getProfileIcon(icon: ProfileIcon | undefined): React.ReactNode {
  if (!icon) return <Pin size={16} aria-hidden="true" />;
  const IconComp = ICON_COMPONENTS[icon];
  return <IconComp size={16} aria-hidden="true" />;
}

type ProfileState = 'here' | 'elsewhere' | 'closed';

function getProfileState(
  profile: Session,
  map: ProfileWindowMap,
  currentWindowId: number | null,
): ProfileState {
  const wid = map[profile.id];
  if (wid == null) return 'closed';
  if (currentWindowId != null && wid === currentWindowId) return 'here';
  return 'elsewhere';
}

function sendRestoreMessage(profileId: string, target: 'current' | 'new', windowId: number | null) {
  browser.runtime.sendMessage({
    type: 'RESTORE_PROFILE',
    profileId,
    target,
    windowId: windowId ?? undefined,
  });
}

export function PopupProfilesList() {
  const [profiles, setProfiles] = useState<Session[]>([]);
  const [profileWindowMap, setProfileWindowMap] = useState<ProfileWindowMap>({});
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions().then((all) => {
      const pinned = all
        .filter((s) => s.isPinned)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProfiles(pinned);
    });
    getProfileWindowMap().then(setProfileWindowMap);
    browser.windows.getCurrent().then((w) => setCurrentWindowId(w.id ?? null)).catch(() => {});
  }, []);

  if (profiles.length === 0) return null;

  return (
    <>
      <Flex align="center" gap="2">
        <Separator size="1" style={{ flex: 1 }} />
        <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
          {getMessage('popupProfilesLabel')}
        </Text>
        <Separator size="1" style={{ flex: 1 }} />
      </Flex>

      <Flex direction="column" gap="1">
        {profiles.map((profile) => {
          const state = getProfileState(profile, profileWindowMap, currentWindowId);

          const splitButton = (
            <SplitButton
              label="▶"
              onClick={() => {
                if (state !== 'elsewhere') {
                  sendRestoreMessage(profile.id, 'current', currentWindowId);
                }
              }}
              size="1"
              variant={state === 'here' ? 'solid' : 'soft'}
              disabled={state === 'elsewhere'}
              menuItems={[
                {
                  label: getMessage('sessionRestoreCurrentWindow'),
                  onClick: () => sendRestoreMessage(profile.id, 'current', currentWindowId),
                },
                {
                  label: getMessage('sessionRestoreNewWindow'),
                  onClick: () => sendRestoreMessage(profile.id, 'new', currentWindowId),
                },
              ]}
            />
          );

          return (
            <Flex key={profile.id} align="center" gap="2" style={{ minWidth: 0 }}>
              <Flex
                align="center"
                style={{ flexShrink: 0, color: 'var(--gray-11)' }}
              >
                {getProfileIcon(profile.icon)}
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
                {profile.name}
              </Text>
              {state === 'elsewhere' ? (
                <Tooltip content={getMessage('profileAlreadyOpenTooltip')}>
                  <span style={{ display: 'inline-flex' }}>{splitButton}</span>
                </Tooltip>
              ) : (
                splitButton
              )}
            </Flex>
          );
        })}
      </Flex>
    </>
  );
}
