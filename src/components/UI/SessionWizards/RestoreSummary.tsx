import React from 'react';
import { Flex, Text, Callout } from '@radix-ui/themes';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { getMessage } from '../../../utils/i18n';
import type { RestoreResult } from '../../../utils/tabRestore';

interface RestoreSummaryProps {
  result: RestoreResult;
}

export function RestoreSummary({ result }: RestoreSummaryProps) {
  const hasErrors = result.errors.length > 0;

  return (
    <Flex direction="column" gap="3">
      <Callout.Root color={hasErrors ? 'orange' : 'green'} variant="soft">
        <Callout.Icon>
          {hasErrors ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
        </Callout.Icon>
        <Callout.Text>
          <Flex direction="column" gap="1">
            <Text size="2">
              {getMessage('restoreResultTabsCreated', [String(result.tabsCreated)])}
            </Text>
            {result.duplicatesSkipped > 0 && (
              <Text size="2">
                {getMessage('restoreResultDuplicatesSkipped', [
                  String(result.duplicatesSkipped),
                ])}
              </Text>
            )}
            {result.groupsCreated > 0 && (
              <Text size="2">
                {getMessage('restoreResultGroupsCreated', [String(result.groupsCreated)])}
              </Text>
            )}
            {result.groupsMerged > 0 && (
              <Text size="2">
                {getMessage('restoreResultGroupsMerged', [String(result.groupsMerged)])}
              </Text>
            )}
          </Flex>
        </Callout.Text>
      </Callout.Root>

      {hasErrors && (
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <AlertTriangle size={16} />
          </Callout.Icon>
          <Callout.Text>
            <Flex direction="column" gap="1">
              {result.errors.map((error, idx) => (
                <Text key={idx} size="1">
                  {error}
                </Text>
              ))}
            </Flex>
          </Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
}
