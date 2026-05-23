import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Box, Flex, Text } from '@radix-ui/themes';
import { RuleOverlapWarning } from './RuleOverlapWarning';
import type { DomainRuleSetting } from '@/types/syncSettings';

const makeRule = (
  id: string,
  label: string,
  domainFilter: string,
): DomainRuleSetting => ({
  id,
  domainFilter,
  label,
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  ignoredQueryParams: [],
  presetId: null,
  urlExtractionMode: 'regex',
  categoryId: null,
  enabled: true,
});

const twoRules: DomainRuleSetting[] = [
  makeRule('1', 'Google parent', 'google.com'),
  makeRule('2', 'Gmail', 'mail.google.com'),
];

const fourRules: DomainRuleSetting[] = [
  makeRule('1', 'Google parent', 'google.com'),
  makeRule('2', 'Gmail', 'mail.google.com'),
  makeRule('3', 'Drive', 'drive.google.com'),
  makeRule('4', 'Maps', 'maps.google.com'),
];

const meta: Meta<typeof RuleOverlapWarning> = {
  title: 'Components/Core/DomainRule/RuleOverlapWarning',
  component: RuleOverlapWarning,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ padding: 'var(--space-4)' }}>
          <Flex align="center" gap="2">
            <Text size="2" color="gray">mail.google.com</Text>
            <Story />
          </Flex>
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RuleOverlapWarningTwoRules: Story = {
  args: {
    currentRuleId: '2',
    precedenceList: twoRules,
  },
};

export const RuleOverlapWarningFourRules: Story = {
  args: {
    currentRuleId: '2',
    precedenceList: fourRules,
  },
};

export const RuleOverlapWarningCurrentRuleIsFirst: Story = {
  args: {
    currentRuleId: '1',
    precedenceList: fourRules,
  },
};
