import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { cmBaseThemeStyles } from '@/components/UI/shared/cmBaseTheme.js';

/**
 * Single-line editor chrome for the domain field. Mirrors the visible look of a
 * Radix `TextField` (size 2), exactly like `cmRegexTheme.ts`, and adds the four
 * domain-part colors. Every color is a Radix token so the field follows the
 * active accent and flips automatically between light and dark appearances.
 *
 * Part colors:
 * - subdomain: muted (it is optional / less significant)
 * - domain: accent + medium weight (the meaningful part)
 * - tld (extension): a distinct stable hue
 * - dot: discreet separators
 */
export function createDomainEditorTheme(isDark: boolean): Extension {
  return EditorView.theme(
    {
      ...cmBaseThemeStyles,
      '.cm-scroller': {
        ...cmBaseThemeStyles['.cm-scroller'],
        // A domain is not code: use the UI font (like the sibling Radix
        // TextField) so dots are not spaced out by monospace cells.
        fontFamily: 'var(--default-font-family, system-ui, sans-serif)',
        // Hold the size-2 input height here (not on .cm-content) so the single
        // line is vertically centered by alignItems instead of pinned to top.
        minHeight: '28px',
      },
      // Single editing line, vertically centered by the scroller above.
      '.cm-content': {
        ...cmBaseThemeStyles['.cm-content'],
      },
      // Domain part colors.
      '.cm-domain-subdomain': { color: 'var(--gray-a11)' },
      '.cm-domain-domain': { color: 'var(--accent-11)', fontWeight: '500' },
      '.cm-domain-tld': { color: 'var(--jade-11)' },
      '.cm-domain-dot': { color: 'var(--gray-a8)' },
    },
    { dark: isDark },
  );
}
