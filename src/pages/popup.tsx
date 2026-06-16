import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { WorkspaceSwitchShortcuts } from '@/components/UI/Workspace/WorkspaceSwitchShortcuts';
import { ShortcutsDrawer } from '@/components/UI/ShortcutsPanel';
import { openOptionsWithHash } from '@/utils/openOptions';
import { markDiscovered } from '@/exploration/progressStore';
import { getActiveTabGroupId } from '@/utils/tabCapture';
import { buildSnapshotHash } from '@/utils/snapshotHash';
import { useSettings } from '@/hooks/useSettings';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useThemeToggleShortcut } from '@/hooks/useThemeToggleShortcut';
import {
  ActiveWorkspaceProvider,
  useActiveWorkspaceContext,
} from '@/contexts/ActiveWorkspaceContext.js';
import { ShortcutsControlProvider } from '@/contexts/ShortcutsControlContext';
import { StatusBar } from '@/components/UI/StatusBar/StatusBar';

export function PopupContent() {
  const { settings, isLoaded, setGlobalGroupingEnabled, setGlobalDeduplicationEnabled } = useSettings();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  // Initial focus: land on the first pinned session card when one exists, and
  // fall back to the "Organize tabs" button otherwise. PopupProfilesList focuses
  // its own first card and reports `hasPinned` here once sessions have loaded.
  const organizeButtonRef = useRef<HTMLButtonElement>(null);
  const initialFocusDoneRef = useRef(false);
  const handleProfilesLoaded = useCallback((hasPinned: boolean) => {
    if (initialFocusDoneRef.current) return;
    initialFocusDoneRef.current = true;
    if (!hasPinned) organizeButtonRef.current?.focus();
  }, []);

  const openOptionsPage = useCallback(() => {
    browser.runtime.openOptionsPage();
  }, []);

  const handlePopupCreateRule = useCallback(() => {
    void openOptionsWithHash('#rules?action=create');
    window.close();
  }, []);

  const handlePopupImportRules = useCallback(() => {
    void openOptionsWithHash('#rules?action=import-pack');
    window.close();
  }, []);

  const handlePopupSave = useCallback(async () => {
    // Mirror the toolbar Save button: when the active tab sits in a group,
    // scope the snapshot to that group so the wizard pre-fills its name and
    // filters on it. Pressing `s` must behave exactly like clicking the button.
    const groupId = await getActiveTabGroupId();
    void openOptionsWithHash(buildSnapshotHash(groupId));
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

  useThemeToggleShortcut();

  // Exploration: opening the popup is the `_execute_action` global command (the
  // only global command shipping a default keyboard binding). Chrome never
  // surfaces `_execute_action` through `browser.commands.onCommand`, so the
  // background handler cannot observe it; mark the capability here on mount.
  useEffect(() => { void markDiscovered('nav.globalCommands'); }, []);

  const hasRules = isLoaded && (settings?.domainRules?.length ?? 0) > 0;

  return (
    <ShortcutsControlProvider openShortcuts={openShortcuts}>
    <Box data-testid="popup" role="main" aria-label={getMessage('popupTitle')} width="400px" style={{ background: "var(--gray-a2)", borderRadius: "var(--radius-3)", overflow: "hidden" }}>
      <Box p="4">
        <Flex gap="3" direction="column" width="100%">
          <PopupHeader title={getMessage('popupTitle')} onSettingsOpen={openOptionsPage} />

          <PopupToolbar organizeButtonRef={organizeButtonRef} />

          <PopupWorkspaceSwitcher onManage={handleManageWorkspaces} />
          <WorkspaceSwitchShortcuts />

          {isLoaded && !hasRules ? (
            <SettingsToggles
              isLoading={false}
              hasRules={false}
              onCreateRule={handlePopupCreateRule}
              onImportRules={handlePopupImportRules}
            />
          ) : null}

          <PopupProfilesList autoFocusFirstPinned onLoaded={handleProfilesLoaded} />

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
