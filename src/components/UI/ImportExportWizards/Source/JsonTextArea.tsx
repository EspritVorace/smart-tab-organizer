import React, { Suspense } from 'react';
import { Flex, Spinner, Text } from '@radix-ui/themes';
import { lazyWithTiming } from '@/utils/lazyWithTiming';
import { getMessage } from '@/utils/i18n';
import type { ImportJsonSchema } from '@/utils/importJsonSchemas';
import type { JsonSourceInputState } from './useJsonSourceInput';

// Loaded only when an import wizard reaches the "text" source mode, keeping
// CodeMirror and its JSON-schema tooling out of the popup/options entry chunk.
const LazyJsonCodeEditor = lazyWithTiming(
  'JsonCodeEditor',
  () => import('@/components/UI/JsonCodeEditor/JsonCodeEditor'),
);

interface JsonTextAreaProps<T> {
  source: JsonSourceInputState<T>;
  placeholder: string;
  jsonSchema?: ImportJsonSchema;
}

function EditorFallback() {
  return (
    <Flex
      align="center"
      justify="center"
      gap="2"
      style={{
        minHeight: 200,
        border: '1px solid var(--gray-a6)',
        borderRadius: 'var(--radius-3)',
      }}
    >
      <Spinner />
      <Text size="1" color="gray">{getMessage('jsonEditorLoading')}</Text>
    </Flex>
  );
}

export function JsonTextArea<T>({ source, placeholder, jsonSchema }: JsonTextAreaProps<T>) {
  return (
    <Suspense fallback={<EditorFallback />}>
      <LazyJsonCodeEditor
        value={source.jsonText}
        onChange={source.handleTextChange}
        jsonSchema={jsonSchema}
        placeholder={placeholder}
        hasError={!!source.parseError}
        ariaLabel={getMessage('jsonEditorAriaLabel')}
        focusOnMount
      />
    </Suspense>
  );
}
