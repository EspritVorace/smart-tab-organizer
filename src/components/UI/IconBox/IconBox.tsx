import type { LucideIcon } from 'lucide-react';

export type IconBoxSize = 'sm' | 'md' | 'lg';
export type IconBoxVariant = 'gradient' | 'soft';

export interface IconBoxProps {
  /** Icône Lucide à afficher au centre */
  icon: LucideIcon;
  /** Taille du conteneur. Défaut : 'md' */
  size?: IconBoxSize;
  /** Style visuel. Défaut : 'gradient' (style Windows 11) */
  variant?: IconBoxVariant;
  /** Classe CSS additionnelle (optionnel) */
  className?: string;
}

const SIZE_CONFIG: Record<IconBoxSize, { box: number; icon: number; radius: string }> = {
  sm: { box: 24, icon: 14, radius: 'var(--radius-2)' },
  md: { box: 32, icon: 18, radius: 'var(--radius-3)' },
  lg: { box: 44, icon: 24, radius: 'var(--radius-4)' },
};

/**
 * IconBox : conteneur arrondi affichant une icône Lucide avec un fond
 * dérivé de la couleur d'accent du thème Radix actif.
 *
 * Utilise les tokens `var(--accent-*)` pour suivre automatiquement
 * l'accentColor du <Theme> Radix parent (indigo par défaut, ou l'accent
 * d'un sous-thème si l'IconBox est rendu dans un wrapper).
 *
 * Variantes :
 * - `gradient` (défaut) : dégradé accent-9 → accent-11 avec icône blanche
 * - `soft` : fond accent-a3 avec icône en accent-11
 */
export function IconBox({
  icon: Icon,
  size = 'md',
  variant = 'gradient',
  className,
}: IconBoxProps) {
  const config = SIZE_CONFIG[size];

  const variantStyle: React.CSSProperties =
    variant === 'gradient'
      ? {
          background:
            'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-11) 100%)',
          color: 'white',
          boxShadow: '0 1px 2px var(--accent-a5)',
        }
      : {
          backgroundColor: 'var(--accent-a3)',
          color: 'var(--accent-11)',
        };

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: config.box,
        height: config.box,
        borderRadius: config.radius,
        flexShrink: 0,
        ...variantStyle,
      }}
    >
      <Icon size={config.icon} strokeWidth={variant === 'gradient' ? 2.25 : 2} />
    </span>
  );
}
