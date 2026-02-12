import type { Meta, StoryObj } from '@storybook/react';
import { Theme } from '@radix-ui/themes';
import { WizardStepper } from './WizardStepper';

const meta: Meta<typeof WizardStepper> = {
  title: 'Components/UI/WizardStepper/WizardStepper',
  component: WizardStepper,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Theme accentColor="jade">
        <div style={{ width: 500 }}>
          <Story />
        </div>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const twoSteps = [
  { label: 'Selection' },
  { label: 'Export' },
];

const threeSteps = [
  { label: 'Source' },
  { label: 'Selection' },
  { label: 'Confirm' },
];

export const WizardStepperFirstStep: Story = {
  args: {
    steps: twoSteps,
    currentStep: 0,
  },
};

export const WizardStepperSecondStep: Story = {
  args: {
    steps: twoSteps,
    currentStep: 1,
  },
};

export const WizardStepperThreeStepsFirst: Story = {
  args: {
    steps: threeSteps,
    currentStep: 0,
  },
};

export const WizardStepperThreeStepsMiddle: Story = {
  args: {
    steps: threeSteps,
    currentStep: 1,
  },
};

export const WizardStepperThreeStepsLast: Story = {
  args: {
    steps: threeSteps,
    currentStep: 2,
  },
};
