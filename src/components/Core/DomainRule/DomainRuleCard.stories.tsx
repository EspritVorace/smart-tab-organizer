import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Theme, Box, Flex } from '@radix-ui/themes';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DomainRuleCard } from './DomainRuleCard';
import type { DomainRuleSetting } from '../../../types/syncSettings';

/* ── Mock data ──────────────────────────────────────────────────────────────── */

const baseRule: DomainRuleSetting = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  deduplicationEnabled: true,
  presetId: null,
  categoryId: 'development',
  enabled: true,
};

const noop = () => {};

const defaultProps = {
  rule: baseRule,
  index: 0,
  isSelected: false,
  searchTerm: '',
  isDragDisabled: false,
  isDomainActionDisabled: false,
  onSelect: noop,
  onToggleEnabled: noop,
  onEdit: noop,
  onDeleteRequest: noop,
  onMoveToFirst: noop,
  onMoveToLast: noop,
  onMoveToFirstOfDomain: noop,
  onMoveToLastOfDomain: noop,
  onKeyDown: noop,
};

/* ── Wrapper: DndContext required for useSortable ───────────────────────────── */

function DndWrapper({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <SortableContext items={['rule-1']} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/* ── Meta ────────────────────────────────────────────────────────────────────── */

const meta: Meta<typeof DomainRuleCard> = {
  title: 'Components/Core/DomainRule/DomainRuleCard',
  component: DomainRuleCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <Theme>
        <Box style={{ maxWidth: 680 }}>
          <DndWrapper>
            <Story />
          </DndWrapper>
        </Box>
      </Theme>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Stories ─────────────────────────────────────────────────────────────────── */

export const DomainRuleCardDefault: Story = {
  args: defaultProps,
};

export const DomainRuleCardDisabled: Story = {
  args: {
    ...defaultProps,
    rule: { ...baseRule, enabled: false },
  },
};

export const DomainRuleCardSelected: Story = {
  args: {
    ...defaultProps,
    isSelected: true,
  },
};

export const DomainRuleCardDragDisabled: Story = {
  name: 'DomainRuleCard — Drag Disabled (search active)',
  args: {
    ...defaultProps,
    isDragDisabled: true,
    searchTerm: 'git',
  },
};

export const DomainRuleCardDomainActionsDisabled: Story = {
  name: 'DomainRuleCard — Domain Actions Disabled (unique domain)',
  args: {
    ...defaultProps,
    isDomainActionDisabled: true,
  },
};

export const DomainRuleCardWithSearch: Story = {
  name: 'DomainRuleCard — Search Highlight',
  args: {
    ...defaultProps,
    searchTerm: 'git',
    isDragDisabled: true,
  },
};

export const DomainRuleCardListSortable: Story = {
  name: 'DomainRuleCard — Sortable List (3 rules)',
  render: () => {
    const rules: DomainRuleSetting[] = [
      { ...baseRule, id: 'rule-1', label: 'GitHub', domainFilter: 'github.com' },
      { ...baseRule, id: 'rule-2', label: 'GitLab', domainFilter: 'gitlab.com', categoryId: null },
      { ...baseRule, id: 'rule-3', label: 'Bitbucket', domainFilter: 'bitbucket.org', categoryId: null, enabled: false },
    ];
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    return (
      <Theme>
        <Box style={{ maxWidth: 680 }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter}>
            <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <Flex direction="column" gap="3">
                {rules.map((rule, index) => (
                  <DomainRuleCard
                    key={rule.id}
                    {...defaultProps}
                    rule={rule}
                    index={index}
                    isDomainActionDisabled={false}
                  />
                ))}
              </Flex>
            </SortableContext>
          </DndContext>
        </Box>
      </Theme>
    );
  },
};
