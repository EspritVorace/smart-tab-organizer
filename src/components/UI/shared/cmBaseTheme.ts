/**
 * Base EditorView.theme styles shared by the single-line CodeMirror editors
 * (domain field and regex field). These establish the Radix `TextField`
 * (size 2) visual contract: border, radius, surface color, font size, focus
 * ring, and selection colors.
 *
 * Each consumer then adds its own `.cm-scroller` font family, its own
 * `minHeight` placement, and any field-specific token colors.
 */
export const cmBaseThemeStyles = {
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
    lineHeight: '1.5',
    alignItems: 'center',
    overflowX: 'auto',
  },
  '.cm-content': {
    padding: '0 var(--space-2)',
    caretColor: 'var(--gray-12)',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--gray-12)' },
  '.cm-placeholder': { color: 'var(--gray-a11)' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'var(--accent-a4)' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-a5)' },
} as const;
