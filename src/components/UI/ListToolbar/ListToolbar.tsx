import React from 'react';
import { Box, Flex, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';

interface ListToolbarProps {
  /** testid du conteneur (ex: "page-rules-toolbar") */
  testId?: string;
  /** testid du champ de recherche (ex: "page-rules-search") */
  searchTestId?: string;
  /** Placeholder i18n déjà résolu par le caller via getMessage() */
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Bouton d'action (Add Rule / Take Snapshot) passé par le caller */
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
  return (
    <Flex data-testid={testId} gap="3" mb="4" align="center">
      <Box style={{ flex: 1 }}>
        <TextField.Root
          data-testid={searchTestId}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        >
          <TextField.Slot>
            <Search size={16} aria-hidden="true" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      {action}
    </Flex>
  );
}
