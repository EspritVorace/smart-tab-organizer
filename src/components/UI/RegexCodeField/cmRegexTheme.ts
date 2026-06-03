import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
 * Single-line editor chrome for the regex field. Mirrors the visible look of a
 * Radix `TextField` (size 2) so the editor blends into the surrounding form:
 * same border, radius, surface and focus ring. Unlike the multi-line JSON
 * editor it has no gutters, no fold markers and no max height; long patterns
 * scroll horizontally. Every visible color is a Radix token, so the look stays
 * aligned with the active accent and appearance.
 */
export function createRegexEditorTheme(isDark: boolean): Extension {
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
        fontFamily:
          'var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)',
        lineHeight: '1.5',
        alignItems: 'center',
        overflowX: 'auto',
      },
      // Single editing line, vertically centered, matching a Radix size-2 input.
      '.cm-content': {
        padding: '0 var(--space-2)',
        minHeight: '28px',
        caretColor: 'var(--gray-12)',
      },
      '.cm-line': { padding: '0' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--gray-12)' },
      '.cm-placeholder': { color: 'var(--gray-a9)' },
      '.cm-selectionBackground, ::selection': { backgroundColor: 'var(--accent-a4)' },
      '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-a5)' },
    },
    { dark: isDark },
  );
}
