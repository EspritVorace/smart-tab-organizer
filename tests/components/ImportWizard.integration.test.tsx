import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import type { DomainRuleSetting } from '../../src/types/syncSettings';

vi.mock('@/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
  getPluralMessage: vi.fn((count: number, oneKey: string, manyKey: string) =>
    count === 1 ? oneKey : manyKey,
  ),
}));

vi.mock('@/utils/toast', () => ({
  showSuccessToast: vi.fn(),
}));

const samplePackRule = {
  id: 'pack-rule-1',
  domainFilter: 'example.com',
  label: 'Sample',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  presetId: null,
  enabled: true,
};

const samplePack = {
  version: 1,
  pack: { id: 'pack-sample', name: 'Sample pack', categoryId: 'cloud' },
  domainRules: [samplePackRule],
};

vi.mock('../../src/hooks/packDataSource', () => ({
  getPackSourceEntries: () => [
    { path: '/src/data/packs/sample.json', data: samplePack },
  ],
  getCategoriesSource: () => ({
    categories: [{ id: 'cloud', emoji: '☁️', label: 'Cloud', builtIn: false }],
  }),
}));

import { ImportWizard } from '../../src/components/UI/ImportExportWizards/ImportWizard';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ImportWizard integration : mode pack', () => {
  it('renders the PackGallery when initialSourceMode=pack', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );
    expect(screen.getByTestId('pack-gallery')).toBeInTheDocument();
  });

  it('disables the wizard Next button (aria-disabled) when no pack is selected', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );

    const nextBtn = screen.getByTestId('import-wizard-pack-next');
    expect(nextBtn).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled pattern keeps the button focusable (no native tabindex=-1 added).
    expect(nextBtn.getAttribute('tabindex')).not.toBe('-1');
  });

  it('advances to step 1 when the user selects a pack and clicks the wizard Next', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );

    const checkbox = screen.getByTestId('pack-card-pack-sample-checkbox');
    fireEvent.click(checkbox);

    const nextBtn = screen.getByTestId('import-wizard-pack-next');
    expect(nextBtn).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(nextBtn);

    expect(screen.getByText('newRulesGroup')).toBeInTheDocument();
    expect(screen.queryByTestId('pack-gallery')).not.toBeInTheDocument();
  });

  it('returns to step 0 via Previous while keeping the gallery visible', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );

    fireEvent.click(screen.getByTestId('pack-card-pack-sample-checkbox'));
    fireEvent.click(screen.getByTestId('import-wizard-pack-next'));
    expect(screen.getByText('newRulesGroup')).toBeInTheDocument();

    const previousBtn = screen.getByText('previous').closest('button')!;
    fireEvent.click(previousBtn);

    expect(screen.getByTestId('pack-gallery')).toBeInTheDocument();
  });

  it('advances to step 1 on Ctrl+Enter once a pack is selected', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );

    fireEvent.click(screen.getByTestId('pack-card-pack-sample-checkbox'));
    fireEvent.keyDown(screen.getByTestId('import-wizard-pack-next'), {
      key: 'Enter',
      ctrlKey: true,
    });

    expect(screen.getByText('newRulesGroup')).toBeInTheDocument();
    expect(screen.queryByTestId('pack-gallery')).not.toBeInTheDocument();
  });

  it('returns to step 0 on Ctrl+Backspace', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
        initialSourceMode="pack"
      />,
    );

    fireEvent.click(screen.getByTestId('pack-card-pack-sample-checkbox'));
    fireEvent.click(screen.getByTestId('import-wizard-pack-next'));
    expect(screen.getByText('newRulesGroup')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByText('previous').closest('button')!, {
      key: 'Backspace',
      ctrlKey: true,
    });

    expect(screen.getByTestId('pack-gallery')).toBeInTheDocument();
  });

  it('does not touch the default mode when initialSourceMode is missing', () => {
    wrap(
      <ImportWizard
        open
        onOpenChange={vi.fn()}
        existingRules={[] as DomainRuleSetting[]}
        onImport={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('pack-gallery')).not.toBeInTheDocument();
  });
});
