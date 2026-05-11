import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { JsonSourceInputState, SourceMode } from '../../src/components/UI/ImportExportWizards/Source';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import { SourceStep } from '../../src/components/UI/ImportExportWizards/Source/SourceStep';

function makeSource(
  overrides: Partial<JsonSourceInputState<unknown[]>> = {},
): JsonSourceInputState<unknown[]> {
  return {
    sourceMode: 'file',
    setSourceMode: vi.fn<(mode: SourceMode) => void>(),
    jsonText: '',
    parsedData: null,
    parseError: null,
    importedNote: null,
    fileName: null,
    isDragOver: false,
    fileInputRef: { current: null },
    handleTextChange: vi.fn(),
    handleDrop: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleBrowse: vi.fn(),
    handleFileSelect: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const PACK_TESTID = 'pack-gallery-mock';
const PACK_NODE = <div data-testid={PACK_TESTID}>pack gallery</div>;

describe('SourceStep', () => {
  it('rend le packGalleryNode quand le mode est pack', () => {
    const source = makeSource({ sourceMode: 'pack' });
    wrap(
      <SourceStep
        source={source}
        textareaPlaceholder="placeholder"
        successCountMessageKey="rulesFoundCount"
        availableModes={['file', 'text', 'pack']}
        packGalleryNode={PACK_NODE}
      />,
    );
    expect(screen.getByTestId(PACK_TESTID)).toBeInTheDocument();
  });

  it('ignore packGalleryNode quand le mode est file', () => {
    const source = makeSource({ sourceMode: 'file' });
    wrap(
      <SourceStep
        source={source}
        textareaPlaceholder="placeholder"
        successCountMessageKey="rulesFoundCount"
        availableModes={['file', 'text', 'pack']}
        packGalleryNode={PACK_NODE}
      />,
    );
    expect(screen.queryByTestId(PACK_TESTID)).not.toBeInTheDocument();
  });

  it('ignore packGalleryNode quand le mode est text', () => {
    const source = makeSource({ sourceMode: 'text' });
    wrap(
      <SourceStep
        source={source}
        textareaPlaceholder="placeholder"
        successCountMessageKey="rulesFoundCount"
        availableModes={['file', 'text', 'pack']}
        packGalleryNode={PACK_NODE}
      />,
    );
    expect(screen.queryByTestId(PACK_TESTID)).not.toBeInTheDocument();
  });
});
