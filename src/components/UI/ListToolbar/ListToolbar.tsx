import React from 'react';
import { Box, Flex, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';

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
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      {action}
    </Flex>
  );
}
