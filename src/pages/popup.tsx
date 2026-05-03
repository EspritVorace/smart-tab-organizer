import React, { useCallback, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';
import { mountExtensionApp } from '@/utils/mountExtensionApp.js';
import { Box, Flex, Separator, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '@/utils/i18n';
import { PopupHeader } from '@/components/UI/PopupHeader/PopupHeader';
import { SettingsToggles } from '@/components/UI/SettingsToggles/SettingsToggles';
import { PopupToolbar } from '@/components/UI/PopupToolbar/PopupToolbar';
import { PopupProfilesList } from '@/components/UI/PopupProfilesList/PopupProfilesList';
import { PopupWorkspaceFooter } from '@/components/UI/Workspace/PopupWorkspaceFooter';
import { ShortcutsDrawer } from '@/components/UI/ShortcutsPanel';
import { openOptionsWithHash } from '@/utils/openOptions';
import { useSettings } from '@/hooks/useSettings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { ShortcutDefinition } from '@/utils/keyboardShortcuts';
import {
  ActiveWorkspaceProvider,
  useActiveWorkspaceContext,
} from '@/contexts/ActiveWorkspaceContext.js';
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';
import { StatusBar } from '@/components/UI/StatusBar/StatusBar';

export function PopupContent() {
  const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSettings();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const version = browser.runtime.getManifest().version;
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  const openOptionsPage = useCallback(() => {
    browser.runtime.openOptionsPage();
  }, []);

  const openRulesPage = useCallback(async (): Promise<void> => {
    const url = browser.runtime.getURL('/options.html') + '#rules';
    const tabs = await browser.tabs.query({ url: browser.runtime.getURL('/options.html') });
    if (tabs.length > 0) {
      await browser.tabs.update(tabs[0].id, { active: true, url });
      await browser.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      await browser.tabs.create({ url });
    }
    window.close();
  }, []);

  const handlePopupSave = useCallback(() => {
    void openOptionsWithHash('#sessions?action=snapshot');
  }, []);

  const handlePopupRestore = useCallback(() => {
    void openOptionsWithHash('#sessions');
  }, []);

  const handlePopupOrganize = useCallback(() => {
    browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' }).finally(() => window.close());
  }, []);

  const handleManageWorkspaces = useCallback(() => {
    void openOptionsWithHash('#workspaces');
    window.close();
  }, []);

  const shortcuts = useMemo<ShortcutDefinition[]>(() => [
    { combo: 's', action: handlePopupSave, excludeIfTargetWithin: '[data-popup-pinned-card]' },
    { combo: 'r', action: handlePopupRestore, excludeIfTargetWithin: '[data-popup-pinned-card]' },
    { combo: 'o', action: handlePopupOrganize, excludeIfTargetWithin: '[data-popup-pinned-card]' },
    { combo: '?', action: () => setShortcutsOpen((open) => !open), allowWhenDialogOpen: false },
  ], [handlePopupSave, handlePopupRestore, handlePopupOrganize]);

  useKeyboardShortcuts(shortcuts);

  const hasRules = isLoaded && (settings?.domainRules?.length ?? 0) > 0;

  return (
    <ShortcutsControlProvider openShortcuts={openShortcuts} version={version}>
    <Box data-testid="popup" role="main" aria-label={getMessage('popupTitle')} width="400px" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)", overflow: "hidden" }}>
      <Box p="4">
        <Flex gap="3" direction="column" width="100%">
          <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage} />

          <PopupToolbar />

          {isLoaded && !hasRules ? (
            <SettingsToggles
              isLoading={false}
              hasRules={false}
              onOpenRules={openRulesPage}
            />
          ) : null}

          <PopupProfilesList />

          {hasRules ? (
            <>
              <Separator size="4" />
              <SettingsToggles
                globalGroupingEnabled={settings?.globalGroupingEnabled}
                globalDeduplicationEnabled={settings?.globalDeduplicationEnabled}
                onGroupingChange={setGlobalGroupingEnabled}
                onDeduplicationChange={setGlobalDeduplicationEnabled}
                isLoading={!isLoaded}
                hasRules={true}
              />
            </>
          ) : null}

          <Separator size="4" />
          <PopupWorkspaceFooter onManage={handleManageWorkspaces} />
        </Flex>
      </Box>
      <StatusBar />
      <ShortcutsDrawer open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </Box>
    </ShortcutsControlProvider>
  );
}

function PopupThemed() {
  const { accentColor, activeId } = useActiveWorkspaceContext();
  return (
    <Theme accentColor={accentColor}>
      <div key={activeId} style={{ display: 'contents' }}>
        <PopupContent />
      </div>
    </Theme>
  );
}

export function PopupApp() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ActiveWorkspaceProvider>
        <PopupThemed />
      </ActiveWorkspaceProvider>
    </ThemeProvider>
  );
}

mountExtensionApp('popup-app', <PopupApp />);
