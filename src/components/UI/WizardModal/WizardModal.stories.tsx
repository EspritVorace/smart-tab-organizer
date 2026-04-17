import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button, Theme, Text, Flex } from '@radix-ui/themes';
import { FileUp, Plus } from 'lucide-react';
import { WizardModal } from './WizardModal';
import { WizardStepper } from '../WizardStepper/WizardStepper';

const meta: Meta<typeof WizardModal> = {
  title: 'Components/UI/WizardModal/WizardModal',
  component: WizardModal,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Theme accentColor="indigo">
        <Story />
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function MinimalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <WizardModal open={open} onOpenChange={setOpen}>
      <WizardModal.Header
        icon={FileUp}
        title="Import data"
        description="Paste your JSON or import a file to get started."
      />
      <WizardModal.Body>
        <Text size="2">Body content goes here.</Text>
      </WizardModal.Body>
      <WizardModal.Footer>
        <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={() => setOpen(false)}>Confirm</Button>
      </WizardModal.Footer>
    </WizardModal>
  );
}

function SteppedDemo() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const descriptions = [
    'Name your rule and specify the target domain.',
    'Choose how to name groups.',
    'Configure deduplication and advanced options.',
    'Review the configuration, then create the rule.',
  ];
  const labels = [
    { label: 'Identity' },
    { label: 'Configuration' },
    { label: 'Options' },
    { label: 'Summary' },
  ];
  return (
    <WizardModal open={open} onOpenChange={setOpen}>
      <WizardModal.Header
        icon={Plus}
        title="Create rule"
        description={descriptions[step]}
      />
      <WizardStepper steps={labels} currentStep={step} disableFutureNavigation />
      <WizardModal.Body>
        <Flex direction="column" gap="2">
          <Text size="3" weight="bold">Step {step + 1}</Text>
          <Text size="2">{descriptions[step]}</Text>
        </Flex>
      </WizardModal.Body>
      <WizardModal.Footer>
        {step === 0 ? (
          <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        ) : (
          <Button variant="soft" color="gray" onClick={() => setStep(step - 1)}>
            Previous
          </Button>
        )}
        {step < labels.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button onClick={() => setOpen(false)}>Create</Button>
        )}
      </WizardModal.Footer>
    </WizardModal>
  );
}

export const WizardModalMinimal: Story = {
  render: () => <MinimalDemo />,
};

export const WizardModalWithStepperAndPerStepDescription: Story = {
  render: () => <SteppedDemo />,
};
