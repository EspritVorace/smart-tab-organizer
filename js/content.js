// js/content.js
function handleAuxClick(event) {
  if (event.button === 1) { // Middle-click
    let target = event.target;
    while (target && target.tagName !== 'A') { target = target.parentNode; }
    if (target && target.href && target.href.match(/^https?:\/\//)) {
      chrome.runtime.sendMessage({ type: "middleClickLink", url: target.href },
        response => { if (chrome.runtime.lastError) console.error("Msg err:", chrome.runtime.lastError.message); }
      );
    }
  }
}
document.addEventListener('auxclick', handleAuxClick, true);

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'askGroupName') {
    if (sender.id !== chrome.runtime.id) {
      console.warn('Ignored askGroupName from unknown sender', sender);
      sendResponse({ name: null });
      return;
    }
    const result = prompt(
      chrome.i18n.getMessage('promptEnterGroupName') || 'Enter group name',
      req.defaultName || ''
    );
    sendResponse({ name: result && result.trim() ? result.trim() : null });
  }
});
