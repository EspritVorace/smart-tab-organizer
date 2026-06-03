import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { domainHighlighter } from './domainHighlight';
import { createDomainEditorTheme } from './cmDomainTheme';

export interface DomainCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Mirrors the wrapping `<label>` `htmlFor`; set on the editor content node. */
  id?: string;
  placeholder?: string;
  /** Accessible name for the editing area (distinct from the visible label). */
  ariaLabel: string;
  /** Toggles `aria-invalid` on the content node when the field is in error. */
  hasError?: boolean;
  /** Error element id wired onto `aria-describedby` when an error is present. */
  describedById?: string;
  /** Forwarded onto the wrapper for parity with the former input `name`. */
  name?: string;
  /** Stable hook for tests / Page Objects. */
  testId?: string;
  /**
   * When true, marks the content node with `[data-autofocus]` (so `DialogShell`
   * focuses it on open) and focuses the editor on mount.
   */
  focusOnMount?: boolean;
}

/**
 * Single-line CodeMirror editor that highlights a plain domain live while
 * preserving the accessibility and theming contract of a Radix `TextField`.
 *
 * Twin of `RegexCodeField`: mounts the editor once and funnels reactive prop
 * changes through dedicated effects and `Compartment`s. Newlines are rejected so
 * the value stays a single-line domain. Coloring (subdomain / domain / tld /
 * dots) is handled by {@link domainHighlighter}; values that are not plain
 * domains stay rendered as neutral text.
 */
export function DomainCodeField({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  hasError = false,
  describedById,
  name,
  testId = 'domain-code-field',
  focusOnMount = false,
}: DomainCodeFieldProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

  const themeCompartment = useRef(new Compartment());
  const ariaCompartment = useRef(new Compartment());

  onChangeRef.current = onChange;

  // Create the editor once. Reactive updates flow through the effects below.
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        domainHighlighter,
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
        themeCompartment.current.of(createDomainEditorTheme(isDarkRef.current)),
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
    // long domain can be scrolled without a pointer (axe scrollable-region).
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
        effects: themeCompartment.current.reconfigure(createDomainEditorTheme(isDark)),
      });
    }
  }, [isDark]);

  return <div ref={containerRef} data-testid={testId} data-name={name} />;
}

export default DomainCodeField;
