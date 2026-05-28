import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, waitFor } from 'storybook/test';
import { JsonCodeEditor } from './JsonCodeEditor';
import { rulesImportJsonSchema } from '@/utils/importJsonSchemas';

const validRulesJson = JSON.stringify(
  {
    domainRules: [
      {
        id: 'rule-github',
        domainFilter: 'github.com',
        label: 'GitHub',
        titleParsingRegEx: '^(.*?) ·',
        urlParsingRegEx: 'github\\.com/([^/]+)',
        groupNameSource: 'title',
        deduplicationMatchMode: 'exact',
        presetId: null,
        enabled: true,
      },
    ],
  },
  null,
  2,
);

const longRulesJson = JSON.stringify(
  {
    note: 'Team rule pack',
    domainRules: Array.from({ length: 5 }, (_, i) => ({
      id: `rule-${i}`,
      domainFilter: `example${i}.com`,
      label: `Example ${i}`,
      titleParsingRegEx: '^(.*?) -',
      urlParsingRegEx: `example${i}\\.com/([^/]+)`,
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      ignoredQueryParams: ['utm_source', 'utm_medium'],
      presetId: null,
      enabled: true,
    })),
  },
  null,
  2,
);

const invalidJson = '{\n  "domainRules": [\n    { "id": "x" "label": "missing comma" }\n  ]\n}';

interface HarnessProps {
  initialValue: string;
  hasError?: boolean;
}

function EditorHarness({ initialValue, hasError }: HarnessProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <JsonCodeEditor
      value={value}
      onChange={setValue}
      jsonSchema={rulesImportJsonSchema}
      placeholder='{"domainRules": [...]}'
      hasError={hasError}
    />
  );
}

const meta: Meta<typeof EditorHarness> = {
  title: 'Components/UI/JsonCodeEditor',
  component: EditorHarness,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const JsonCodeEditorEmpty: Story = {
  args: { initialValue: '' },
  play: async ({ canvasElement }) => {
    const editor = within(canvasElement).getByTestId('json-code-editor');
    await waitFor(() => expect(editor.querySelector('.cm-content')).not.toBeNull());
    const content = editor.querySelector<HTMLElement>('.cm-content');
    expect(content?.getAttribute('aria-label')).toBe('JSON editor');
    expect(content?.getAttribute('spellcheck')).toBe('false');
  },
};

export const JsonCodeEditorValidJson: Story = {
  args: { initialValue: validRulesJson },
};

export const JsonCodeEditorInvalidJson: Story = {
  args: { initialValue: invalidJson, hasError: true },
  play: async ({ canvasElement }) => {
    const editor = within(canvasElement).getByTestId('json-code-editor');
    await waitFor(() => {
      expect(editor.querySelector('.cm-content')?.getAttribute('aria-invalid')).toBe('true');
    });
  },
};

export const JsonCodeEditorLongFolded: Story = {
  args: { initialValue: longRulesJson },
  play: async ({ canvasElement }) => {
    const editor = within(canvasElement).getByTestId('json-code-editor');
    // Deeply nested rule objects are folded on open, surfacing fold placeholders.
    await waitFor(() => {
      expect(editor.querySelector('.cm-foldPlaceholder')).not.toBeNull();
    });
  },
};
