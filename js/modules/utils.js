// js/modules/utils.js
export function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }
export function domainToRegex(domainFilter) {
    if (!domainFilter) return null;
    try { let p = domainFilter.trim().replace(/\./g, '\\.').replace(/^\*\\\./, '([^.]+\\.)*'); return new RegExp(`^https?:\\/\\/(${p})(\\/|$)`, 'i'); }
    catch (e) { console.error("Err domainToRegex:", domainFilter, e); return null; }
}
export function matchesDomain(url, domainFilter) { const regex = domainToRegex(domainFilter); return regex ? regex.test(url || '') : false; }
export function extractGroupNameFromTitle(title, regexString) {
    if (!title || !regexString) return null;
    try { const regex = new RegExp(regexString); const match = title.match(regex); return (match && match[1]) ? match[1].trim() : null; }
    catch (e) { console.error("Err extractGroupName:", title, regexString, e); return null; }
}
export function extractGroupNameFromUrl(url, regexString) {
    if (!url || !regexString) return null;
    try { const regex = new RegExp(regexString); const match = url.match(regex); return (match && match[1]) ? match[1].trim() : null; }
    catch (e) { console.error("Err extractGroupNameFromUrl:", url, regexString, e); return null; }
}
export function isValidRegex(regex) { try { new RegExp(regex); return regex.includes('(') && regex.includes(')'); } catch (e) { return false; } }
export function isValidDomain(domain) { return domain ? /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain.trim()) : false; }