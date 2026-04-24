import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme } from '@radix-ui/themes';
import { FileDropZone } from './FileDropZone';
import type { JsonSourceInputState } from './useJsonSourceInput';

function makeMockSource(
  overrides: Partial<JsonSourceInputState<unknown>> = {},
): JsonSourceInputState<unknown> {
  return {
    sourceMode: 'file',
    setSourceMode: () => {},
    jsonText: '',
    parsedData: null,
    parseError: null,
    importedNote: null,
    fileName: null,
    isDragOver: false,
    fileInputRef: { current: null } as React.RefObject<HTMLInputElement>,
    handleTextChange: () => {},
    handleDrop: () => {},
    handleDragOver: () => {},
    handleDragLeave: () => {},
    handleBrowse: () => {},
    handleFileSelect: () => {},
    reset: () => {},
    ...overrides,
  };
}

const meta: Meta<typeof FileDropZone> = {
  title: 'Components/UI/ImportExportWizards/Source/FileDropZone',
  component: FileDropZone,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Theme>
        <div style={{ width: 400 }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FileDropZoneEmpty: Story = {
  args: {
    source: makeMockSource(),
  },
};

export const FileDropZoneWithFile: Story = {
  args: {
    source: makeMockSource({ fileName: 'import.json' }),
  },
};

export const FileDropZoneDragOver: Story = {
  args: {
    source: makeMockSource({ isDragOver: true }),
  },
};
