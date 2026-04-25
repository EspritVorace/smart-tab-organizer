import React from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';
import { FileUp } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import type { JsonSourceInputState } from './useJsonSourceInput';

interface FileDropZoneProps<T> {
  source: JsonSourceInputState<T>;
}

export function FileDropZone<T>({ source }: FileDropZoneProps<T>) {
  return (
    <>
      <input
        ref={source.fileInputRef}
        type="file"
        accept=".json"
        onChange={source.handleFileSelect}
        style={{ display: 'none' }}
      />
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="2"
        p="5"
        onDrop={source.handleDrop}
        onDragOver={source.handleDragOver}
        onDragLeave={source.handleDragLeave}
        onClick={source.handleBrowse}
        style={{
          border: `2px dashed ${source.isDragOver ? 'var(--accent-9)' : 'var(--gray-a6)'}`,
          borderRadius: 'var(--radius-3)',
          backgroundColor: source.isDragOver ? 'var(--accent-a2)' : 'var(--gray-a2)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          minHeight: 120,
        }}
      >
        <FileUp size={32} style={{ color: 'var(--gray-9)' }} aria-hidden="true" />
        <Text size="2" color="gray" highContrast>{getMessage('dragDropZone')}</Text>
        <Button
          variant="soft"
          size="1"
          highContrast
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            source.handleBrowse();
          }}
        >
          {getMessage('browse')}
        </Button>
        {source.fileName && (
          <Text size="1" color="gray" mt="1">{source.fileName}</Text>
        )}
      </Flex>
    </>
  );
}
