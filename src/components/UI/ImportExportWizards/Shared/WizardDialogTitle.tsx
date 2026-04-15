import React from 'react';
import { Dialog, Flex, Separator } from '@radix-ui/themes';
import type { LucideIcon } from 'lucide-react';
import { getMessage } from '../../../../utils/i18n';

interface WizardDialogTitleProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

export function WizardDialogTitle({ icon: Icon, titleKey, descriptionKey }: WizardDialogTitleProps) {
  return (
    <>
      <Dialog.Title>
        <Flex align="center" gap="2">
          <Icon size={18} aria-hidden="true" />
          {getMessage(titleKey)}
        </Flex>
      </Dialog.Title>
      <Dialog.Description size="2" color="gray">
        {getMessage(descriptionKey)}
      </Dialog.Description>
      <Separator size="4" mt="3" style={{ opacity: 0.3 }} />
    </>
  );
}
