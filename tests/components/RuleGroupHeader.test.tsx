import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';

vi.mock('../../src/utils/i18n', () => ({
  getMessage: vi.fn((key: string, subs?: string[]) =>
    subs?.length ? `${key}(${subs.join(',')})` : key,
  ),
}));

import { RuleGroupHeader } from '../../src/components/Core/DomainRule/RuleGroupHeader';
import type { RuleViewGroup } from '../../src/utils/ruleViewUtils';

const group: RuleViewGroup = {
  key: 'color:blue',
  kind: 'color',
  label: 'Blue',
  color: 'blue',
  ruleIds: ['r1', 'r2', 'r3'],
  rules: [],
  isDndEnabled: false,
};

function renderHeader(props: Partial<React.ComponentProps<typeof RuleGroupHeader>> = {}) {
  return render(
    <Theme>
      <Collapsible.Root open>
        <RuleGroupHeader
          group={group}
          collapsed={false}
          selectedCount={0}
          onSelectGroup={vi.fn()}
          testId="page-rules-group-color:blue"
          {...props}
        />
      </Collapsible.Root>
    </Theme>,
  );
}

describe('RuleGroupHeader', () => {
  it('tags the toggle button as a shared navigation item in the rule-group scope', () => {
    renderHeader();
    const toggle = screen.getByTestId('page-rules-group-color:blue-toggle');
    expect(toggle).toHaveAttribute('data-rules-nav-item', '');
    expect(toggle).toHaveAttribute('data-shortcut-scope', 'widget:rule-group');
  });

  it('forwards keydown events on the toggle button to onKeyDown', () => {
    const onKeyDown = vi.fn();
    renderHeader({ onKeyDown });
    const toggle = screen.getByTestId('page-rules-group-color:blue-toggle');
    fireEvent.keyDown(toggle, { key: 'ArrowRight' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowRight');
  });
});
