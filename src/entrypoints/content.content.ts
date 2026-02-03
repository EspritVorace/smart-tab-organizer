import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser, Browser } from 'wxt/browser';
import { getMessage } from '../utils/i18n';
import type { MiddleClickMessage, AskGroupNameMessage, GroupNameResponse, ContentMessage } from '../types/messages.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: false,
  main() {
    function handleAuxClick(event: MouseEvent) {
      if (event.button === 1) {
        let target = event.target as HTMLElement | null;
        while (target && target.tagName !== 'A') {
          target = target.parentNode as HTMLElement | null;
        }
        if (target && (target as HTMLAnchorElement).href && /^https?:\/\//.test((target as HTMLAnchorElement).href)) {
          browser.runtime.sendMessage(
            { type: 'middleClickLink', url: (target as HTMLAnchorElement).href } as MiddleClickMessage,
            () => {
              if (browser.runtime.lastError)
                console.error('Msg err:', browser.runtime.lastError.message);
            }
          );
        }
      }
    }

    document.addEventListener('auxclick', handleAuxClick, true);

    browser.runtime.onMessage.addListener((req: ContentMessage, sender: Browser.runtime.MessageSender, sendResponse: (response: GroupNameResponse) => void) => {
      if (req.type === 'askGroupName') {
        if (sender.id !== browser.runtime.id) {
          console.warn('Ignored askGroupName from unknown sender', sender);
          sendResponse({ name: null });
          return;
        }
        const result = prompt(
          getMessage('promptEnterGroupName') || 'Enter group name',
          (req as AskGroupNameMessage).defaultName || ''
        );
        sendResponse({ name: result && result.trim() ? result.trim() : null });
      }
    });
  },
});
