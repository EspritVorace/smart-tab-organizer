import React from 'react';
import { Dialog, Flex, Box, Text, Button } from '@radix-ui/themes';
import { LayoutGrid, Pin, PlayCircle, ChevronRight } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import { SessionsTheme } from '../../Form/themes';

interface ProfileOnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * One-time onboarding dialog shown before the user creates their first profile.
 */
export function ProfileOnboardingDialog({ open, onClose }: ProfileOnboardingDialogProps) {
  return (
    <SessionsTheme>
      <Dialog.Root open={open} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
        <Dialog.Content maxWidth="480px">
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Pin size={18} aria-hidden="true" />
              {getMessage('sessionsOnboardingProfileTitle')}
            </Flex>
          </Dialog.Title>

          <Dialog.Description size="2" mb="4">
            {getMessage('sessionsOnboardingDescription')}
          </Dialog.Description>

          {/* 3-step flow diagram */}
          <Flex align="center" justify="center" gap="2" mb="4" wrap="wrap">
            <OnboardingStep icon={LayoutGrid} label={getMessage('sessionsOnboardingStep1')} />
            <ChevronRight
              size={18}
              style={{ color: 'var(--gray-8)', flexShrink: 0 }}
              aria-hidden="true"
            />
            <OnboardingStep icon={Pin} label={getMessage('sessionsOnboardingStep2')} />
            <ChevronRight
              size={18}
              style={{ color: 'var(--gray-8)', flexShrink: 0 }}
              aria-hidden="true"
            />
            <OnboardingStep icon={PlayCircle} label={getMessage('sessionsOnboardingStep3')} />
          </Flex>

          {/* Bullet points */}
          <Flex direction="column" gap="2" mb="4">
            <BulletItem text={getMessage('sessionsOnboardingBullet1')} />
            <BulletItem text={getMessage('sessionsOnboardingBullet2')} />
          </Flex>

          <Flex justify="end">
            <Button onClick={onClose}>
              {getMessage('sessionsOnboardingGotIt')}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </SessionsTheme>
  );
}

function OnboardingStep({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <Flex direction="column" align="center" gap="2" style={{ width: 88 }}>
      <Box
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-3)',
          backgroundColor: 'var(--accent-a3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={24} style={{ color: 'var(--accent-11)' }} aria-hidden="true" />
      </Box>
      <Text size="1" align="center" color="gray">
        {label}
      </Text>
    </Flex>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <Flex align="start" gap="2">
      <Box
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'var(--accent-9)',
          marginTop: 7,
          flexShrink: 0,
        }}
      />
      <Text size="2">{text}</Text>
    </Flex>
  );
}
