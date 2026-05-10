import { Theme } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';

export type IconBoxSize = 'sm' | 'md' | 'lg';
export type IconBoxVariant = 'gradient' | 'soft';

export interface IconBoxProps {
  /** Lucide icon rendered at the center. */
  icon: LucideIcon;
  /** Container size. Default: 'md'. */
  size?: IconBoxSize;
  /** Visual style. Default: 'gradient' (Windows 11 look). */
  variant?: IconBoxVariant;
  /** Optional additional CSS class. */
  className?: string;
}

const SIZE_CONFIG: Record<IconBoxSize, { box: number; icon: number; radius: string }> = {
  sm: { box: 24, icon: 14, radius: 'var(--radius-2)' },
  md: { box: 32, icon: 18, radius: 'var(--radius-3)' },
  lg: { box: 44, icon: 24, radius: 'var(--radius-4)' },
};

/**
 * IconBox: rounded container that displays a Lucide icon over a background
 * derived from the active Radix theme's accent color.
 *
 * Uses `var(--accent-*)` tokens, so it automatically tracks the parent
 * <Theme>'s accentColor (indigo by default, or a sub-theme accent if the
 * IconBox is rendered inside a wrapper).
 *
 * Variants:
 * - `gradient` (default): accent-9 to accent-11 gradient with a white icon.
 *   Forces the dark scale via a Radix sub-theme so contrast stays identical
 *   in light and dark modes (otherwise stops 9 and 11 sit too close together
 *   in light mode and the gradient becomes invisible).
 * - `soft`: accent-a3 background with the icon in accent-11.
 */
export function IconBox({
  icon: Icon,
  size = 'md',
  variant = 'gradient',
  className,
}: IconBoxProps) {
  const config = SIZE_CONFIG[size];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: config.box,
    height: config.box,
    borderRadius: config.radius,
    flexShrink: 0,
  };

  if (variant === 'soft') {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          ...baseStyle,
          backgroundColor: 'var(--accent-a3)',
          color: 'var(--accent-11)',
        }}
      >
        <Icon size={config.icon} strokeWidth={2} />
      </span>
    );
  }

  return (
    <Theme appearance="dark" hasBackground={false} asChild>
      <span
        aria-hidden="true"
        className={className}
        style={{
          ...baseStyle,
          background:
            'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-11) 100%)',
          color: 'white',
          boxShadow: '0 1px 2px var(--accent-a5)',
        }}
      >
        <Icon size={config.icon} strokeWidth={2.25} />
      </span>
    </Theme>
  );
}
