import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { composeStories } from '@storybook/react';
import * as stories from '../../src/components/UI/ImportExportWizards/Source/FileDropZone.stories';
import { FileDropZone } from '../../src/components/UI/ImportExportWizards/Source/FileDropZone';
import type { JsonSourceInputState } from '../../src/components/UI/ImportExportWizards/Source/useJsonSourceInput';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => {
    const messages: Record<string, string> = {
      dragDropZone: 'Drag a JSON file here',
      browse: 'Browse...',
    };
    return messages[key] ?? key;
  }),
}));

const { FileDropZoneEmpty, FileDropZoneWithFile } = composeStories(stories);

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

describe('FileDropZone (portable stories)', () => {
  it("affiche la zone de glisser-déposer sans nom de fichier", () => {
    render(<FileDropZoneEmpty />);
    expect(screen.getByText('Drag a JSON file here')).toBeInTheDocument();
    expect(screen.getByText('Browse...')).toBeInTheDocument();
    expect(screen.queryByText('import.json')).not.toBeInTheDocument();
  });

  it("affiche le nom du fichier quand source.fileName est défini", () => {
    render(<FileDropZoneWithFile />);
    expect(screen.getByText('import.json')).toBeInTheDocument();
  });
});

describe('FileDropZone - branches', () => {
  it("appelle handleBrowse et stopPropagation quand le bouton Browse est cliqué", () => {
    const handleBrowse = vi.fn();
    render(
      <Theme>
        <FileDropZone source={makeMockSource({ handleBrowse })} />
      </Theme>,
    );
    const browseBtn = screen.getByText('Browse...');
    fireEvent.click(browseBtn);
    expect(handleBrowse).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas le nom du fichier quand source.fileName est null", () => {
    render(
      <Theme>
        <FileDropZone source={makeMockSource({ fileName: null })} />
      </Theme>,
    );
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
