import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import type { WorkspaceAccentColor } from '@/schemas/workspace.js';

const SIZE_TO_PX = {
  sm: { box: 24, font: '11px' },
  md: { box: 32, font: '13px' },
  lg: { box: 44, font: '17px' },
} as const;

type AvatarSize = keyof typeof SIZE_TO_PX;

export function getInitials(name: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface WorkspaceAvatarProps {
  name: string;
  accentColor: WorkspaceAccentColor;
  size?: AvatarSize;
  ariaLabel?: string;
}

/**
 * Round badge displaying 1-2 initials of a workspace name on a filled circle
 * tinted with the workspace's Radix accent color. Purely visual; consumers
 * decide whether the avatar acts as a button via wrappers.
 */
export function WorkspaceAvatar({ name, accentColor, size = 'md', ariaLabel }: WorkspaceAvatarProps) {
  const { box, font } = SIZE_TO_PX[size];
  return (
    <Flex
      align="center"
      justify="center"
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      style={{
        width: box,
        height: box,
        flexShrink: 0,
        borderRadius: '50%',
        background: `var(--${accentColor}-9)`,
        color: 'var(--accent-contrast)',
        userSelect: 'none',
      }}
    >
      <Text
        size="2"
        weight="bold"
        style={{ fontSize: font, color: 'var(--accent-contrast)', lineHeight: 1 }}
      >
        {getInitials(name)}
      </Text>
    </Flex>
  );
}
