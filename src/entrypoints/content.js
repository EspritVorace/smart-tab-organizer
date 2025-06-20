// js/content.js
import browser from 'webextension-polyfill';
function handleAuxClick(event) {
  if (event.button === 1) { // Middle-click
    let target = event.target;
    while (target && target.tagName !== 'A') { target = target.parentNode; }
    if (target && target.href && target.href.match(/^https?:\/\//)) {
      browser.runtime.sendMessage({ type: "middleClickLink", url: target.href },
        response => { if (browser.runtime.lastError) console.error("Msg err:", browser.runtime.lastError.message); }
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
