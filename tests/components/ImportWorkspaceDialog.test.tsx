import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import { waitForJsonEditor } from '../../src/components/UI/JsonCodeEditor/setJsonEditorValue';

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
    notifyOnOrganize: true,
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

/** Switches the source segmented to "text" and sets JSON on the CodeMirror editor. */
async function pasteJson(json: string) {
  // The shared SourceModeSegmented uses Radix SegmentedControl, which renders
  // both a visible label and a hidden layout duplicate. Click the first match.
  fireEvent.click(screen.getAllByText('sourceText')[0]);
  // The editor is lazily mounted and exposes no <textarea>; drive it directly.
  // Wait for the view outside act() so Suspense can resolve, then dispatch the
  // document change inside act() so the React validation state flushes.
  const view = await waitForJsonEditor(document.body);
  await act(async () => {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: json } });
  });
}

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

  it('shows an error callout when invalid JSON is pasted', async () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    await pasteJson('{not valid json');
    expect(screen.getByTestId('workspace-import-btn-confirm')).toBeDisabled();
    // Parse error rendered by the shared ImportErrorCallout (i18n key surfaced by the mock).
    expect(screen.getByText('invalidJson')).toBeInTheDocument();
  });

  it('shows the import summary and pre-fills the name override on success', async () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    await pasteJson(JSON.stringify(validPayload));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-summary')).toBeInTheDocument();
    });
    expect(
      (screen.getByTestId('workspace-import-name-override') as HTMLInputElement).value,
    ).toBe('Imported');
  });

  it('disables the merge mode when there is no active workspace', async () => {
    useActiveWorkspaceContextMock.mockReturnValue({ active: null });
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    await pasteJson(JSON.stringify(validPayload));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-mode-merge')).toBeDisabled();
    });
  });

  it('imports as a new workspace on confirm', async () => {
    const onOpenChange = vi.fn();
    wrap(<ImportWorkspaceDialog open onOpenChange={onOpenChange} />);
    await pasteJson(JSON.stringify(validPayload));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-btn-confirm')).toBeEnabled();
    });
    fireEvent.click(screen.getByTestId('workspace-import-btn-confirm'));

    await waitFor(() => expect(applyAsNew).toHaveBeenCalled());
    expect(applyAsNew).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: { name: 'Imported', accentColor: 'jade' } }),
      expect.objectContaining({ includeStatistics: false, nameOverride: 'Imported' }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('reads a JSON file and shows the summary', async () => {
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);

    const file = new File([JSON.stringify(validPayload)], 'workspace.json', {
      type: 'application/json',
    });
    // The shared FileDropZone renders a hidden file input next to the drop zone.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-summary')).toBeInTheDocument();
    });
  });

  it('shows an error callout when applyAsNew throws', async () => {
    applyAsNew.mockRejectedValueOnce(new Error('apply failed'));
    wrap(<ImportWorkspaceDialog open onOpenChange={() => {}} />);
    await pasteJson(JSON.stringify(validPayload));
    await waitFor(() => {
      expect(screen.getByTestId('workspace-import-btn-confirm')).toBeEnabled();
    });
    fireEvent.click(screen.getByTestId('workspace-import-btn-confirm'));

    await waitFor(() =>
      expect(screen.getByTestId('workspace-import-error')).toBeInTheDocument(),
    );
  });
});
