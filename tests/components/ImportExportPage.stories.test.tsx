import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { ImportExportPage } from '../../src/pages/ImportExportPage';
import { MockImportExportWizardsProvider } from '../../src/test-utils/MockImportExportWizardsProvider';
import { defaultAppSettings, type AppSettings } from '../../src/types/syncSettings';

const settingsWithRules: AppSettings = {
  ...defaultAppSettings,
  domainRules: [
    {
      id: 'rule-1',
      domainFilter: 'github.com',
      label: 'GitHub',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart_label',
      deduplicationMatchMode: 'exact',
      color: 'purple',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
  ],
};

const handlers = {
  openImportRules: vi.fn(),
  openExportRules: vi.fn(),
  openImportSessions: vi.fn(),
  openExportSessions: vi.fn(),
  openImportWorkspace: vi.fn(),
  openExportWorkspace: vi.fn(),
};

beforeEach(() => {
  Object.values(handlers).forEach((fn) => fn.mockReset());
});

function renderPage(settings: AppSettings) {
  return render(
    <Theme>
      <MockImportExportWizardsProvider value={handlers}>
        <ImportExportPage syncSettings={settings} />
      </MockImportExportWizardsProvider>
    </Theme>,
  );
}

describe('ImportExportPage cards', () => {
  it('renders six action cards and disables export buttons when nothing is exportable', async () => {
    renderPage(defaultAppSettings);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    expect(screen.getByTestId('page-import-export-card-export-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-rules')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-export-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-export-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('page-import-export-card-import-workspace')).toBeInTheDocument();

    const exportCard = screen.getByTestId('page-import-export-card-export-rules');
    expect(exportCard.querySelector('button')).toBeDisabled();

    const importBtn = screen
      .getByTestId('page-import-export-card-import-rules')
      .querySelector('button')!;
    fireEvent.click(importBtn);
    expect(handlers.openImportRules).toHaveBeenCalledTimes(1);
  });

  it('enables the export-rules button when rules exist and triggers the context method', async () => {
    renderPage(settingsWithRules);
    await waitFor(() => {
      expect(screen.getByTestId('page-import-export')).toBeInTheDocument();
    });
    const exportBtn = screen
      .getByTestId('page-import-export-card-export-rules')
      .querySelector('button')!;
    expect(exportBtn).not.toBeDisabled();
    fireEvent.click(exportBtn);
    expect(handlers.openExportRules).toHaveBeenCalledTimes(1);
  });
});
