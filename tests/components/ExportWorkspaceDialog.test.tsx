import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
}));

const collectWorkspaceExport = vi.fn();
vi.mock('../../src/utils/workspaceImportExport', () => ({
  collectWorkspaceExport: (...args: unknown[]) => collectWorkspaceExport(...args),
}));

const useActiveWorkspaceContextMock = vi.fn();
vi.mock('../../src/contexts/ActiveWorkspaceContext', () => ({
  useActiveWorkspaceContext: () => useActiveWorkspaceContextMock(),
}));

const writeText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText },
});

vi.mock('../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../src/utils/toast', () => ({
  showSuccessToast: vi.fn(),
}));

import { ExportWorkspaceDialog } from '../../src/components/UI/Workspace/ExportWorkspaceDialog';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const samplePayload = {
  workspace: { name: 'Active', accentColor: 'jade' },
  settings: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    deduplicateUnmatchedDomains: false,
    deduplicationKeepStrategy: 'keep-grouped-or-new',
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
  },
  domainRules: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
  categories: [],
  sessions: [{ id: 's1' }],
};

beforeEach(() => {
  collectWorkspaceExport.mockReset().mockResolvedValue(samplePayload);
  useActiveWorkspaceContextMock.mockReset();
  useActiveWorkspaceContextMock.mockReturnValue({
    active: { id: 'ws-1', name: 'Active' },
  });
  writeText.mockReset().mockResolvedValue(undefined);
});

describe('ExportWorkspaceDialog', () => {
  it('renders the dialog title and description with workspace name', () => {
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('workspace-export-dialog')).toBeInTheDocument();
    expect(screen.getByText(/workspaceExportDescription/)).toBeInTheDocument();
  });

  it('does not collect when there is no active workspace', () => {
    useActiveWorkspaceContextMock.mockReturnValue({ active: null });
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    expect(collectWorkspaceExport).not.toHaveBeenCalled();
  });

  it('collects the export payload when opened with an active workspace', async () => {
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    await waitFor(() => expect(collectWorkspaceExport).toHaveBeenCalled());
    expect(collectWorkspaceExport).toHaveBeenCalledWith(
      { id: 'ws-1', name: 'Active' },
      { includeStatistics: false, note: '' },
    );
  });

  it('updates the rule and session count after collect resolves', async () => {
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/workspaceExportSummaryRules\(3\)/)).toBeInTheDocument();
    });
    expect(screen.getByText(/workspaceExportSummarySessions\(1\)/)).toBeInTheDocument();
  });

  it('refreshes the payload when "include statistics" is toggled', async () => {
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    await waitFor(() => expect(collectWorkspaceExport).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTestId('workspace-export-stats'));
    await waitFor(() => {
      expect(collectWorkspaceExport.mock.calls.at(-1)?.[1]).toEqual({
        includeStatistics: true,
        note: '',
      });
    });
  });

  it('refreshes the payload when the note changes', async () => {
    wrap(<ExportWorkspaceDialog open onOpenChange={() => {}} />);
    await waitFor(() => expect(collectWorkspaceExport).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByTestId('workspace-export-note'), {
      target: { value: 'My export note' },
    });
    await waitFor(() => {
      expect(collectWorkspaceExport.mock.calls.at(-1)?.[1]).toEqual({
        includeStatistics: false,
        note: 'My export note',
      });
    });
  });

  it('exports to clipboard and closes the dialog', async () => {
    const onOpenChange = vi.fn();
    wrap(<ExportWorkspaceDialog open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(collectWorkspaceExport).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('workspace-export-btn-clipboard'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('"workspace"');
  });
});
