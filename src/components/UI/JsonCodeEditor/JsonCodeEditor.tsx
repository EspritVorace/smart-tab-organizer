import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Compartment, EditorState, type StateEffect } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  hoverTooltip,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { json, jsonLanguage, jsonParseLinter } from '@codemirror/lang-json';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
  indentUnit,
  foldGutter,
  codeFolding,
  foldKeymap,
  foldEffect,
  foldInside,
  ensureSyntaxTree,
  syntaxTree,
} from '@codemirror/language';
import { linter, lintGutter, lintKeymap } from '@codemirror/lint';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import {
  jsonCompletion,
  jsonSchemaLinter,
  jsonSchemaHover,
  handleRefresh,
  stateExtensions,
  updateSchema,
} from 'codemirror-json-schema';
import { getMessage } from '@/utils/i18n';
import type { ImportJsonSchema } from '@/utils/importJsonSchemas';
import { jsonHighlightStyle, createEditorTheme } from './cmTheme';

/** Container/array nodes nested at or beyond this depth are folded on open. */
const AUTO_FOLD_DEPTH = 2;

type SchemaArg = Parameters<typeof stateExtensions>[0];
type JsonSyntaxNode = Parameters<typeof foldInside>[0];

export interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** JSON Schema (draft-7) driving autocompletion and schema linting. */
  jsonSchema?: ImportJsonSchema;
  placeholder?: string;
  /** Mirrors the wizard validation state onto the editor `contentDOM`. */
  hasError?: boolean;
  /** Accessible name for the editing area. */
  ariaLabel?: string;
  /** Focus the editing area once it mounts (e.g. when entering text mode). */
  focusOnMount?: boolean;
}

/** Accessible fold marker: a focusable button announced by screen readers. */
function createFoldMarker(open: boolean): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cm-foldMarker';
  const label = getMessage(open ? 'jsonEditorFoldRange' : 'jsonEditorUnfoldRange');
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = open ? '▾' : '▸';
  return button;
}

/**
 * Walks the JSON syntax tree and folds every object/array nested at or beyond
 * `AUTO_FOLD_DEPTH`, keeping the outermost foldable section of long payloads
 * visible while collapsing the deeper structure on open.
 */
function computeAutoFoldEffects(state: EditorState): StateEffect<unknown>[] {
  const tree = ensureSyntaxTree(state, state.doc.length, 5000) ?? syntaxTree(state);
  const effects: StateEffect<unknown>[] = [];

  const walk = (node: JsonSyntaxNode, depth: number) => {
    const isContainer = node.name === 'Object' || node.name === 'Array';
    if (isContainer && depth >= AUTO_FOLD_DEPTH) {
      const range = foldInside(node);
      if (range && range.to > range.from) {
        effects.push(foldEffect.of(range));
      }
      return; // Folding the parent hides its descendants.
    }
    const childDepth = isContainer ? depth + 1 : depth;
    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child, childDepth);
    }
  };

  walk(tree.topNode, 0);
  return effects;
}

function applyAutoFold(view: EditorView): void {
  const effects = computeAutoFoldEffects(view.state);
  if (effects.length) view.dispatch({ effects });
}

export function JsonCodeEditor({
  value,
  onChange,
  jsonSchema,
  placeholder,
  hasError = false,
  ariaLabel,
  focusOnMount = false,
}: JsonCodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Props the mount-once setup reads without re-running.
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const schemaRef = useRef(jsonSchema);
  const placeholderRef = useRef(placeholder);
  const hasErrorRef = useRef(hasError);
  const isDarkRef = useRef(isDark);

  const themeCompartment = useRef(new Compartment());
  const ariaCompartment = useRef(new Compartment());

  onChangeRef.current = onChange;

  // Create the editor once. Reactive updates flow through the effects below.
  useEffect(() => {
    if (!containerRef.current) return;

    // Keep an empty editor neutral (no lint markers) like the former textarea.
    const parseLinterSource = jsonParseLinter();
    const schemaLinterSource = jsonSchemaLinter();
    const isBlankDoc = (view: EditorView) => view.state.doc.toString().trim().length === 0;

    const state = EditorState.create({
      doc: valueRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter({ markerDOM: createFoldMarker }),
        codeFolding({ placeholderText: '…' }),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        indentUnit.of('  '),
        EditorState.tabSize.of(2),
        EditorView.lineWrapping,
        syntaxHighlighting(jsonHighlightStyle),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        linter((view) => (isBlankDoc(view) ? [] : parseLinterSource(view))),
        linter((view) => (isBlankDoc(view) ? [] : schemaLinterSource(view)), { needsRefresh: handleRefresh }),
        lintGutter(),
        jsonLanguage.data.of({ autocomplete: jsonCompletion() }),
        autocompletion({ activateOnTyping: true, icons: false }),
        hoverTooltip(jsonSchemaHover()),
        stateExtensions(schemaRef.current as SchemaArg),
        placeholderExtension(placeholderRef.current ?? ''),
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel ?? getMessage('jsonEditorAriaLabel'),
          spellcheck: 'false',
          autocapitalize: 'off',
          autocorrect: 'off',
        }),
        ariaCompartment.current.of(
          EditorView.contentAttributes.of({
            'aria-invalid': hasErrorRef.current ? 'true' : 'false',
          }),
        ),
        themeCompartment.current.of(createEditorTheme(isDarkRef.current)),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    applyAutoFold(view);
    if (focusOnMount) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Mount-once: subsequent prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync externally driven value changes (file drop, pack confirm, reset).
  useEffect(() => {
    valueRef.current = value;
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
      applyAutoFold(view);
    }
  }, [value]);

  useEffect(() => {
    schemaRef.current = jsonSchema;
    const view = viewRef.current;
    if (view) updateSchema(view, jsonSchema as SchemaArg);
  }, [jsonSchema]);

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
        effects: themeCompartment.current.reconfigure(createEditorTheme(isDark)),
      });
    }
  }, [isDark]);

  return <div ref={containerRef} data-testid="json-code-editor" />;
}

export default JsonCodeEditor;
