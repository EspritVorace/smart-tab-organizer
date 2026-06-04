import { useCodeMirrorSingleLine } from '@/hooks/useCodeMirrorSingleLine';
import { domainHighlighter } from './domainHighlight';
import { createDomainEditorTheme } from './cmDomainTheme';

export interface DomainCodeFieldProps {
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
  /** Stable hook for tests / Page Objects. */
  testId?: string;
  /**
   * When true, marks the content node with `[data-autofocus]` (so `DialogShell`
   * focuses it on open) and focuses the editor on mount.
   */
  focusOnMount?: boolean;
}

const DOMAIN_LANGUAGE_EXTENSIONS = [domainHighlighter];

/**
 * Single-line CodeMirror editor that highlights a plain domain live while
 * preserving the accessibility and theming contract of a Radix `TextField`.
 *
 * Thin wrapper around `useCodeMirrorSingleLine`: the only domain-specific
 * details are the `domainHighlighter` extension and `createDomainEditorTheme`.
 */
export function DomainCodeField({
  value,
  onChange,
  id,
  placeholder,
  ariaLabel,
  hasError = false,
  describedById,
  name,
  testId = 'domain-code-field',
  focusOnMount = false,
}: DomainCodeFieldProps) {
  const { containerRef } = useCodeMirrorSingleLine({
    value,
    onChange,
    id,
    placeholder,
    ariaLabel,
    hasError,
    describedById,
    focusOnMount,
    languageExtensions: DOMAIN_LANGUAGE_EXTENSIONS,
    createTheme: createDomainEditorTheme,
  });

  return <div ref={containerRef} data-testid={testId} data-name={name} />;
}

export default DomainCodeField;
