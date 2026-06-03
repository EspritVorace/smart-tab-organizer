import { EditorView } from '@codemirror/view';

/**
 * Test seam for driving the lazily mounted {@link RegexCodeField}. The editor
 * exposes no `<input>`, so tests and Storybook play functions set its document
 * straight on the CodeMirror view. Works in a real browser and in happy-dom
 * alike (a dispatched transaction does not require layout).
 */
export async function waitForRegexField(
  root: ParentNode,
  testId = 'regex-code-field',
  timeoutMs = 3000,
): Promise<EditorView> {
  const start = Date.now();
  for (;;) {
    const cmEl = root.querySelector<HTMLElement>(`[data-testid="${testId}"] .cm-editor`);
    const view = cmEl ? EditorView.findFromDOM(cmEl) : null;
    if (view) return view;
    if (Date.now() - start >= timeoutMs) {
      throw new Error(`Regex field "${testId}" did not mount in time`);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

export async function setRegexFieldValue(
  root: ParentNode,
  testId: string,
  pattern: string,
): Promise<void> {
  const view = await waitForRegexField(root, testId);
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: pattern } });
}
