import React from 'react';
import { Box, Flex, Kbd, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { getEffectiveBindings } from '@/shortcuts/getEffectiveBindings';

/** Keyboard shortcut that focuses the active search field (see registry). */
const focusBinding = getEffectiveBindings('options.search.focus')[0];
const SEARCH_SHORTCUT = Array.isArray(focusBinding)
  ? focusBinding.join(' ')
  : focusBinding;

interface ListToolbarProps {
  /** Container testid (e.g. "page-rules-toolbar"). */
  testId?: string;
  /** Search-field testid (e.g. "page-rules-search"). */
  searchTestId?: string;
  /** Placeholder string already resolved by the caller via getMessage(). */
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Action button (Add Rule / Take Snapshot) supplied by the caller. */
  action: React.ReactNode;
}

export function ListToolbar({
  testId,
  searchTestId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  action,
}: ListToolbarProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape') return;
    if (searchValue.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      onSearchChange('');
      return;
    }
    event.currentTarget.blur();
  };

  return (
    <Flex data-testid={testId} gap="3" mb="4" align="center">
      <Box style={{ flex: 1 }}>
        <TextField.Root
          data-testid={searchTestId}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          aria-keyshortcuts={SEARCH_SHORTCUT}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
          {SEARCH_SHORTCUT && searchValue.length === 0 && (
            <TextField.Slot side="right">
              <Kbd size="1" aria-hidden="true">{SEARCH_SHORTCUT}</Kbd>
            </TextField.Slot>
          )}
        </TextField.Root>
      </Box>
      {action}
    </Flex>
  );
}
