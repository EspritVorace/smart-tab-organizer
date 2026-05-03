import React from 'react';
import { Avatar } from '@radix-ui/themes';
import type { WorkspaceAccentColor } from '@/schemas/workspace.js';

const SIZE_TO_RADIX = {
  sm: '1',
  md: '2',
  lg: '4',
} as const satisfies Record<AvatarSize, '1' | '2' | '4'>;

type AvatarSize = 'sm' | 'md' | 'lg';

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
 * Round badge displaying 1-2 initials of a workspace name on a Radix Avatar
 * tinted with the workspace's accent color. The `soft` variant pairs a tinted
 * background with `<color>-12` text, guaranteeing WCAG AA contrast for normal
 * text across every Radix accent (the `solid` variant only meets large-text
 * thresholds for some scales).
 */
export function WorkspaceAvatar({ name, accentColor, size = 'md', ariaLabel }: WorkspaceAvatarProps) {
  return (
    <Avatar
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      color={accentColor}
      variant="soft"
      radius="full"
      size={SIZE_TO_RADIX[size]}
      fallback={getInitials(name)}
      style={{ flexShrink: 0, userSelect: 'none' }}
    />
  );
}
