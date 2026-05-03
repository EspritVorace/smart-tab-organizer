import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
}));

const applyAsNew = vi.fn();
const applyToExisting = vi.fn();
vi.mock('../../src/utils/workspaceImportExport', () => ({
  applyWorkspaceImportAsNew: (...args: unknown[]) => applyAsNew(...args),
  applyWorkspaceImportToExisting: (...args: unknown[]) => applyToExisting(...args),
}));

const useActiveWorkspaceContextMock = vi.fn();
vi.mock('../../src/contexts/ActiveWorkspaceContext', () => ({
  useActiveWorkspaceContext: () => useActiveWorkspaceContextMock(),
}));

vi.mock('../../src/utils/logger', () => ({
  logger: { debug: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { ImportWorkspaceDialog } from '../../src/components/UI/Workspace/ImportWorkspaceDialog';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const validPayload = {
  workspace: { name: 'Imported', accentColor: 'jade' },
  settings: {
    globalGroupingEnabled: true,
    globalDeduplicationEnabled: true,
    deduplicateUnmatchedDomains: false,
    deduplicationKeepStrategy: 'keep-grouped-or-new',
    notifyOnGrouping: true,
    notifyOnDeduplication: true,
  },
  domainRules: [
    {
      id: 'r1',
      domainFilter: 'example.com',
      label: 'Example',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      groupNameSource: 'smart',
      deduplicationMatchMode: 'exact',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true,
    },
  ],
  categories: [],
  sessions: [],
};

beforeEach(() => {
  applyAsNew.mockReset().mockResolvedValue(undefined);
  applyToExisting.mockReset().mockResolvedValue(undefined);
  useActiveWorkspaceContextMock.mockReset();
  useActiveWorkspaceContextMock.mockReturnValue({
    active: { id: 'ws-active', name: 'Active' },
  });
});

describe('ImportWorkspaceDialog', () => {
  it('renders nothing visible when closed', () => {
    wrap(<ImportWorkspaceDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId('workspace-import-dialog')).toBeNull();
  });

  it('renders the dialog and disables confirm before any input', () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('workspace-import-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-import-btn-confirm')).toBeDisabled();
  });

  it('shows an error callout when invalid JSON is pasted', () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: '{not valid json' },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    expect(screen.getByTestId('workspace-import-error')).toBeInTheDocument();
  });

  it('shows an error callout when JSON does not match the schema', () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: '{"foo":"bar"}' },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    expect(screen.getByTestId('workspace-import-error')).toBeInTheDocument();
  });

  it('shows the import summary and pre-fills the name override on success', () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: JSON.stringify(validPayload) },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    expect(screen.getByTestId('workspace-import-summary')).toBeInTheDocument();
    expect(
      (screen.getByTestId('workspace-import-name-override') as HTMLInputElement).value,
    ).toBe('Imported');
  });

  it('disables the merge mode when there is no active workspace', () => {
    useActiveWorkspaceContextMock.mockReturnValue({ active: null });
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: JSON.stringify(validPayload) },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    expect(screen.getByTestId('workspace-import-mode-merge')).toBeDisabled();
  });

  it('imports as a new workspace on confirm', async () => {
    const onOpenChange = vi.fn();
    wrap(<ImportWorkspaceDialog open onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: JSON.stringify(validPayload) },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    fireEvent.click(screen.getByTestId('workspace-import-btn-confirm'));

    await waitFor(() => expect(applyAsNew).toHaveBeenCalled());
    expect(applyAsNew).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: { name: 'Imported', accentColor: 'jade' } }),
      expect.objectContaining({ includeStatistics: false, nameOverride: 'Imported' }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('disables the paste button when no text is entered', () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('workspace-import-paste-btn')).toBeDisabled();
  });

  it('reads a JSON file and shows the summary', async () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);

    const file = new File([JSON.stringify(validPayload)], 'workspace.json', {
      type: 'application/json',
    });
    const input = screen.getByTestId('workspace-import-file') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-summary')).toBeInTheDocument();
    });
  });

  it('shows an error callout when applyAsNew throws', async () => {
    applyAsNew.mockRejectedValueOnce(new Error('apply failed'));
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByTestId('workspace-import-paste'), {
      target: { value: JSON.stringify(validPayload) },
    });
    fireEvent.click(screen.getByTestId('workspace-import-paste-btn'));
    fireEvent.click(screen.getByTestId('workspace-import-btn-confirm'));

    await waitFor(() =>
      expect(screen.getByTestId('workspace-import-error')).toBeInTheDocument(),
    );
  });
});
