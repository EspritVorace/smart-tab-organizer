/**
 * Test seam for driving the lazily mounted {@link DomainCodeField}. The domain
 * editor shares CodeMirror's no-`<input>` shape with `RegexCodeField`, so it
 * reuses the same generic seam (it operates purely by `data-testid`).
 */
export {
  setRegexFieldValue as setDomainFieldValue,
  waitForRegexField as waitForDomainField,
} from '@/components/UI/RegexCodeField/setRegexFieldValue';
