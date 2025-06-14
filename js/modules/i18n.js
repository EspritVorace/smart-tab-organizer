// js/modules/i18n.js
export function getMessage(key, substitutions = undefined) {
  try { return chrome.i18n.getMessage(key, substitutions); }
  catch (e) { console.warn(`Clé i18n ${key} introuvable.`); return key; }
}
export function applyTranslations(element = document.body) {
    element.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        const message = getMessage(key);
        if (message) { el[attr || 'textContent'] = message; }
    });
}