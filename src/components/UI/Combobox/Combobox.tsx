import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, TextField, Button, Card, Flex } from '@radix-ui/themes';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxGroup {
  label: string;
  options: ComboboxOption[];
}

export interface ComboboxProps {
  options?: ComboboxOption[];
  groups?: ComboboxGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  width?: string;
}

export function Combobox({
  options = [],
  groups = [],
  value,
  onValueChange,
  placeholder = "Sélectionner une option...",
  disabled = false,
  searchPlaceholder = "Rechercher...",
  noResultsText = "Aucun résultat trouvé",
  width = "100%"
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState<ComboboxOption | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all options for easier navigation
  const allOptions = React.useMemo(() => {
    const flatOptions: ComboboxOption[] = [];
    
    if (options.length > 0) {
      flatOptions.push(...options);
    }
    
    if (groups.length > 0) {
      groups.forEach(group => {
        flatOptions.push(...group.options);
      });
    }
    
    return flatOptions;
  }, [options, groups]);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return allOptions;
    
    return allOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allOptions, searchTerm]);

  // Filter groups based on search term
  const filteredGroups = React.useMemo(() => {
    if (!searchTerm) return groups;
    
    return groups.map(group => ({
      ...group,
      options: group.options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(group => group.options.length > 0);
  }, [groups, searchTerm]);

  // Find selected option
  useEffect(() => {
    if (value) {
      const option = allOptions.find(opt => opt.value === value);
      setSelectedOption(prev => {
        // Éviter les re-renders inutiles si l'option n'a pas changé
        if (prev?.value === option?.value) {
          return prev;
        }
        return option || null;
      });
    } else {
      setSelectedOption(prev => prev === null ? null : null);
    }
  }, [value, allOptions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const availableOptions = options.length > 0 ? filteredOptions : 
      filteredGroups.flatMap(group => group.options);

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen) {
          if (focusedIndex >= 0 && focusedIndex < availableOptions.length) {
            const option = availableOptions[focusedIndex];
            if (!option.disabled) {
              handleSelect(option);
            }
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < availableOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : availableOptions.length - 1
          );
        }
        break;
    }
  };

  // Handle option selection
  const handleSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    
    setSelectedOption(option);
    onValueChange?.(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        listRef.current && 
        !listRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Render option item
  const renderOption = (option: ComboboxOption, index: number, isGrouped: boolean = false) => {
    const isSelected = selectedOption?.value === option.value;
    const isFocused = focusedIndex === index;
    
    return (
      <Box
        key={option.value}
        onClick={() => handleSelect(option)}
        style={{
          padding: '8px 12px',
          cursor: option.disabled ? 'not-allowed' : 'pointer',
          backgroundColor: isFocused ? 'var(--accent-3)' : 'transparent',
          opacity: option.disabled ? 0.5 : 1,
          paddingLeft: isGrouped ? '24px' : '12px'
        }}
        onMouseEnter={() => setFocusedIndex(index)}
      >
        <Flex align="center" justify="between">
          <Text size="2">{option.label}</Text>
          {isSelected && <CheckIcon size={16} />}
        </Flex>
      </Box>
    );
  };

  const availableOptions = options.length > 0 ? filteredOptions : 
    filteredGroups.flatMap(group => group.options);

  return (
    <Box style={{ width, position: 'relative' }}>
      <Button
        ref={triggerRef}
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          !disabled && setIsOpen(!isOpen);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          width: '100%',
          justifyContent: 'space-between',
          textAlign: 'left'
        }}
      >
        <Text>{selectedOption ? selectedOption.label : placeholder}</Text>
        <ChevronDownIcon 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </Button>

      {isOpen && (
        <Card
          ref={listRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid var(--gray-6)'
          }}
        >
          <Box p="2">
            <TextField.Root
              ref={searchRef}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              size="1"
            />
          </Box>

          <Box>
            {options.length > 0 ? (
              // Render flat options
              filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => renderOption(option, index))
              ) : (
                <Box p="3">
                  <Text size="2" color="gray">{noResultsText}</Text>
                </Box>
              )
            ) : (
              // Render grouped options
              filteredGroups.length > 0 ? (
                filteredGroups.map((group, groupIndex) => (
                  <Box key={group.label}>
                    <Box p="2" style={{ backgroundColor: 'var(--gray-2)' }}>
                      <Text size="1" weight="medium" color="gray">
                        {group.label}
                      </Text>
                    </Box>
                    {group.options.map((option, optionIndex) => {
                      const globalIndex = filteredGroups
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.options.length, 0) + optionIndex;
                      return renderOption(option, globalIndex, true);
                    })}
                  </Box>
                ))
              ) : (
                <Box p="3">
                  <Text size="2" color="gray">{noResultsText}</Text>
                </Box>
              )
            )}
          </Box>
        </Card>
      )}
    </Box>
  );
}