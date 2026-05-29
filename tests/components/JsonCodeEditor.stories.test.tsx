import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/JsonCodeEditor/JsonCodeEditor.stories';

const {
  JsonCodeEditorEmpty,
  JsonCodeEditorValidJson,
  JsonCodeEditorInvalidJson,
  JsonCodeEditorLongFolded,
} = composeStories(stories);

describe('JsonCodeEditor (portable stories)', () => {
  it('mounts with an accessible, spell-check-free editing area', async () => {
    await JsonCodeEditorEmpty.run();
    const content = screen.getByTestId('json-code-editor').querySelector('.cm-content');
    expect(content?.getAttribute('aria-label')).toBe('JSON editor');
    expect(content?.getAttribute('spellcheck')).toBe('false');
  });

  it('renders valid JSON', async () => {
    await JsonCodeEditorValidJson.run();
    expect(screen.getByTestId('json-code-editor').querySelector('.cm-content')?.textContent)
      .toContain('domainRules');
  });

  it('flags the editing area as invalid', async () => {
    await JsonCodeEditorInvalidJson.run();
    const content = screen.getByTestId('json-code-editor').querySelector('.cm-content');
    expect(content?.getAttribute('aria-invalid')).toBe('true');
  });

  it('auto-folds deeply nested sections of long payloads', async () => {
    await JsonCodeEditorLongFolded.run();
    expect(screen.getByTestId('json-code-editor').querySelector('.cm-foldPlaceholder'))
      .not.toBeNull();
  });
});
