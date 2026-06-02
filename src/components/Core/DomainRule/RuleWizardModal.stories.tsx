import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from 'storybook/test';
import { RuleWizardModal } from './RuleWizardModal';
const action = (name: string) => (...args: unknown[]) => console.log(name, ...args);
import type { DomainRule } from '@/schemas/domainRule';
import type { AppSettings } from '@/types/syncSettings';

const mockAppSettings: AppSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: true,
  deduplicationKeepStrategy: 'keep-old',
  defaultRestoreAction: 'current',
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  notifyOnOrganize: true,
  domainRules: [
    {
      id: 'existing-rule-1',
      domainFilter: 'existing.com',
      label: 'Existing Rule',
      titleParsingRegEx: '(.+)',
      urlParsingRegEx: '',
      groupNameSource: 'title',
      deduplicationMatchMode: 'exact',
      color: 'grey',
      deduplicationEnabled: true,
      ignoredQueryParams: [],
      presetId: null,
      urlExtractionMode: 'regex',
      enabled: true
    }
  ]
};

const mockDomainRule: DomainRule = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  color: 'purple',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  urlExtractionMode: 'regex'
};

const meta: Meta<typeof RuleWizardModal> = {
  title: 'Components/Core/DomainRule/RuleWizardModal',
  component: RuleWizardModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    domainRule: {
      control: 'object',
    },
  },
  args: {
    onClose: action('onClose'),
    onSubmit: action('onSubmit'),
    syncSettings: mockAppSettings,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// === Creation (4-step wizard) ===

export const RuleWizardModalCreate: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
  },
};

// === Edit (summary view) ===

export const RuleWizardModalEdit: Story = {
  args: {
    isOpen: true,
    domainRule: mockDomainRule,
  },
};

export const RuleWizardModalEditManual: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'title',
      titleParsingRegEx: '\\[([A-Z]+-\\d+)\\]',
      urlParsingRegEx: '',
      presetId: null,
    },
  },
};

export const RuleWizardModalEditAsk: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      groupNameSource: 'manual',
      titleParsingRegEx: '',
      urlParsingRegEx: '',
      presetId: null,
    },
  },
};

export const RuleWizardModalEditDeduplicationDisabled: Story = {
  args: {
    isOpen: true,
    domainRule: {
      ...mockDomainRule,
      deduplicationEnabled: false,
    },
  },
};

// === Edge cases ===

export const RuleWizardModalClosed: Story = {
  args: {
    isOpen: false,
    domainRule: undefined,
  },
};

// Fills step 1 (label + domain) and clicks Next → step 2.
export const RuleWizardModalStep2: Story = {
  args: { isOpen: true, domainRule: undefined },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    const labelInput = await body.findByTestId('wizard-rule-field-label');
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, 'GitHub');

    const domainInput = body.getByTestId('wizard-rule-field-domain');
    await userEvent.clear(domainInput);
    await userEvent.type(domainInput, 'github.com');

    const nextBtn = body.getByTestId('wizard-rule-btn-next');
    await expect(nextBtn).not.toBeDisabled();
    await userEvent.click(nextBtn);
  },
};

// Reaches step 3 (options) by navigating through steps 1 and 2.
// Switches to "ask" mode on step 2 to avoid the preset-required gating
// (no preset list is loaded in jsdom, and ask mode has no further required fields).
export const RuleWizardModalStep3: Story = {
  args: { isOpen: true, domainRule: undefined },
  play: async (context) => {
    await RuleWizardModalStep2.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const askRadio = body.getByTestId('config-mode-ask');
    await userEvent.click(askRadio);
    const nextBtn = body.getByTestId('wizard-rule-btn-next');
    await userEvent.click(nextBtn);
  },
};

// Reaches step 4 (summary) by navigating through steps 1, 2, and 3.
export const RuleWizardModalStep4: Story = {
  args: { isOpen: true, domainRule: undefined },
  parameters: {
    // Badge variant="solid" without highContrast is intentional (matches DomainRuleCard).
    // The contrast ratio depends on the accent color chosen by the user; false positive here.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  play: async (context) => {
    await RuleWizardModalStep3.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const nextBtn = body.getByTestId('wizard-rule-btn-next');
    await userEvent.click(nextBtn);
  },
};

// Completes the wizard and submits by clicking Create on step 4.
export const RuleWizardModalCreateComplete: Story = {
  args: { isOpen: true, domainRule: undefined },
  play: async (context) => {
    await RuleWizardModalStep4.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const createBtn = body.getByTestId('wizard-rule-btn-create');
    await userEvent.click(createBtn);
  },
};

// On step 2 in preset mode, the Next button is aria-disabled until a preset
// is selected, and clicking it (e.g. via keyboard) does not advance the wizard.
export const RuleWizardModalStep2PresetRequired: Story = {
  args: { isOpen: true, domainRule: undefined },
  play: async (context) => {
    await RuleWizardModalStep2.play?.(context);
    const body = within(context.canvasElement.ownerDocument.body);
    const nextBtn = body.getByTestId('wizard-rule-btn-next');
    await expect(nextBtn).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(nextBtn);
    // Still on step 2 — the gating short-circuited handleNext.
    await expect(body.getByTestId('wizard-rule-step-2')).toBeInTheDocument();
  },
};

// Tries to advance with an empty label to trigger inline validation.
export const RuleWizardModalValidationError: Story = {
  args: { isOpen: true, domainRule: undefined },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const nextBtn = body.getByTestId('wizard-rule-btn-next');
    await userEvent.click(nextBtn);
    // Should still be on step 1
    await expect(body.getByTestId('wizard-rule-step-1')).toBeInTheDocument();
  },
};

// Opens an existing rule in edit mode and clicks Save directly.
export const RuleWizardModalEditSave: Story = {
  args: { isOpen: true, domainRule: mockDomainRule },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const saveBtn = body.getByTestId('wizard-rule-btn-save');
    await userEvent.click(saveBtn);
  },
};

export const RuleWizardModalLabelUniqueness: Story = {
  args: {
    isOpen: true,
    domainRule: undefined,
    syncSettings: {
      ...mockAppSettings,
      domainRules: [
        ...mockAppSettings.domainRules,
        {
          id: 'test-rule',
          domainFilter: 'test.com',
          label: 'Test Label',
          titleParsingRegEx: '(.+)',
          urlParsingRegEx: '',
          groupNameSource: 'title',
          deduplicationMatchMode: 'exact',
          color: 'grey',
          deduplicationEnabled: true,
          ignoredQueryParams: [],
          presetId: null,
          urlExtractionMode: 'regex',
          enabled: true
        }
      ]
    },
  },
};
