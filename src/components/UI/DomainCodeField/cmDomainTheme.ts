import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

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
      '&': {
        color: 'var(--gray-12)',
        backgroundColor: 'var(--color-surface)',
        fontSize: 'var(--font-size-2)',
        border: '1px solid var(--gray-a7)',
        borderRadius: 'var(--radius-3)',
      },
      '&.cm-focused': {
        outline: '2px solid var(--accent-8)',
        outlineOffset: '-1px',
      },
      '.cm-scroller': {
        // A domain is not code: use the UI font (like the sibling Radix
        // TextField) so dots are not spaced out by monospace cells.
        fontFamily: 'var(--default-font-family, system-ui, sans-serif)',
        lineHeight: '1.5',
        // Hold the size-2 input height here (not on .cm-content) so the single
        // line is vertically centered by alignItems instead of pinned to top.
        minHeight: '28px',
        alignItems: 'center',
        overflowX: 'auto',
      },
      // Single editing line, vertically centered by the scroller above.
      '.cm-content': {
        padding: '0 var(--space-2)',
        caretColor: 'var(--gray-12)',
      },
      '.cm-line': { padding: '0' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--gray-12)' },
      // gray-a11 is the most muted gray that still meets WCAG AA (4.5:1) for
      // text; gray-a9/a10 (Radix's default placeholder tone) fail axe contrast.
      '.cm-placeholder': { color: 'var(--gray-a11)' },
      '.cm-selectionBackground, ::selection': { backgroundColor: 'var(--accent-a4)' },
      '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-a5)' },
      // Domain part colors.
      '.cm-domain-subdomain': { color: 'var(--gray-a11)' },
      '.cm-domain-domain': { color: 'var(--accent-11)', fontWeight: '500' },
      '.cm-domain-tld': { color: 'var(--jade-11)' },
      '.cm-domain-dot': { color: 'var(--gray-a8)' },
    },
    { dark: isDark },
  );
}
