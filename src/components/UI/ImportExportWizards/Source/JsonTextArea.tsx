import React from 'react';
import { TextArea } from '@radix-ui/themes';
import type { JsonSourceInputState } from './useJsonSourceInput';

interface JsonTextAreaProps<T> {
  source: JsonSourceInputState<T>;
  placeholder: string;
}

export function JsonTextArea<T>({ source, placeholder }: JsonTextAreaProps<T>) {
  return (
    <TextArea
      value={source.jsonText}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => source.handleTextChange(e.target.value)}
      placeholder={placeholder}
      rows={8}
      style={{ fontFamily: 'monospace', fontSize: 12 }}
    />
  );
}
