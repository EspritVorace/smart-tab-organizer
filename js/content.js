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