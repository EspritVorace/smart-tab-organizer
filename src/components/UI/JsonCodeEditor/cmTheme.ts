import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Token colors mapped onto Radix scale variables so the editor follows the
 * active accent and flips automatically between the light and dark
 * appearances (Radix redefines these custom properties per appearance).
 */
export const jsonHighlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: 'var(--accent-11)' },
  { tag: t.string, color: 'var(--grass-11)' },
  { tag: t.number, color: 'var(--amber-11)' },
  { tag: [t.bool, t.null, t.keyword], color: 'var(--purple-11)' },
  { tag: [t.brace, t.squareBracket, t.separator, t.punctuation], color: 'var(--gray-11)' },
  { tag: t.invalid, color: 'var(--red-11)' },
]);

/**
 * Editor chrome (background, gutters, selection, tooltips, fold markers).
 * `isDark` only feeds CodeMirror's internal defaults; every visible color is
 * a Radix token, so the look stays aligned with the surrounding UI.
 */
export function createEditorTheme(isDark: boolean): Extension {
  return EditorView.theme(
    {
      '&': {
        color: 'var(--gray-12)',
        backgroundColor: 'var(--color-surface)',
        fontSize: 'var(--font-size-1)',
        border: '1px solid var(--gray-a6)',
        borderRadius: 'var(--radius-3)',
        maxHeight: '340px',
      },
      '&.cm-focused': {
        outline: '2px solid var(--accent-8)',
        outlineOffset: '-1px',
      },
      '.cm-scroller': {
        fontFamily: 'var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)',
        lineHeight: '1.6',
      },
      '.cm-content': { padding: '8px 0' },
      // Keep a stable editing height even when empty (the old textarea used
      // rows={8}); the content and gutter grow together up to the max height.
      '.cm-content, .cm-gutter': { minHeight: '180px' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--gray-12)' },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        color: 'var(--gray-a9)',
        border: 'none',
      },
      '.cm-activeLine': { backgroundColor: 'var(--gray-a2)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--gray-a3)' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--accent-a4)',
      },
      '&.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--accent-a5)' },
      '.cm-foldGutter .cm-foldMarker': {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--gray-a10)',
        padding: '0 2px',
        font: 'inherit',
        lineHeight: '1',
      },
      '.cm-foldGutter .cm-foldMarker:hover': { color: 'var(--gray-12)' },
      '.cm-foldGutter .cm-foldMarker:focus-visible': {
        outline: '2px solid var(--accent-8)',
        borderRadius: '2px',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'var(--gray-a3)',
        border: '1px solid var(--gray-a5)',
        borderRadius: '3px',
        color: 'var(--gray-11)',
        margin: '0 4px',
        padding: '0 6px',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--color-panel-solid)',
        border: '1px solid var(--gray-a6)',
        borderRadius: 'var(--radius-3)',
        color: 'var(--gray-12)',
        boxShadow: 'var(--shadow-4)',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        fontFamily: 'var(--code-font-family, monospace)',
        padding: '2px 6px',
      },
      '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-a4)',
        color: 'var(--gray-12)',
      },
      '.cm-completionDetail': { color: 'var(--gray-a11)' },
      '.cm-diagnostic': {
        fontFamily: 'var(--default-font-family)',
        fontSize: 'var(--font-size-1)',
      },
      '.cm-diagnostic-error': { borderLeftColor: 'var(--red-9)' },
    },
    { dark: isDark },
  );
}
