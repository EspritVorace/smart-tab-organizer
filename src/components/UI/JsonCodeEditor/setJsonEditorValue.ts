import { EditorView } from '@codemirror/view';

/**
 * Test seam for driving the lazily mounted {@link JsonCodeEditor}. The editor
 * exposes no `<textarea>`, so tests and Storybook play functions set its
 * document straight on the CodeMirror view. Works in a real browser and in
 * happy-dom alike (a dispatched transaction does not require layout).
 */
export async function waitForJsonEditor(root: ParentNode, timeoutMs = 3000): Promise<EditorView> {
  const start = Date.now();
  for (;;) {
    const cmEl = root.querySelector<HTMLElement>('[data-testid="json-code-editor"] .cm-editor');
    const view = cmEl ? EditorView.findFromDOM(cmEl) : null;
    if (view) return view;
    if (Date.now() - start >= timeoutMs) {
      throw new Error('JSON editor did not mount in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

export async function setJsonEditorValue(root: ParentNode, json: string): Promise<void> {
  const view = await waitForJsonEditor(root);
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: json } });
}
