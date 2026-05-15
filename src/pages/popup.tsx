import React, { useCallback, useState } from 'react';
import { browser } from 'wxt/browser';
import { mountExtensionApp } from '@/utils/mountExtensionApp.js';
import { Box, Flex, Separator, Theme } from '@radix-ui/themes';
import { ThemeProvider } from 'next-themes';

import { getMessage } from '@/utils/i18n';
import { PopupHeader } from '@/components/UI/PopupHeader/PopupHeader';
import { SettingsToggles } from '@/components/UI/SettingsToggles/SettingsToggles';
import { PopupToolbar } from '@/components/UI/PopupToolbar/PopupToolbar';
import { PopupProfilesList } from '@/components/UI/PopupProfilesList/PopupProfilesList';
import { PopupWorkspaceSwitcher } from '@/components/UI/Workspace/PopupWorkspaceSwitcher';
import { ShortcutsDrawer } from '@/components/UI/ShortcutsPanel';
import { openOptionsWithHash } from '@/utils/openOptions';
import { useSettings } from '@/hooks/useSettings';
import { useShortcuts } from '@/hooks/useShortcuts';
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

  const handlePopupCreateRule = useCallback(() => {
    void openOptionsWithHash('#rules?action=create');
    window.close();
  }, []);

  const handlePopupImportRules = useCallback(() => {
    void openOptionsWithHash('#rules?action=import');
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

  useShortcuts(
    {
      'popup.save': handlePopupSave,
      'popup.restore': handlePopupRestore,
      'popup.organize': handlePopupOrganize,
      'popup.options': openOptionsPage,
      'popup.help': () => setShortcutsOpen((open) => !open),
    },
    { scope: 'page:popup' },
  );

  const hasRules = isLoaded && (settings?.domainRules?.length ?? 0) > 0;

  return (
    <ShortcutsControlProvider openShortcuts={openShortcuts} version={version}>
    <Box data-testid="popup" role="main" aria-label={getMessage('popupTitle')} width="400px" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)", overflow: "hidden" }}>
      <Box p="4">
        <Flex gap="3" direction="column" width="100%">
          <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage} />

          <PopupToolbar />

          <PopupWorkspaceSwitcher onManage={handleManageWorkspaces} />

          {isLoaded && !hasRules ? (
            <SettingsToggles
              isLoading={false}
              hasRules={false}
              onCreateRule={handlePopupCreateRule}
              onImportRules={handlePopupImportRules}
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
