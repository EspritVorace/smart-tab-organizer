import { syntaxHighlighting } from '@codemirror/language';
import { useCodeMirrorSingleLine } from '@/hooks/useCodeMirrorSingleLine';
import { regexLanguage, regexHighlightStyle } from './regexHighlight';
import { createRegexEditorTheme } from './cmRegexTheme';

export interface RegexCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Mirrors the wrapping `<label>` `htmlFor`; set on the editor content node. */
  id?: string;
  placeholder?: string;
  /** Accessible name for the editing area (distinct from the visible label). */
  ariaLabel: string;
  /** Toggles `aria-invalid` on the content node when the field is in error. */
  hasError?: boolean;
  /** Error element id wired onto `aria-describedby` when an error is present. */
  describedById?: string;
  /** Forwarded onto the wrapper for parity with the former input `name`. */
  name?: string;
  /** Stable hook for tests / Page Objects. Distinguishes the title vs url field. */
  testId?: string;
}

const REGEX_LANGUAGE_EXTENSIONS = [regexLanguage, syntaxHighlighting(regexHighlightStyle)];

/**
 * Single-line CodeMirror editor that highlights a regular expression live while
 * preserving the accessibility and theming contract of a Radix `TextField`.
 *
 * Thin wrapper around `useCodeMirrorSingleLine`: the only regex-specific
 * details are the language/highlight extensions and `createRegexEditorTheme`.
 */
export function RegexCodeField({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  hasError = false,
  describedById,
  name,
  testId = 'regex-code-field',
}: RegexCodeFieldProps) {
  const { containerRef } = useCodeMirrorSingleLine({
    value,
    onChange,
    id,
    placeholder,
    ariaLabel,
    hasError,
    describedById,
    languageExtensions: REGEX_LANGUAGE_EXTENSIONS,
    createTheme: createRegexEditorTheme,
  });

  return <div ref={containerRef} data-testid={testId} data-name={name} />;
}

export default RegexCodeField;
