import React from 'react';
import { Flex, Separator, Text } from '@radix-ui/themes';
import { getMessage } from '../../../../utils/i18n';

interface ClassificationGroupProps<T> {
  /** i18n key for the group title; receives a `{count}` placeholder. */
  titleKey: string;
  items: readonly T[];
  renderItem: (item: T) => React.ReactNode;
  /** Render a leading `<Separator>` when the group is non-empty. */
  showSeparator?: boolean;
  /** Optional slot inserted between the header and the item list (e.g. conflict mode selector). */
  beforeList?: React.ReactNode;
}

/**
 * Header + optional separator + items list. Nothing is rendered when the
 * items array is empty, so callers can pile three groups unconditionally.
 */
export function ClassificationGroup<T>({
  titleKey,
  items,
  renderItem,
  showSeparator = false,
  beforeList,
}: ClassificationGroupProps<T>) {
  if (items.length === 0) return null;
  return (
    <>
      {showSeparator && <Separator size="4" />}
      <Text size="3" weight="bold">
        {getMessage(titleKey).replace('{count}', String(items.length))}
      </Text>
      {beforeList}
      <Flex direction="column" gap="2">
        {items.map(renderItem)}
      </Flex>
    </>
  );
}
