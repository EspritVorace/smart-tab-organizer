import React from 'react';
import { Flex, Kbd, Text } from '@radix-ui/themes';
import { getMessage } from '@/utils/i18n';
import { tokenizeComboForDisplay, formatSequenceForA11y } from '@/utils/shortcutDisplay';
import styles from './SequenceIndicator.module.css';

interface SequenceIndicatorProps {
  /** Active sequence prefix (canonical combos), or null when no prefix is active. */
  activePrefix: string[] | null;
}

export function SequenceIndicator({ activePrefix }: SequenceIndicatorProps) {
  if (!activePrefix || activePrefix.length === 0) return null;

  const separator = getMessage('shortcutSequenceSeparator');
  const a11yLabel = formatSequenceForA11y(activePrefix, separator);
  const announcement = getMessage('shortcutSequenceActiveAnnouncement', a11yLabel);

  return (
    <div
      className={styles.root}
      data-testid="sequence-indicator"
      role="status"
      aria-live="polite"
    >
      <span className={styles.srOnly}>{announcement}</span>
      <Flex gap="2" align="center" aria-hidden="true">
        {activePrefix.map((combo, i) => (
          <React.Fragment key={`${combo}-${i}`}>
            {i > 0 && (
              <Text size="1" color="gray" className={styles.separator}>
                {separator}
              </Text>
            )}
            <Flex gap="1" align="center">
              {tokenizeComboForDisplay(combo).map((token, j) => (
                <Kbd key={`${token.display}-${j}`} size="2">{token.display}</Kbd>
              ))}
            </Flex>
          </React.Fragment>
        ))}
        <Text size="2" color="gray" className={styles.ellipsis}>…</Text>
      </Flex>
    </div>
  );
}
