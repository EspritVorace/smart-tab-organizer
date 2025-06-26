import React from 'react';
import { Flex, Heading, IconButton } from '@radix-ui/themes';
import { Settings } from 'lucide-react';

interface PopupHeaderProps {
  title: string;
  onSettingsOpen: () => void;
}

export function PopupHeader({ title, onSettingsOpen }: PopupHeaderProps) {
  return (
    <Flex justify="between" align="center" width="100%">
      <Heading size="6" weight="bold">{title}</Heading>
      <IconButton 
        variant="ghost" 
        size="2"
        onClick={onSettingsOpen}
        aria-label="Open settings"
      >
        <Settings size={24} />
      </IconButton>
    </Flex>
  );
}