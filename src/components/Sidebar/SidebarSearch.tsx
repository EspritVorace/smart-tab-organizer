import React from 'react';
import { TextField, Box } from '@radix-ui/themes';
import { Search } from 'lucide-react';

interface SidebarSearchProps {
  isCollapsed?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

export function SidebarSearch({
  isCollapsed = false,
  placeholder = "Search...",
  value = "",
  onValueChange,
  onSearch
}: SidebarSearchProps) {
  if (isCollapsed) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <Box p="2">
      <TextField.Root
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        size="2"
      >
        <TextField.Slot>
          <Search size={16} />
        </TextField.Slot>
      </TextField.Root>
    </Box>
  );
}