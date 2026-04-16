import React, { useState, useEffect } from 'react';
import { Callout, IconButton, Box, Strong } from '@radix-ui/themes';
import { Info, X } from 'lucide-react';
import { getMessage } from '@/utils/i18n';
import { getSessionsHelpPrefs, updateSessionsHelpPrefs } from '@/utils/sessionsHelpPrefs';

/**
 * Dismissable intro callout shown at the top of the Sessions section.
 * Persists the hidden state in browser.storage.local.
 */
export function SessionsIntroCallout() {
  const [hidden, setHidden] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    getSessionsHelpPrefs().then(prefs => setHidden(prefs.sessionsIntroHidden));
  }, []);

  async function handleDismiss() {
    setHidden(true);
    await updateSessionsHelpPrefs({ sessionsIntroHidden: true });
  }

  // Don't render while loading or if already dismissed
  if (hidden !== false) return null;

  return (
    <Box style={{ position: 'relative' }} mb="3">
      <Callout.Root color="blue" variant="soft" style={{ paddingRight: 40 }}>
        <Callout.Icon>
          <Info size={16} aria-hidden="true" />
        </Callout.Icon>
        <Callout.Text>
          <Strong>{getMessage('sessionsIntroTitle')}</Strong>
          {' — '}
          {getMessage('sessionsIntroBody')}
        </Callout.Text>
      </Callout.Root>
      <Box style={{ position: 'absolute', top: 8, right: 8 }}>
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          onClick={handleDismiss}
          aria-label={getMessage('close')}
        >
          <X size={14} aria-hidden="true" />
        </IconButton>
      </Box>
    </Box>
  );
}
