import React from 'react';
import { Flex, Text, Box } from '@radix-ui/themes';
import { Check } from 'lucide-react';

interface WizardStep {
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  /** When true, future steps get aria-disabled="true" (creation wizard). */
  disableFutureNavigation?: boolean;
  'data-testid'?: string;
}

export function WizardStepper({ steps, currentStep, disableFutureNavigation = false, 'data-testid': testId }: WizardStepperProps) {
  return (
    <Flex data-testid={testId} align="center" gap="2" py="3" role="list">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isFuture = index > currentStep;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <Box
                aria-hidden="true"
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
            <Box
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
            >
              <Flex
                align="center"
                gap="2"
                aria-disabled={disableFutureNavigation && isFuture ? 'true' : undefined}
              >
                <Flex
                  align="center"
                  justify="center"
                  aria-hidden="true"
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
                        : 'var(--gray-11)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </Text>
              </Flex>
            </Box>
          </React.Fragment>
        );
      })}
    </Flex>
  );
}
