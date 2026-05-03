import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string) => key),
}));

import { SearchableInlineList } from '../../src/components/Form/FormFields/SearchableInlineList';

const wrap = (ui: React.ReactNode) => render(<Theme>{ui}</Theme>);

const flatOptions = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];

describe('SearchableInlineList', () => {
  it('renders all options', () => {
    wrap(<SearchableInlineList value="" onValueChange={() => {}} options={flatOptions} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('marks the active option with a selected class', () => {
    wrap(<SearchableInlineList value="b" onValueChange={() => {}} options={flatOptions} />);
    const banana = screen.getByText('Banana').closest('[role="option"]');
    expect(banana?.className).toContain('ss-item--selected');
  });

  it('calls onValueChange when an option is selected', () => {
    const onValueChange = vi.fn();
    wrap(
      <SearchableInlineList value="" onValueChange={onValueChange} options={flatOptions} />,
    );
    fireEvent.click(screen.getByText('Cherry'));
    expect(onValueChange).toHaveBeenCalledWith('c');
  });

  it('does not call onValueChange when a disabled option is clicked', () => {
    const onValueChange = vi.fn();
    wrap(
      <SearchableInlineList
        value=""
        onValueChange={onValueChange}
        options={[{ value: 'd', label: 'Disabled', disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('renders grouped options with headings', () => {
    wrap(
      <SearchableInlineList
        value=""
        onValueChange={() => {}}
        groups={[
          { label: 'Fruits', options: [{ value: 'a', label: 'Apple' }] },
          { label: 'Berries', options: [{ value: 'b', label: 'Blueberry' }] },
        ]}
      />,
    );
    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Berries')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Blueberry')).toBeInTheDocument();
  });

  it('applies the provided id on the search input after mount', () => {
    wrap(
      <SearchableInlineList
        value=""
        onValueChange={() => {}}
        options={flatOptions}
        id="my-search"
      />,
    );
    expect(document.getElementById('my-search')).not.toBeNull();
  });

  it('uses the searchPlaceholder for the input aria-label', () => {
    wrap(
      <SearchableInlineList
        value=""
        onValueChange={() => {}}
        options={flatOptions}
        searchPlaceholder="Find a fruit"
      />,
    );
    expect(screen.getByLabelText('Find a fruit')).toBeInTheDocument();
  });

  it('falls back to the i18n default when searchPlaceholder is omitted', () => {
    wrap(<SearchableInlineList value="" onValueChange={() => {}} options={flatOptions} />);
    expect(screen.getByLabelText('searchableSelectSearchLabel')).toBeInTheDocument();
  });
});
