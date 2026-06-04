import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

/**
 * Parameters for {@link useCodeMirrorSingleLine}.
 */
export interface UseCodeMirrorSingleLineParams {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  ariaLabel: string;
  hasError?: boolean;
  describedById?: string;
  /**
   * When true, marks the content node with `[data-autofocus]` (so `DialogShell`
   * focuses it on open) and focuses the editor on mount.
   */
  focusOnMount?: boolean;
  /**
   * Language / syntax-highlighting extensions that are specific to the field
   * variant (e.g. `domainHighlighter` or `[regexLanguage, syntaxHighlighting(...)]`).
   * These are installed once at mount time and never reconfigured.
   */
  languageExtensions: Extension[];
  /**
   * Factory that produces the editor theme `Extension` for the current
   * appearance. Called once at mount (with the initial `isDark` value) and again
   * whenever the resolved theme changes.
   */
  createTheme: (isDark: boolean) => Extension;
}

/**
 * Return value of {@link useCodeMirrorSingleLine}.
 *
 * Attach `containerRef` to the wrapper `<div>` that CodeMirror should mount
 * into.
 */
export interface UseCodeMirrorSingleLineResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Encapsulates the lifecycle of a single-line CodeMirror editor that mirrors
 * the visual contract of a Radix `TextField`.
 *
 * Shared by `DomainCodeField` and `RegexCodeField`. The two fields differ only
 * in their language/highlighting extensions and their theme factory; everything
 * else (mount logic, reactive effects for value / error / theme, scrollDOM
 * tabindex) is identical and lives here.
 *
 * The editor is mounted once. Subsequent prop changes are propagated through
 * CodeMirror `Compartment`s or direct `dispatch` calls rather than by
 * recreating the view.
 */
export function useCodeMirrorSingleLine({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  hasError = false,
  describedById,
  focusOnMount = false,
  languageExtensions,
  createTheme,
}: UseCodeMirrorSingleLineParams): UseCodeMirrorSingleLineResult {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Per-instance Compartments (must be inside the hook, not module-level).
  const themeCompartment = useRef(new Compartment());
  const ariaCompartment = useRef(new Compartment());

  // Props the mount-once setup reads without re-running.
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const idRef = useRef(id);
  const placeholderRef = useRef(placeholder);
  const ariaLabelRef = useRef(ariaLabel);
  const describedByRef = useRef(describedById);
  const hasErrorRef = useRef(hasError);
  const isDarkRef = useRef(isDark);
  const focusOnMountRef = useRef(focusOnMount);

  // Stable refs for things injected by the caller that must never trigger a
  // remount (language extensions are fixed at build time; createTheme is a
  // module-level function).
  const languageExtensionsRef = useRef(languageExtensions);
  const createThemeRef = useRef(createTheme);

  // Keep the onChange ref current so the listener always calls the latest handler.
  onChangeRef.current = onChange;

  // Create the editor once. Reactive updates flow through the effects below.
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        ...languageExtensionsRef.current,
        history(),
        drawSelection(),
        // Keep the value single-line: drop any transaction adding a line break.
        EditorState.transactionFilter.of((tr) => (tr.newDoc.lines > 1 ? [] : tr)),
        placeholderExtension(placeholderRef.current ?? ''),
        EditorView.contentAttributes.of({
          id: idRef.current ?? '',
          'aria-label': ariaLabelRef.current,
          'aria-describedby': describedByRef.current ?? '',
          spellcheck: 'false',
          autocapitalize: 'off',
          autocorrect: 'off',
          'data-1p-ignore': 'true',
          ...(focusOnMountRef.current ? { 'data-autofocus': 'true' } : {}),
        }),
        ariaCompartment.current.of(
          EditorView.contentAttributes.of({
            'aria-invalid': hasErrorRef.current ? 'true' : 'false',
          }),
        ),
        themeCompartment.current.of(createThemeRef.current(isDarkRef.current)),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    // Make the (horizontally) scrollable viewport reachable by keyboard so a
    // long value can be scrolled without a pointer (axe scrollable-region).
    view.scrollDOM.setAttribute('tabindex', '0');
    if (focusOnMountRef.current) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount-once: subsequent prop changes are handled by the effects below.
     
  }, []);

  // Sync externally driven value changes (form reset, edit of another rule).
  useEffect(() => {
    valueRef.current = value;
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    hasErrorRef.current = hasError;
    const view = viewRef.current;
    if (view) {
      view.dispatch({
        effects: ariaCompartment.current.reconfigure(
          EditorView.contentAttributes.of({ 'aria-invalid': hasError ? 'true' : 'false' }),
        ),
      });
    }
  }, [hasError]);

  useEffect(() => {
    isDarkRef.current = isDark;
    const view = viewRef.current;
    if (view) {
      view.dispatch({
        effects: themeCompartment.current.reconfigure(createThemeRef.current(isDark)),
      });
    }
  }, [isDark]);

  return { containerRef };
}
