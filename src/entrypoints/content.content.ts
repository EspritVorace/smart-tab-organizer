import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: false,
  main() {
    function handleAuxClick(event: MouseEvent) {
      if (event.button === 1) {
        let target: any = event.target;
        while (target && target.tagName !== 'A') {
          target = target.parentNode;
        }
        if (target && target.href && /^https?:\/\//.test(target.href)) {
          browser.runtime.sendMessage(
            { type: 'middleClickLink', url: target.href },
            () => {
              if (browser.runtime.lastError)
                console.error('Msg err:', browser.runtime.lastError.message);
            }
          );
        }
      }
    }

    document.addEventListener('auxclick', handleAuxClick, true);

    browser.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req.type === 'askGroupName') {
        if (sender.id !== browser.runtime.id) {
          console.warn('Ignored askGroupName from unknown sender', sender);
          sendResponse({ name: null });
          return;
        }
        const result = prompt(
          browser.i18n.getMessage('promptEnterGroupName') || 'Enter group name',
          req.defaultName || ''
        );
        sendResponse({ name: result && result.trim() ? result.trim() : null });
      }
    });
  },
});
