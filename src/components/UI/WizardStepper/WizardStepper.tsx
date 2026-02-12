import React from 'react';
import { Flex, Text, Box } from '@radix-ui/themes';
import { Check } from 'lucide-react';

interface WizardStep {
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <Flex align="center" gap="2" py="3">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <Box
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: isCompleted
                    ? 'var(--accent-9)'
                    : 'var(--gray-a5)',
                  borderRadius: 1,
                }}
              />
            )}
            <Flex align="center" gap="2">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? 'var(--accent-9)'
                    : isCompleted
                      ? 'var(--accent-9)'
                      : 'var(--gray-a4)',
                  color: isActive || isCompleted ? 'white' : 'var(--gray-11)',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </Flex>
              <Text
                size="2"
                weight={isActive ? 'bold' : 'regular'}
                style={{
                  color: isActive
                    ? 'var(--accent-11)'
                    : isCompleted
                      ? 'var(--accent-11)'
                      : 'var(--gray-9)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </Text>
            </Flex>
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
