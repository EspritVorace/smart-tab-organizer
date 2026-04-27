import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { Github } from 'lucide-react';
import { browser } from 'wxt/browser';

const GITHUB_URL = 'https://github.com/EspritVorace/smart-tab-organizer';

function openGithub() {
  browser.tabs.create({ url: GITHUB_URL });
}

function handleGithubKeyDown(e: React.KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openGithub();
  }
}

/** Expanded sidebar footer: avatar, username, GitHub icon. */
export function OptionsFooter() {
  return (
    <Flex
      data-testid="options-footer"
      align="center"
      gap="3"
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease',
      }}
      onClick={openGithub}
      onKeyDown={handleGithubKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Visiter le profil GitHub d'EspritVorace"
      className="custom-footer-expanded"
    >
      <img
        src="/icons/ev.png"
        alt=""
        aria-hidden="true"
        style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0 }}
      />
      <Flex align="center" gap="2">
        <Text size="2" weight="medium" style={{ color: 'var(--gray-11)', textDecoration: 'none' }}>
          EspritVorace
        </Text>
        <Github size={16} style={{ color: 'var(--gray-11)', flexShrink: 0 }} />
      </Flex>
    </Flex>
  );
}

/** Collapsed sidebar footer: avatar only. */
export function OptionsFooterCollapsed() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        padding: '12px',
        cursor: 'pointer',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease',
      }}
      onClick={openGithub}
      onKeyDown={handleGithubKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Visiter le profil GitHub d'EspritVorace"
      className="custom-footer-collapsed"
    >
      <img
        src="/icons/ev.png"
        alt=""
        aria-hidden="true"
        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
      />
    </Flex>
  );
}
