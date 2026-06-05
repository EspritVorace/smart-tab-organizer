/**
 * Base EditorView.theme styles shared by the single-line CodeMirror editors
 * (domain field and regex field). These establish the Radix `TextField`
 * (size 2) visual contract: total height, border, radius, surface color,
 * font size, focus ring, placeholder color and selection colors.
 *
 * The height + vertical centering of the single line live here so both
 * fields line up pixel for pixel with a sibling Radix `TextField`:
 * - `&` is pinned to `--space-6` (32px), the size-2 input height, and is a
 *   flex column (CodeMirror default) centered with `justify-content`.
 * - `.cm-content` drops CodeMirror's default `min-height: 100%` so the
 *   single line collapses to its own height (instead of filling the
 *   scroller), which lets `justify-content` center it inside the 32px box.
 *
 * `justify-content` (not `align-items`) is the lever here: CodeMirror pins
 * the scroller with `align-items: flex-start !important`, but leaves the
 * editor column's `justify-content` free for us to set.
 *
 * Each consumer only adds its own `.cm-scroller` font family and any
 * field-specific token colors.
 */
export const cmBaseThemeStyles = {
  '&': {
    color: 'var(--gray-12)',
    backgroundColor: 'var(--color-surface)',
    fontSize: 'var(--font-size-2)',
    border: '1px solid var(--gray-a7)',
    borderRadius: 'var(--radius-3)',
    // Match the Radix size-2 TextField height (box-sizing is border-box) and
    // vertically center the single line within it.
    minHeight: 'var(--space-6)',
    justifyContent: 'center',
  },
  '&.cm-focused': {
    outline: '2px solid var(--accent-8)',
    outlineOffset: '-1px',
  },
  '.cm-scroller': {
    lineHeight: '1.5',
    overflowX: 'auto',
  },
  '.cm-content': {
    padding: '0 var(--space-2)',
    caretColor: 'var(--gray-12)',
    // Collapse to the line height so the editor column can center it.
    minHeight: '0',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--gray-12)' },
  // Matches the Radix `TextField` (surface variant) placeholder color.
  '.cm-placeholder': { color: 'var(--gray-a10)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'var(--accent-a4)' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-a5)' },
} as const;
