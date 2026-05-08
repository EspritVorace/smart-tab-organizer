import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { JsonSourceInputState, SourceMode } from '../../src/components/UI/ImportExportWizards/Source';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => `i18n(${key})`),
}));

import { SourceModeSegmented } from '../../src/components/UI/ImportExportWizards/Source/SourceModeSegmented';

function makeSource(
  overrides: Partial<JsonSourceInputState<unknown[]>> = {},
): JsonSourceInputState<unknown[]> {
  return {
    sourceMode: 'file',
    setSourceMode: vi.fn(),
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

describe('SourceModeSegmented', () => {
  it('affiche les 3 onglets quand availableModes inclut pack', () => {
    const source = makeSource();
    wrap(
      <SourceModeSegmented
        source={source}
        availableModes={['file', 'text', 'pack']}
      />,
    );
    expect(screen.getAllByText('i18n(sourceFile)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('i18n(sourceText)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('i18n(sourcePack)').length).toBeGreaterThanOrEqual(1);
  });

  it("affiche 2 onglets quand availableModes est omis (compatibilité ascendante)", () => {
    const source = makeSource();
    wrap(<SourceModeSegmented source={source} />);
    expect(screen.getAllByText('i18n(sourceFile)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('i18n(sourceText)').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('i18n(sourcePack)')).not.toBeInTheDocument();
  });

  it("appelle setSourceMode('pack') au clic sur l'onglet Pack", () => {
    const setSourceMode = vi.fn<(mode: SourceMode) => void>();
    const source = makeSource({ setSourceMode });
    wrap(
      <SourceModeSegmented
        source={source}
        availableModes={['file', 'text', 'pack']}
      />,
    );
    const packLabels = screen.getAllByText('i18n(sourcePack)');
    fireEvent.click(packLabels[0]);
    expect(setSourceMode).toHaveBeenCalledWith('pack');
  });
});
