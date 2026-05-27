import React, { useEffect, useMemo, useState } from 'react';
import { Kbd, Tooltip } from '@radix-ui/themes';
import { browser } from 'wxt/browser';
import { Camera, RotateCcw, Wand2 } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { loadActiveSessions, loadPinnedSessions } from '@/utils/sessionStorage';
import { getActiveTabGroupId, hasCapturableTabs } from '@/utils/tabCapture';
import { openOptionsWithHash } from '@/utils/openOptions';
import { useSettings } from '@/hooks/useSettings';
import styles from './PopupToolbar.module.css';

export interface PopupToolbarProps {
  tabCount?: number;
  activeRulesCount?: number;
  hasSessions?: boolean;
  canSave?: boolean;
  isOrganizing?: boolean;
  activeTabGroupId?: number | null;
}

function withOptionalTooltip(reason: string | undefined, node: React.ReactElement) {
  return reason ? <Tooltip content={reason}>{node}</Tooltip> : node;
}

export function PopupToolbar(props: PopupToolbarProps = {}) {
  const [tabCount, setTabCount] = useState(props.tabCount ?? 0);
  const [hasSessions, setHasSessions] = useState(props.hasSessions ?? false);
  const [canSave, setCanSave] = useState(props.canSave ?? false);
  const [isOrganizing, setIsOrganizing] = useState(props.isOrganizing ?? false);
  const [activeTabGroupId, setActiveTabGroupId] = useState<number | null>(
    props.activeTabGroupId ?? null
  );

  const { settings } = useSettings();

  const activeRulesCount = useMemo(() => {
    if (props.activeRulesCount != null) return props.activeRulesCount;
    return settings?.domainRules?.filter((r) => r.enabled).length ?? 0;
  }, [props.activeRulesCount, settings?.domainRules]);

  useEffect(() => {
    if (props.tabCount != null && props.hasSessions != null && props.canSave != null) {
      return;
    }
    if (props.hasSessions == null) {
      Promise.all([loadPinnedSessions(), loadActiveSessions()]).then(
        ([pinned, active]) => setHasSessions(pinned.length + active.length > 0),
      );
    }
    if (props.canSave == null) {
      hasCapturableTabs().then(setCanSave);
    }
    if (props.tabCount == null) {
      browser.tabs.query({ currentWindow: true }).then((tabs) => setTabCount(tabs.length));
    }
    if (props.activeTabGroupId === undefined) {
      getActiveTabGroupId().then(setActiveTabGroupId);
    }
  }, [props.tabCount, props.hasSessions, props.canSave, props.activeTabGroupId]);

  const handleOrganize = async () => {
    setIsOrganizing(true);
    await browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' });
    window.close();
  };

  const saveDisabledHint = !canSave ? getMessage('popupSaveDisabledHint') : undefined;
  const restoreDisabledHint = !hasSessions ? getMessage('popupRestoreDisabledHint') : undefined;

  const isInGroup = activeTabGroupId !== null && canSave;
  const saveHash = isInGroup
    ? `#sessions?action=snapshot&groupId=${activeTabGroupId}`
    : '#sessions?action=snapshot';
  const saveAriaLabel = isInGroup
    ? getMessage('popupSaveActiveGroup')
    : getMessage('popupSaveSession');

  const heroTitle = isOrganizing
    ? getMessage('organizingTabs')
    : getPluralMessage(tabCount, 'popupOrganizeTabsCountOne', 'popupOrganizeTabsCount');

  const heroSubtitle = getPluralMessage(
    activeRulesCount,
    'popupActiveRulesCountOne',
    'popupActiveRulesCount',
    'popupActiveRulesCountZero'
  );

  const saveButton = (
    <button
      type="button"
      data-testid="popup-toolbar-btn-save"
      className={styles.metaButton}
      aria-disabled={!canSave || undefined}
      onClick={canSave ? () => void openOptionsWithHash(saveHash) : undefined}
      aria-label={saveAriaLabel}
    >
      <Camera size={13} className={styles.metaIcon} aria-hidden="true" />
      <span className={styles.metaLabel}>{getMessage('popupSaveSession')}</span>
    </button>
  );

  const restoreButton = (
    <button
      type="button"
      data-testid="popup-toolbar-btn-restore"
      className={styles.metaButton}
      aria-disabled={!hasSessions || undefined}
      onClick={hasSessions ? () => void openOptionsWithHash('#sessions') : undefined}
      aria-label={getMessage('popupRestoreSession')}
    >
      <RotateCcw size={13} className={styles.metaIcon} aria-hidden="true" />
      <span className={styles.metaLabel}>{getMessage('popupRestoreSession')}</span>
    </button>
  );

  return (
    <div data-testid="popup-toolbar" className={styles.toolbar}>
      <button
        type="button"
        data-testid="popup-toolbar-btn-organize"
        className={styles.hero}
        aria-disabled={isOrganizing || undefined}
        onClick={isOrganizing ? undefined : () => void handleOrganize()}
        aria-label={getMessage('organizeAllTabs')}
        title={getMessage('organizeAllTabs')}
      >
        <span className={styles.heroIcon} aria-hidden="true">
          <Wand2 size={16} />
        </span>
        <span className={styles.heroBody}>
          <strong className={styles.heroTitle}>{heroTitle}</strong>
          <span className={styles.heroSubtitle}>{heroSubtitle}</span>
        </span>
        <Kbd size="1" className={styles.heroKbd} aria-label={getMessage('popupOrganizeShortcut')}>
          O
        </Kbd>
      </button>

      <div className={styles.metaRow}>
        {withOptionalTooltip(saveDisabledHint, saveButton)}
        {withOptionalTooltip(restoreDisabledHint, restoreButton)}
      </div>
    </div>
  );
}
