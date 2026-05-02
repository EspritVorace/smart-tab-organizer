import React, { useEffect, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';
import { Camera, RotateCcw, Wand2 } from 'lucide-react';
import { getMessage, getPluralMessage } from '@/utils/i18n';
import { loadSessions } from '@/utils/sessionStorage';
import { hasCapturableTabs } from '@/utils/tabCapture';
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
      loadSessions().then((sessions) => setHasSessions(sessions.length > 0));
    }
    if (props.canSave == null) {
      hasCapturableTabs().then(setCanSave);
    }
    if (props.tabCount == null) {
      browser.tabs.query({ currentWindow: true }).then((tabs) => setTabCount(tabs.length));
    }
    if (props.activeTabGroupId === undefined) {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const groupId = (tabs[0] as { groupId?: number } | undefined)?.groupId;
        setActiveTabGroupId(typeof groupId === 'number' && groupId >= 0 ? groupId : null);
      });
    }
  }, [props.tabCount, props.hasSessions, props.canSave, props.activeTabGroupId]);

  const handleOrganize = async () => {
    setIsOrganizing(true);
    await browser.runtime.sendMessage({ type: 'ORGANIZE_ALL_TABS' });
    window.close();
  };

  const saveDisabledHint = !canSave ? getMessage('popupSaveDisabledHint') : undefined;
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

  return (
    <div data-testid="popup-toolbar" className={styles.toolbar}>
      <button
        type="button"
        data-testid="popup-toolbar-btn-organize"
        className={styles.hero}
        disabled={isOrganizing}
        onClick={() => void handleOrganize()}
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
        <kbd className={styles.heroKbd} aria-label={getMessage('popupOrganizeShortcut')}>
          O
        </kbd>
      </button>

      <div className={styles.metaRow}>
        <button
          type="button"
          data-testid="popup-toolbar-btn-save"
          className={styles.metaButton}
          disabled={!canSave}
          onClick={() => void openOptionsWithHash(saveHash)}
          aria-label={saveAriaLabel}
          title={saveDisabledHint}
        >
          <Camera size={13} aria-hidden="true" className={styles.metaIcon} />
          <span className={styles.metaLabel}>{getMessage('popupSave')}</span>
        </button>

        <button
          type="button"
          data-testid="popup-toolbar-btn-restore"
          className={styles.metaButton}
          disabled={!hasSessions}
          onClick={() => void openOptionsWithHash('#sessions')}
          aria-label={getMessage('popupRestoreSession')}
        >
          <RotateCcw size={13} aria-hidden="true" className={styles.metaIcon} />
          <span className={styles.metaLabel}>{getMessage('popupRestoreLast')}</span>
        </button>
      </div>
    </div>
  );
}
