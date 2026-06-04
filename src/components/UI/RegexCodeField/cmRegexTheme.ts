import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { cmBaseThemeStyles } from '@/components/UI/shared/cmBaseTheme.js';

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
      ...cmBaseThemeStyles,
      '.cm-scroller': {
        ...cmBaseThemeStyles['.cm-scroller'],
        fontFamily:
          'var(--code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)',
      },
      // Single editing line, vertically centered, matching a Radix size-2 input.
      '.cm-content': {
        ...cmBaseThemeStyles['.cm-content'],
        minHeight: '28px',
      },
      // gray-a9 is intentional here: regex patterns are code, and a slightly
      // more muted placeholder (vs gray-a11 used by the domain field) suits
      // the monospace context. This intentionally overrides the base.
      '.cm-placeholder': { color: 'var(--gray-a9)' },
    },
    { dark: isDark },
  );
}
